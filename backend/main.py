"""
AutoVisio Studio — FastAPI Backend
Deployed on Hugging Face Spaces (Docker SDK)

Endpoints:
  POST /process          — single image background removal + compositing
  POST /process/batch    — batch processing (up to 20 images)
  GET  /health           — health check
  GET  /backgrounds      — list available built-in backgrounds
"""

import os
import io
import time
import uuid
import logging
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi.staticfiles import StaticFiles

from PIL import Image, ImageFilter, ImageEnhance
import pillow_heif  # HEIC support
from rembg import remove, new_session
import httpx

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("autovisio")

# ── Register HEIC opener ───────────────────────────────────────────────────────
pillow_heif.register_heif_opener()

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AutoVisio Studio API",
    description="AI-powered automotive photo enhancement backend",
    version="1.0.0",
)

# ── CORS — allow your Expo Web + Netlify domains ──────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── rembg session (loaded once at startup) ────────────────────────────────────
# Using u2net model — best balance of speed & quality for cars
REMBG_SESSION = None

@app.on_event("startup")
async def load_model():
    global REMBG_SESSION
    logger.info("Loading rembg u2net model…")
    REMBG_SESSION = new_session("u2net")
    logger.info("Model loaded successfully ✓")

# ── Built-in background assets ────────────────────────────────────────────────
BACKGROUNDS_DIR = Path("backgrounds")
BACKGROUNDS_DIR.mkdir(exist_ok=True)

BUILTIN_BACKGROUNDS = [
    {"id": "showroom_dark",    "name": "Dark Showroom",     "category": "Showroom",  "color": "#1a1a1a"},
    {"id": "showroom_white",   "name": "White Showroom",    "category": "Showroom",  "color": "#f5f5f5"},
    {"id": "showroom_carbon",  "name": "Carbon Studio",     "category": "Studio",    "color": "#111111"},
    {"id": "gradient_gold",    "name": "Gold Gradient",     "category": "Gradient",  "color": "#2a1f00"},
    {"id": "gradient_blue",    "name": "Midnight Blue",     "category": "Gradient",  "color": "#0a0a1a"},
    {"id": "outdoor_sunset",   "name": "Desert Sunset",     "category": "Outdoor",   "color": "#3d1f00"},
    {"id": "outdoor_mountain", "name": "Mountain Road",     "category": "Outdoor",   "color": "#1a2a1a"},
    {"id": "studio_grey",      "name": "Studio Grey",       "category": "Studio",    "color": "#2d2d2d"},
]

# Background solid colors for when no image file is present
BACKGROUND_COLORS = {
    "showroom_dark":    (26, 26, 26),
    "showroom_white":   (245, 245, 245),
    "showroom_carbon":  (17, 17, 17),
    "gradient_gold":    (42, 31, 0),
    "gradient_blue":    (10, 10, 26),
    "outdoor_sunset":   (61, 31, 0),
    "outdoor_mountain": (26, 42, 26),
    "studio_grey":      (45, 45, 45),
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def open_image_safe(data: bytes) -> Image.Image:
    """Open image bytes — handles JPG, PNG, WEBP, HEIC."""
    return Image.open(io.BytesIO(data)).convert("RGBA")


def remove_background(img: Image.Image) -> Image.Image:
    """Run rembg on an RGBA image and return masked RGBA."""
    if REMBG_SESSION is None:
        raise RuntimeError("rembg model not loaded")
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="PNG")
    buf.seek(0)
    result_bytes = remove(buf.read(), session=REMBG_SESSION)
    return Image.open(io.BytesIO(result_bytes)).convert("RGBA")


def build_background(
    width: int,
    height: int,
    bg_id: Optional[str],
    bg_url: Optional[str],
    bg_color_hex: Optional[str],
) -> Image.Image:
    """
    Resolve the background in priority order:
      1. Custom URL (fetched)
      2. Built-in bg_id (file or solid color)
      3. Custom hex color
      4. Default dark showroom
    """
    # 1. Custom URL
    if bg_url:
        try:
            resp = httpx.get(bg_url, timeout=10, follow_redirects=True)
            resp.raise_for_status()
            bg = Image.open(io.BytesIO(resp.content)).convert("RGBA")
            return bg.resize((width, height), Image.LANCZOS)
        except Exception as e:
            logger.warning(f"Failed to fetch bg_url: {e}")

    # 2. Built-in bg_id — look for image file first
    if bg_id:
        bg_file = BACKGROUNDS_DIR / f"{bg_id}.jpg"
        if not bg_file.exists():
            bg_file = BACKGROUNDS_DIR / f"{bg_id}.png"
        if bg_file.exists():
            bg = Image.open(bg_file).convert("RGBA")
            return bg.resize((width, height), Image.LANCZOS)
        # Fall back to solid color
        if bg_id in BACKGROUND_COLORS:
            rgb = BACKGROUND_COLORS[bg_id]
            bg = Image.new("RGBA", (width, height), (*rgb, 255))
            return apply_vignette(bg)

    # 3. Custom hex color
    if bg_color_hex:
        try:
            hex_clean = bg_color_hex.lstrip("#")
            rgb = tuple(int(hex_clean[i:i+2], 16) for i in (0, 2, 4))
            bg = Image.new("RGBA", (width, height), (*rgb, 255))
            return apply_vignette(bg)
        except Exception:
            pass

    # 4. Default
    bg = Image.new("RGBA", (width, height), (26, 26, 26, 255))
    return apply_vignette(bg)


def apply_vignette(bg: Image.Image) -> Image.Image:
    """Add a subtle dark vignette to solid-color backgrounds for depth."""
    from PIL import ImageDraw
    vignette = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(vignette)
    w, h = bg.size
    # Draw concentric ellipses from outside-in, darkest at edges
    steps = 40
    for i in range(steps):
        ratio = i / steps
        alpha = int(120 * (1 - ratio))
        margin_x = int(w * ratio / 2)
        margin_y = int(h * ratio / 2)
        draw.ellipse(
            [margin_x, margin_y, w - margin_x, h - margin_y],
            fill=(0, 0, 0, alpha),
        )
    return Image.alpha_composite(bg, vignette)


def add_reflection(composite: Image.Image, car_layer: Image.Image, intensity: float = 0.25) -> Image.Image:
    """Add a subtle floor reflection beneath the car."""
    w, h = composite.size

    # Flip car vertically
    reflection = car_layer.transpose(Image.FLIP_TOP_BOTTOM)

    # Fade out the reflection (top = transparent, bottom = more visible)
    fade = Image.new("L", (w, h), 0)
    for y in range(h):
        alpha = int(255 * (y / h) * intensity)
        fade.paste(alpha, (0, y, w, y + 1))

    # Apply fade mask
    r, g, b, a = reflection.split()
    a = Image.composite(Image.new("L", (w, h), 0), a, fade)
    reflection.putalpha(a)

    result = composite.copy()
    result.alpha_composite(reflection, (0, 0))
    return result


def enhance_car(car: Image.Image, sharpen: float = 1.1, contrast: float = 1.05) -> Image.Image:
    """Subtle sharpening and contrast lift on the car cutout."""
    car_rgb = car.convert("RGB")
    car_rgb = ImageEnhance.Sharpness(car_rgb).enhance(sharpen)
    car_rgb = ImageEnhance.Contrast(car_rgb).enhance(contrast)
    enhanced = car_rgb.convert("RGBA")
    enhanced.putalpha(car.split()[3])  # restore original alpha
    return enhanced


def composite_image(
    car: Image.Image,
    bg: Image.Image,
    add_shadow: bool = True,
    add_refl: bool = True,
    car_scale: float = 0.82,
    vertical_position: float = 0.6,
) -> Image.Image:
    """
    Composite the car (with alpha) onto the background.
    - car_scale: fraction of canvas width the car should occupy
    - vertical_position: 0=top, 1=bottom of canvas where car bottom sits
    """
    canvas_w, canvas_h = bg.size

    # Scale car to desired width
    target_w = int(canvas_w * car_scale)
    ratio = target_w / car.width
    target_h = int(car.height * ratio)
    car_resized = car.resize((target_w, target_h), Image.LANCZOS)

    # Center horizontally, position vertically
    x = (canvas_w - target_w) // 2
    y = int(canvas_h * vertical_position) - target_h

    result = bg.copy()

    # Drop shadow
    if add_shadow:
        shadow_layer = Image.new("RGBA", bg.size, (0, 0, 0, 0))
        shadow_car = Image.new("RGBA", car_resized.size, (0, 0, 0, 160))
        shadow_car.putalpha(car_resized.split()[3])
        shadow_car_blur = shadow_car.filter(ImageFilter.GaussianBlur(radius=18))
        shadow_layer.alpha_composite(shadow_car_blur, (x + 6, y + 12))
        result.alpha_composite(shadow_layer)

    # Enhance car
    car_enhanced = enhance_car(car_resized)

    # Car layer
    car_layer = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    car_layer.alpha_composite(car_enhanced, (x, y))
    result.alpha_composite(car_layer)

    # Reflection
    if add_refl:
        result = add_reflection(result, car_layer, intensity=0.18)

    return result


def encode_output(img: Image.Image, output_format: str, quality: int) -> bytes:
    """Encode final image to bytes."""
    buf = io.BytesIO()
    if output_format.upper() == "WEBP":
        img.convert("RGB").save(buf, format="WEBP", quality=quality, method=6)
    elif output_format.upper() == "PNG":
        img.save(buf, format="PNG", optimize=True)
    else:
        img.convert("RGB").save(buf, format="JPEG", quality=quality, optimize=True)
    return buf.getvalue()


def get_mime_type(fmt: str) -> str:
    return {"WEBP": "image/webp", "PNG": "image/png", "JPEG": "image/jpeg"}.get(
        fmt.upper(), "image/jpeg"
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": REMBG_SESSION is not None,
        "version": "1.0.0",
        "timestamp": time.time(),
    }


@app.get("/backgrounds")
async def list_backgrounds():
    return {"backgrounds": BUILTIN_BACKGROUNDS}


@app.post("/process")
async def process_single(
    image: UploadFile = File(..., description="Car photo (JPG, PNG, WEBP, HEIC)"),
    bg_id: Optional[str] = Form(None, description="Built-in background ID"),
    bg_url: Optional[str] = Form(None, description="Custom background image URL"),
    bg_color: Optional[str] = Form(None, description="Hex color e.g. #1a1a1a"),
    output_format: str = Form("WEBP", description="WEBP | JPEG | PNG"),
    quality: int = Form(88, description="Output quality 60-100"),
    add_shadow: bool = Form(True),
    add_reflection: bool = Form(True),
    car_scale: float = Form(0.82),
):
    """
    Process a single car image:
    1. Remove background (rembg u2net)
    2. Composite onto chosen background
    3. Add shadow + reflection
    4. Return enhanced image bytes
    """
    start = time.perf_counter()

    # Validate
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    if quality < 40 or quality > 100:
        raise HTTPException(400, "Quality must be between 40 and 100")

    try:
        raw_bytes = await image.read()
        if len(raw_bytes) > 25 * 1024 * 1024:
            raise HTTPException(413, "Image too large — max 25 MB")

        logger.info(f"Processing image: {image.filename} ({len(raw_bytes)//1024} KB)")

        # 1. Open image
        original = open_image_safe(raw_bytes)
        w, h = original.size
        logger.info(f"Image dimensions: {w}x{h}")

        # 2. Remove background
        car_cutout = remove_background(original)
        logger.info("Background removed ✓")

        # 3. Build background canvas (match input resolution, min 1920w for quality)
        canvas_w = max(w, 1920)
        canvas_h = int(canvas_w * h / w)
        bg = build_background(canvas_w, canvas_h, bg_id, bg_url, bg_color)

        # Upscale car cutout to match canvas
        car_scaled = car_cutout.resize(
            (int(car_cutout.width * canvas_w / w),
             int(car_cutout.height * canvas_h / h)),
            Image.LANCZOS,
        )

        # 4. Composite
        final = composite_image(
            car_scaled, bg,
            add_shadow=add_shadow,
            add_refl=add_reflection,
            car_scale=car_scale,
        )
        logger.info("Compositing done ✓")

        # 5. Encode
        output_bytes = encode_output(final, output_format, quality)
        elapsed = time.perf_counter() - start
        logger.info(f"Done in {elapsed:.2f}s — output {len(output_bytes)//1024} KB")

        return Response(
            content=output_bytes,
            media_type=get_mime_type(output_format),
            headers={
                "X-Processing-Time": f"{elapsed:.3f}",
                "X-Output-Size": str(len(output_bytes)),
                "X-Background": bg_id or bg_color or "custom",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Processing failed: {e}", exc_info=True)
        raise HTTPException(500, f"Processing error: {str(e)}")


@app.post("/process/batch")
async def process_batch(
    images: List[UploadFile] = File(...),
    bg_id: Optional[str] = Form(None),
    bg_url: Optional[str] = Form(None),
    bg_color: Optional[str] = Form(None),
    output_format: str = Form("WEBP"),
    quality: int = Form(88),
    add_shadow: bool = Form(True),
    add_reflection: bool = Form(True),
):
    """
    Batch process up to 20 images with the same background settings.
    Returns a JSON array of results — each with base64 image data or error.
    """
    import base64

    if len(images) > 20:
        raise HTTPException(400, "Maximum 20 images per batch")

    results = []
    for idx, img_file in enumerate(images):
        try:
            raw_bytes = await img_file.read()
            if len(raw_bytes) > 25 * 1024 * 1024:
                results.append({
                    "index": idx,
                    "filename": img_file.filename,
                    "success": False,
                    "error": "File too large (max 25 MB)",
                })
                continue

            original = open_image_safe(raw_bytes)
            w, h = original.size
            car_cutout = remove_background(original)

            canvas_w = max(w, 1920)
            canvas_h = int(canvas_w * h / w)
            bg = build_background(canvas_w, canvas_h, bg_id, bg_url, bg_color)

            car_scaled = car_cutout.resize(
                (int(car_cutout.width * canvas_w / w),
                 int(car_cutout.height * canvas_h / h)),
                Image.LANCZOS,
            )
            final = composite_image(car_scaled, bg, add_shadow=add_shadow, add_refl=add_reflection)
            output_bytes = encode_output(final, output_format, quality)

            results.append({
                "index": idx,
                "filename": img_file.filename,
                "success": True,
                "mime_type": get_mime_type(output_format),
                "data": base64.b64encode(output_bytes).decode(),
                "size_kb": len(output_bytes) // 1024,
            })
            logger.info(f"Batch [{idx+1}/{len(images)}] {img_file.filename} ✓")

        except Exception as e:
            logger.error(f"Batch item {idx} failed: {e}")
            results.append({
                "index": idx,
                "filename": img_file.filename,
                "success": False,
                "error": str(e),
            })

    success_count = sum(1 for r in results if r["success"])
    return JSONResponse({
        "total": len(images),
        "success": success_count,
        "failed": len(images) - success_count,
        "results": results,
    })

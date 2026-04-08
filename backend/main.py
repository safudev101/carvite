import os
import io
import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from PIL import Image, ImageFilter, ImageDraw, ImageOps
import pillow_heif
from rembg import remove, new_session
import httpx

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("autovisio")

pillow_heif.register_heif_opener()

app = FastAPI(title="AutoVisio Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.environ["U2NET_HOME"] = "/app/.u2net"
REMBG_SESSION = None

def get_rembg_session():
    global REMBG_SESSION
    if REMBG_SESSION is None:
        try:
            REMBG_SESSION = new_session("u2net")
            logger.info("Model loaded successfully!")
        except Exception as e:
            logger.error(f"FATAL ERROR: Could not load u2net: {e}")
            raise e 
    return REMBG_SESSION

# --- Corrected Helpers ---

def remove_background_logic(img: Image.Image) -> Image.Image:
    session = get_rembg_session()
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    input_bytes = img_byte_arr.getvalue()

    result_bytes = remove(
        input_bytes,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10
    )
    return Image.open(io.BytesIO(result_bytes)).convert("RGBA")

def build_background(width, height, bg_url=None, bg_color_hex=None) -> Image.Image:
    # Check if bg_url is valid and not empty string
    if bg_url and str(bg_url).strip().startswith("http"):
        try:
            # Sync client inside async route can be tricky, using simple request
            with httpx.Client(follow_redirects=True) as client:
                resp = client.get(bg_url, timeout=15)
                if resp.status_code == 200:
                    bg = Image.open(io.BytesIO(resp.content)).convert("RGBA")
                    # Use cover-style resize to maintain aspect ratio
                    return ImageOps.fit(bg, (width, height), Image.Resampling.LANCZOS)
        except Exception as e:
            logger.warning(f"BG URL failed: {e}, using fallback color.")

    # Default color: Dark Grey
    color = (26, 26, 26, 255) 
    if bg_color_hex and bg_color_hex.startswith("#"):
        try:
            h = bg_color_hex.lstrip('#')
            color = tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)
        except: pass

    return Image.new("RGBA", (width, height), color)

def composite_image(car: Image.Image, bg: Image.Image, car_scale=0.82) -> Image.Image:
    cw, ch = bg.size
    
    # 1. Scale car proportionally
    target_w = int(cw * car_scale)
    ratio = target_w / car.width
    target_h = int(car.height * ratio)
    car_res = car.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # 2. Position car: Grounded logic
    # Car ko niche se 8% margin par rakho takay "pavement" ya ground nazar aaye
    x = (cw - target_w) // 2
    y = ch - target_h - int(ch * 0.08) 

    result = bg.copy()
    
    # 3. Enhanced Contact Shadow
    shadow_canvas = Image.new("RGBA", bg.size, (0,0,0,0))
    draw = ImageDraw.Draw(shadow_canvas)

    # Shadow exact tires ke neeche honi chahiye
    shadow_w = int(target_w * 0.8)
    shadow_h = int(target_h * 0.15)
    shadow_x0 = x + (target_w - shadow_w) // 2
    shadow_y0 = y + target_h - (shadow_h // 2) - 5
    shadow_x1 = shadow_x0 + shadow_w
    shadow_y1 = shadow_y0 + shadow_h

    # Draw a dark elliptical shadow
    draw.ellipse([shadow_x0, shadow_y0, shadow_x1, shadow_y1], fill=(0,0,0,160))
    # Blur it to make it soft
    shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(18))

    # 4. Final Stacking
    result.alpha_composite(shadow_canvas)
    result.alpha_composite(car_res, (x, y))
    
    return result

# --- Routes ---

@app.post("/process")
async def process(
    image: UploadFile = File(...),
    bg_url: Optional[str] = Form(None),
    bg_color: Optional[str] = Form(None),
    output_format: str = Form("WEBP"),
    quality: int = Form(88)
):
    try:
        data = await image.read()
        img = Image.open(io.BytesIO(data)).convert("RGBA")
        
        car = remove_background_logic(img)
        # Background standard HD 1920x1080
        bg = build_background(1920, 1080, bg_url, bg_color)
        
        final = composite_image(car, bg)
        
        buf = io.BytesIO()
        if output_format.upper() in ["JPG", "JPEG"]:
            # Need to remove Alpha for JPEG
            final.convert("RGB").save(buf, format="JPEG", quality=quality)
        else:
            final.save(buf, format=output_format.upper(), quality=quality)
        
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type=f"image/{output_format.lower()}")

    except Exception as e:
        logger.error(f"Processing Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
async def root(): return {"status": "online"}

@app.get("/health")
async def health(): return {"model_loaded": REMBG_SESSION is not None}

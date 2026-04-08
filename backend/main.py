import os
import io
import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from PIL import Image, ImageFilter, ImageDraw, ImageOps, ImageEnhance
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

# --- AI & Blending Helpers ---

def remove_background_logic(img: Image.Image) -> Image.Image:
    session = get_rembg_session()
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    input_bytes = img_byte_arr.getvalue()

    # Optimized Alpha Matting for remove.bg style smoothness
    result_bytes = remove(
        input_bytes,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=15, # Slightly increased for cleaner edges
        alpha_matting_erode_size=8
    )
    
    car = Image.open(io.BytesIO(result_bytes)).convert("RGBA")
    
    # Feathering: Edges ko halka sa blur karna takay background mein blend ho jaye
    mask = car.split()[3] # Alpha channel
    mask = mask.filter(ImageFilter.GaussianBlur(1)) # Very slight blur on edge
    car.putalpha(mask)
    
    return car

def build_background(width, height, bg_url=None, bg_color_hex=None) -> Image.Image:
    if bg_url and str(bg_url).strip().startswith("http"):
        try:
            with httpx.Client(follow_redirects=True) as client:
                resp = client.get(bg_url, timeout=15)
                if resp.status_code == 200:
                    bg = Image.open(io.BytesIO(resp.content)).convert("RGBA")
                    return ImageOps.fit(bg, (width, height), Image.Resampling.LANCZOS)
        except Exception as e:
            logger.warning(f"BG URL failed: {e}, using fallback color.")

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

    # 2. Match Lighting (Blending Logic)
    # Background kitna bright hai us ke mutabiq car ko adjust karna
    stat = ImageOps.grayscale(bg).getentries()
    avg_brightness = sum(k * v for k, v in stat) / (cw * ch)
    # Bright background pe car ko bright karo, dark pe dark
    enhancer = ImageEnhance.Brightness(car_res)
    car_res = enhancer.enhance(0.9 + (avg_brightness / 512)) # Dynamic adjustment

    # 3. Positioning
    x = (cw - target_w) // 2
    y = ch - target_h - int(ch * 0.12) # Slightly higher to show more shadow depth

    result = bg.copy()
    
    # 4. Realistic Layered Shadows
    shadow_canvas = Image.new("RGBA", bg.size, (0,0,0,0))
    draw = ImageDraw.Draw(shadow_canvas)

    # A. Contact Shadow (Darkest area under tires)
    c_shadow_w = int(target_w * 0.75)
    c_shadow_h = int(target_h * 0.08)
    c_x0 = x + (target_w - c_shadow_w) // 2
    c_y0 = y + target_h - (c_shadow_h // 2)
    draw.ellipse([c_x0, c_y0, c_x0 + c_shadow_w, c_y0 + c_shadow_h], fill=(0,0,0,180))

    # B. Ambient Shadow (Softer, larger shadow)
    a_shadow_w = int(target_w * 0.9)
    a_shadow_h = int(target_h * 0.15)
    a_x0 = x + (target_w - a_shadow_w) // 2
    a_y0 = y + target_h - (a_shadow_h // 2)
    draw.ellipse([a_x0, a_y0, a_x0 + a_shadow_w, a_y0 + a_shadow_h], fill=(0,0,0,80))

    # Blur shadows
    shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(15))

    # 5. Final Assembly
    result.alpha_composite(shadow_canvas)
    result.alpha_composite(car_res, (x, y))
    
    return result

# --- Routes ---

@app.post("/process")
async def process(
    image: UploadFile = File(...),
    bg_url: Optional[str] = Form(None),
    bg_color: Optional[str] = Form(None),
    output_format: str = Form("PNG"), # Default to PNG for transparency safety
    quality: int = Form(95)
):
    try:
        data = await image.read()
        img = Image.open(io.BytesIO(data)).convert("RGBA")
        
        car = remove_background_logic(img)
        bg = build_background(1920, 1080, bg_url, bg_color)
        
        final = composite_image(car, bg)
        
        buf = io.BytesIO()
        # Ensure we always use high quality for processing
        final.save(buf, format=output_format.upper(), quality=quality, subsampling=0)
        
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type=f"image/{output_format.lower()}")

    except Exception as e:
        logger.error(f"Processing Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
async def root(): return {"status": "online"}

@app.get("/health")
async def health(): return {"model_loaded": REMBG_SESSION is not None}

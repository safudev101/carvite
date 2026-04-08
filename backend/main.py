import os
import io
import time
import logging
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse

from PIL import Image, ImageFilter, ImageEnhance
import pillow_heif
from rembg import remove, new_session
import httpx

# Logging
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

# Global Session with Lazy Loading
REMBG_SESSION = None

def get_rembg_session():
    global REMBG_SESSION
    if REMBG_SESSION is None:
        logger.info("Loading rembg model (u2net)...")
        try:
            REMBG_SESSION = new_session("u2net")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            # Fallback to loading without session if it fails
            return None
    return REMBG_SESSION

# --- Helpers ---

def remove_background(img: Image.Image) -> Image.Image:
    session = get_rembg_session()
    # rembg works best with bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    
    # Run removal
    result_bytes = remove(img_byte_arr.getvalue(), session=session)
    return Image.open(io.BytesIO(result_bytes)).convert("RGBA")

def build_background(width, height, bg_url=None, bg_color_hex=None) -> Image.Image:
    # 1. Try URL
    if bg_url:
        try:
            resp = httpx.get(bg_url, timeout=10)
            if resp.status_code == 200:
                bg = Image.open(io.BytesIO(resp.content)).convert("RGBA")
                return bg.resize((width, height), Image.LANCZOS)
        except:
            logger.warning("BG URL failed, falling back.")

    # 2. Try Hex Color
    color = (26, 26, 26, 255) # Default Dark
    if bg_color_hex:
        try:
            h = bg_color_hex.lstrip('#')
            color = tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)
        except: pass

    return Image.new("RGBA", (width, height), color)

def composite_image(car: Image.Image, bg: Image.Image, car_scale=0.85) -> Image.Image:
    cw, ch = bg.size
    # Resize car
    target_w = int(cw * car_scale)
    ratio = target_w / car.width
    target_h = int(car.height * ratio)
    car_res = car.resize((target_w, target_h), Image.LANCZOS)

    # Position car (near bottom)
    x = (cw - target_w) // 2
    y = int(ch * 0.85) - target_h # Car sits on 85% of height

    result = bg.copy()
    
    # Simple Shadow
    shadow = Image.new("RGBA", bg.size, (0,0,0,0))
    # Create a small dark ellipse under the car
    from PIL import ImageDraw
    draw = ImageDraw.Draw(shadow)
    draw.ellipse([x+50, y+target_h-20, x+target_w-50, y+target_h+20], fill=(0,0,0,100))
    shadow = shadow.filter(ImageFilter.GaussianBlur(15))
    
    result.alpha_composite(shadow)
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
        
        # 1. Remove BG
        car = remove_background(img)
        
        # 2. Build BG (1920p standard)
        bg = build_background(1920, 1080, bg_url, bg_color)
        
        # 3. Composite
        final = composite_image(car, bg)
        
        # 4. Save
        buf = io.BytesIO()
        final.convert("RGB").save(buf, format=output_format, quality=quality)
        
        return Response(content=buf.getvalue(), media_type=f"image/{output_format.lower()}")
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "alive"}

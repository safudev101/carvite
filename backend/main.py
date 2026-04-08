import os
import io
import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from PIL import Image, ImageFilter, ImageDraw, ImageOps, ImageEnhance
import pillow_heif
from rembg import remove, new_session
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("autovisio")

pillow_heif.register_heif_opener()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hugging Face storage path for models
os.environ["U2NET_HOME"] = "/app/.u2net"
REMBG_SESSION = None

def get_pro_session():
    global REMBG_SESSION
    if REMBG_SESSION is None:
        # ISNet is the goat for car edges
        REMBG_SESSION = new_session("isnet-general-use")
    return REMBG_SESSION

def remove_background_logic(img: Image.Image) -> Image.Image:
    session = get_pro_session()
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    
    result_bytes = remove(
        img_byte_arr.getvalue(),
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=12
    )
    
    car = Image.open(io.BytesIO(result_bytes)).convert("RGBA")
    # Edge Smoothing
    mask = car.split()[3].filter(ImageFilter.GaussianBlur(1.1))
    car.putalpha(mask)
    return car

def build_background(target_size, bg_url=None, bg_color_hex=None) -> Image.Image:
    if bg_url and str(bg_url).startswith("http"):
        try:
            with httpx.Client(follow_redirects=True) as client:
                resp = client.get(bg_url, timeout=10)
                if resp.status_code == 200:
                    bg = Image.open(io.BytesIO(resp.content)).convert("RGBA")
                    return ImageOps.fit(bg, target_size, Image.Resampling.LANCZOS)
        except: pass

    color = (26, 26, 26, 255)
    if bg_color_hex and bg_color_hex.startswith("#"):
        h = bg_color_hex.lstrip('#')
        color = tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)
    return Image.new("RGBA", target_size, color)

def composite_image(car: Image.Image, bg_raw: Image.Image, car_scale=0.88) -> Image.Image:
    # Use car's native resolution for the background to avoid pixelation
    bg = ImageOps.fit(bg_raw, car.size, Image.Resampling.LANCZOS)
    cw, ch = bg.size
    
    tw = int(cw * car_scale)
    th = int(car.height * (tw / car.width))
    car_res = car.resize((tw, th), Image.Resampling.LANCZOS)

    # Position
    x = (cw - tw) // 2
    y = ch - th - int(ch * 0.08)

    # Realistic Shadows
    shadow_layer = Image.new("RGBA", (cw, ch), (0,0,0,0))
    draw = ImageDraw.Draw(shadow_layer)
    draw.ellipse([x+20, y+th-20, x+tw-20, y+th+25], fill=(0,0,0,80)) # Ambient
    draw.ellipse([x+60, y+th-10, x+tw-60, y+th+12], fill=(0,0,0,160)) # Contact
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(18))

    final = bg.copy()
    final.alpha_composite(shadow_layer)
    final.alpha_composite(car_res, (x, y))
    return final

@app.post("/process")
async def process(
    image: UploadFile = File(...),
    bg_url: Optional[str] = Form(None),
    bg_color: Optional[str] = Form(None)
):
    try:
        content = await image.read()
        img = Image.open(io.BytesIO(content)).convert("RGBA")
        
        car_no_bg = remove_background_logic(img)
        # Pass car size to background builder
        bg = build_background(car_no_bg.size, bg_url, bg_color)
        
        result = composite_image(car_no_bg, bg)
        
        buf = io.BytesIO()
        result.save(buf, format="PNG")
        return Response(content=buf.getvalue(), media_type="image/png")
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
def root(): return {"status": "running on huggingface"}

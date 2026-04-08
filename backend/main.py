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

# Vercel temporary writable directory for model storage
os.environ["U2NET_HOME"] = "/tmp/.u2net"
REMBG_SESSION = None

def get_rembg_session():
    global REMBG_SESSION
    if REMBG_SESSION is None:
        try:
            # SECRET: 'isnet-general-use' car photography ke liye best model hai
            REMBG_SESSION = new_session("isnet-general-use")
            logger.info("Advanced ISNet Model loaded successfully!")
        except Exception as e:
            logger.error(f"FATAL ERROR: Could not load model: {e}")
            raise e 
    return REMBG_SESSION

# --- Advanced AI & Blending Helpers ---

def remove_background_logic(img: Image.Image) -> Image.Image:
    session = get_rembg_session()
    
    # Image ko convert karke bytes mein lena
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    input_bytes = img_byte_arr.getvalue()

    # remove.bg style alpha matting
    result_bytes = remove(
        input_bytes,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=12 # Barik edges ko handle karne ke liye
    )
    
    car = Image.open(io.BytesIO(result_bytes)).convert("RGBA")
    
    # --- Edge Smoothing Secret ---
    # Car ke edges ko sharp digital cut ke bajaye smooth banane ke liye
    mask = car.split()[3]
    mask = mask.filter(ImageFilter.GaussianBlur(1.1))
    car.putalpha(mask)
    
    return car

def build_background(width, height, bg_url=None, bg_color_hex=None) -> Image.Image:
    if bg_url and str(bg_url).strip().startswith("http"):
        try:
            with httpx.Client(follow_redirects=True) as client:
                resp = client.get(bg_url, timeout=15)
                if resp.status_code == 200:
                    bg = Image.open(io.BytesIO(resp.content)).convert("RGBA")
                    # Background ko filhal raw rakhte hain, composite mein resize karenge
                    return bg
        except Exception as e:
            logger.warning(f"BG URL failed: {e}")

    # Default color background
    color = (26, 26, 26, 255) 
    if bg_color_hex and bg_color_hex.startswith("#"):
        try:
            h = bg_color_hex.lstrip('#')
            color = tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)
        except: pass
    return Image.new("RGBA", (width, height), color)

def composite_image(car: Image.Image, bg: Image.Image, car_scale=0.88) -> Image.Image:
    # PIXELATION FIX: Background ko car ke size par scale karein (Original quality preserve)
    bg_final = ImageOps.fit(bg, car.size, Image.Resampling.LANCZOS)
    cw, ch = bg_final.size
    
    # Car scaling logic
    target_w = int(cw * car_scale)
    ratio = target_w / car.width
    target_h = int(car.height * ratio)
    
    # Sharp resize for car
    car_res = car.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Lighting match based on background brightness
    stat = ImageOps.grayscale(bg_final).getentries()
    avg_brightness = sum(k * v for k, v in stat) / (cw * ch)
    enhancer = ImageEnhance.Brightness(car_res)
    car_res = enhancer.enhance(0.95 + (avg_brightness / 512))

    # Positioning
    x = (cw - target_w) // 2
    y = ch - target_h - int(ch * 0.08)

    result = bg_final.copy()
    
    # --- Realistic Layered Shadows ---
    shadow_canvas = Image.new("RGBA", (cw, ch), (0,0,0,0))
    draw = ImageDraw.Draw(shadow_canvas)
    
    # 1. Ambient Shadow (Halki aur phaili hui)
    draw.ellipse([x+20, y+target_h-20, x+target_w-20, y+target_h+25], fill=(0,0,0,85))
    
    # 2. Contact Shadow (Gahri, tyres ke bilkul niche)
    draw.ellipse([x+60, y+target_h-10, x+target_w-60, y+target_h+12], fill=(0,0,0,160))
    
    shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(18))

    # Final Stacking (No more black background)
    result.alpha_composite(shadow_canvas)
    result.alpha_composite(car_res, (x, y))
    
    return result

# --- Routes ---

@app.post("/process")
async def process(
    image: UploadFile = File(...),
    bg_url: Optional[str] = Form(None),
    bg_color: Optional[str] = Form(None),
    output_format: str = Form("PNG"),
    quality: int = Form(95)
):
    try:
        data = await image.read()
        img = Image.open(io.BytesIO(data)).convert("RGBA")
        
        # Original car resolution se mask generate karna
        car = remove_background_logic(img)
        
        # Background standard ya URL se lena
        bg = build_background(1920, 1080, bg_url, bg_color)
        
        # High resolution composite
        final = composite_image(car, bg)
        
        buf = io.BytesIO()
        # Quality save karte waqt optimize karna
        final.save(buf, format="PNG", optimize=True)
        
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type="image/png")

    except Exception as e:
        logger.error(f"Processing Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
async def root(): return {"status": "online"}

@app.get("/health")
async def health(): return {"model_loaded": REMBG_SESSION is not None}

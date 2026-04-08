import os
import io
import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from PIL import Image, ImageFilter, ImageDraw
import pillow_heif
from rembg import remove, new_session
import httpx

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("autovisio")

# Support for HEIC images
pillow_heif.register_heif_opener()

app = FastAPI(title="AutoVisio Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Docker/HuggingFace Path Setup
os.environ["U2NET_HOME"] = "/app/.u2net"

REMBG_SESSION = None

def get_rembg_session():
    global REMBG_SESSION
    if REMBG_SESSION is None:
        logger.info(f"Loading rembg model from: {os.environ['U2NET_HOME']}")
        try:
            REMBG_SESSION = new_session("u2net")
            logger.info("Model loaded successfully!")
        except Exception as e:
            logger.error(f"FATAL ERROR: Could not load u2net: {e}")
            raise e 
    return REMBG_SESSION

# --- Helpers ---

def remove_background_logic(img: Image.Image) -> Image.Image:
    session = get_rembg_session()
    
    # 1. Image ko bytes mein convert karna (Required for rembg)
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    input_bytes = img_byte_arr.getvalue()

    # 2. Background Removal with Alpha Matting (Fixed Logic)
    # Yahan 'buf' wala error tha, maine 'input_bytes' se replace kar diya hai
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
    if bg_url:
        try:
            with httpx.Client() as client:
                resp = client.get(bg_url, timeout=10)
                if resp.status_code == 200:
                    bg = Image.open(io.BytesIO(resp.content)).convert("RGBA")
                    return bg.resize((width, height), Image.Resampling.LANCZOS)
        except Exception as e:
            logger.warning(f"BG URL failed: {e}, falling back to color.")

    # Default color: Dark Grey
    color = (26, 26, 26, 255) 
    if bg_color_hex:
        try:
            h = bg_color_hex.lstrip('#')
            color = tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)
        except: 
            pass

    return Image.new("RGBA", (width, height), color)

def composite_image(car: Image.Image, bg: Image.Image, car_scale=0.85) -> Image.Image:
    cw, ch = bg.size
    
    # Resize car proportionally
    target_w = int(cw * car_scale)
    ratio = target_w / car.width
    target_h = int(car.height * ratio)
    car_res = car.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Position car (Centered horizontally, 85% down vertically)
    x = (cw - target_w) // 2
    # Purana logic: int(ch * 0.85) - target_h 
    # Naya Logic: Background ke bottom se sirf 5% ka gap rakho
    # Isse car hawa mein nahi udegi, hamesha niche floor par rahegi.
    bottom_margin = int(ch * 0.05) 
    y = ch - target_h - bottom_margin
    #y = int(ch * 0.85) - target_h 

    result = bg.copy()
    
    # Simple Soft Shadow
    shadow = Image.new("RGBA", bg.size, (0,0,0,0))
    draw = ImageDraw.Draw(shadow)

    # Shadow ko car ke bilkul niche tires ke paas rakho
    shadow_y_start = y + target_h - 20
    shadow_y_end = y + target_h + 20
    draw.ellipse([x + 40, shadow_y_start, x + target_w - 40, shadow_y_end], fill=(0,0,0,130))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))


    #________________OLD LOGIC____________  
    # Drawing an ellipse under the tires
    # draw.ellipse([x+50, y+target_h-25, x+target_w-50, y+target_h+25], fill=(0,0,0,120))
    # shadow = shadow.filter(ImageFilter.GaussianBlur(15))
    
    result.alpha_composite(shadow)
    result.alpha_composite(car_res, (x, y))
    
    return result

# --- Routes ---

@app.get("/")
async def root():
    return {"message": "AutoVisio API is Running", "status": "online"}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": REMBG_SESSION is not None,
        "backend": "FastAPI on Docker"
    }

@app.on_event("startup")
async def startup_event():
    logger.info("AutoVisio is starting... Pre-loading AI models.")
    try:
        get_rembg_session()
    except Exception as e:
        logger.error(f"Startup Model Load Failed: {e}")

@app.post("/process")
async def process(
    image: UploadFile = File(...),
    bg_url: Optional[str] = Form(None),
    bg_color: Optional[str] = Form(None),
    output_format: str = Form("WEBP"),
    quality: int = Form(88)
):
    try:
        # Read uploaded file
        data = await image.read()
        img = Image.open(io.BytesIO(data)).convert("RGBA")
        
        # 1. Remove Background (using corrected logic)
        car = remove_background_logic(img)
        
        # 2. Build Background (1920x1080)
        bg = build_background(1920, 1080, bg_url, bg_color)
        
        # 3. Composite Car on Background
        final = composite_image(car, bg)
        
        # 4. Final Output Save
        buf = io.BytesIO()
        # Convert to RGB if saving as JPG/WEBP (as they don't always need Alpha)
        if output_format.upper() in ["JPG", "JPEG"]:
            final.convert("RGB").save(buf, format="JPEG", quality=quality)
        else:
            final.save(buf, format=output_format.upper(), quality=quality)
        
        buf.seek(0)
        return Response(content=buf.getvalue(), media_type=f"image/{output_format.lower()}")

    except Exception as e:
        logger.error(f"Processing Error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
        


# import os
# import io
# import time
# import logging
# from typing import Optional, List
# from pathlib import Path
# import os
# from rembg import new_session

# from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import Response, JSONResponse

# from PIL import Image, ImageFilter, ImageEnhance
# import pillow_heif
# from rembg import remove, new_session
# import httpx

# # Logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("autovisio")

# pillow_heif.register_heif_opener()

# app = FastAPI(title="AutoVisio Studio API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # Ensure the home path is set correctly
# #nechay wali line comment ki hai
# #os.environ["U2NET_HOME"] = os.path.join(os.getcwd(), ".u2net")
# # Forcefully tell rembg where the model is
# os.environ["U2NET_HOME"] = "/app/.u2net"

# # Global Session with Lazy Loading
# REMBG_SESSION = None

# def get_rembg_session():
#     global REMBG_SESSION
#     if REMBG_SESSION is None:
#         logger.info(f"Loading rembg model from: {os.environ['U2NET_HOME']}")
#         try:
#             # Ab ye specific path se uthaye ga
#             REMBG_SESSION = new_session("u2net")
#             logger.info("Model loaded successfully!")
#         except Exception as e:
#             logger.error(f"FATAL ERROR: Could not load u2net: {e}")
#             # Isay None return mat karo balkay error throw karo 
#             # taake aapko pata chalay ke masla kya hai
#             raise e 
#     return REMBG_SESSION
# # def get_rembg_session():
# #     global REMBG_SESSION
# #     if REMBG_SESSION is None:
# #         logger.info("Loading rembg model (u2net)...")
# #         try:
# #             REMBG_SESSION = new_session("u2net")
# #         except Exception as e:
# #             logger.error(f"Failed to load model: {e}")
# #             # Fallback to loading without session if it fails
# #             return None
# #     return REMBG_SESSION

# # --- Helpers ---

# def remove_background(img: Image.Image) -> Image.Image:
#     session = get_rembg_session()
#     # rembg works best with bytes
#     img_byte_arr = io.BytesIO()
#     img.save(img_byte_arr, format='PNG')

#     # Alpha Matting enable kar di hai yahan
#     result_bytes = remove(
#         buf.read(), 
#         session=session,
#         alpha_matting=True,
#         alpha_matting_foreground_threshold=240,
#         alpha_matting_background_threshold=10,
#         alpha_matting_erode_size=10
#     )
#     return Image.open(io.BytesIO(result_bytes)).convert("RGBA")
    
#     # Run removal
#     result_bytes = remove(img_byte_arr.getvalue(), session=session)
#     return Image.open(io.BytesIO(result_bytes)).convert("RGBA")

# def build_background(width, height, bg_url=None, bg_color_hex=None) -> Image.Image:
#     # 1. Try URL
#     if bg_url:
#         try:
#             resp = httpx.get(bg_url, timeout=10)
#             if resp.status_code == 200:
#                 bg = Image.open(io.BytesIO(resp.content)).convert("RGBA")
#                 return bg.resize((width, height), Image.LANCZOS)
#         except:
#             logger.warning("BG URL failed, falling back.")

#     # 2. Try Hex Color
#     color = (26, 26, 26, 255) # Default Dark
#     if bg_color_hex:
#         try:
#             h = bg_color_hex.lstrip('#')
#             color = tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)
#         except: pass

#     return Image.new("RGBA", (width, height), color)

# def composite_image(car: Image.Image, bg: Image.Image, car_scale=0.85) -> Image.Image:
#     cw, ch = bg.size
#     # Resize car
#     target_w = int(cw * car_scale)
#     ratio = target_w / car.width
#     target_h = int(car.height * ratio)
#     car_res = car.resize((target_w, target_h), Image.LANCZOS)

#     # Position car (near bottom)
#     x = (cw - target_w) // 2
#     y = int(ch * 0.85) - target_h # Car sits on 85% of height

#     result = bg.copy()
    
#     # Simple Shadow
#     shadow = Image.new("RGBA", bg.size, (0,0,0,0))
#     # Create a small dark ellipse under the car
#     from PIL import ImageDraw
#     draw = ImageDraw.Draw(shadow)
#     draw.ellipse([x+50, y+target_h-20, x+target_w-50, y+target_h+20], fill=(0,0,0,100))
#     shadow = shadow.filter(ImageFilter.GaussianBlur(15))
    
#     result.alpha_composite(shadow)
#     result.alpha_composite(car_res, (x, y))
    
#     return result

# # --- Routes ---

# @app.post("/process")
# async def process(
#     image: UploadFile = File(...),
#     bg_url: Optional[str] = Form(None),
#     bg_color: Optional[str] = Form(None),
#     output_format: str = Form("WEBP"),
#     quality: int = Form(88)
# ):
#     try:
#         data = await image.read()
#         img = Image.open(io.BytesIO(data)).convert("RGBA")
        
#         # 1. Remove BG
#         car = remove_background(img)
        
#         # 2. Build BG (1920p standard)
#         bg = build_background(1920, 1080, bg_url, bg_color)
        
#         # 3. Composite
#         final = composite_image(car, bg)
        
#         # 4. Save
#         buf = io.BytesIO()
#         final.convert("RGB").save(buf, format=output_format, quality=quality)
        
#         return Response(content=buf.getvalue(), media_type=f"image/{output_format.lower()}")
#     except Exception as e:
#         logger.error(f"Error: {e}")
#         raise HTTPException(status_code=500, detail=str(e))


# # main.py mein ye routes update karo

# @app.get("/")
# async def root():
#     return {"message": "AutoVisio API is Running", "status": "online"}

# @app.on_event("startup")
# async def startup_event():
#     logger.info("AutoVisio is starting... Pre-loading AI models.")
#     try:
#         # Ye function aapke model ko load kar ke global variable mein save kar dega
#         get_rembg_session() 
#         logger.info("AI Model loaded and ready to use!")
#     except Exception as e:
#         logger.error(f"Startup Model Load Failed: {e}")

# @app.get("/health")
# async def health():
#     return {
#         "status": "ok",
#         "model_loaded": REMBG_SESSION is not None,
#         "backend": "FastAPI on Docker"
#     }



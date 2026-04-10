from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
import os
import shutil
import io
import time
import sys
from pathlib import Path
import requests as http_requests

# Path Setup
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

# Import your core engine
from core import processor

app = FastAPI()

# CORS Fix for Mobile/Web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_dirs():
    base_dir = Path("images")
    input_dir = base_dir / "input"
    output_dir = base_dir / "output"
    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    return input_dir, output_dir

@app.get("/")
def health_check():
    return {"status": "active", "service": "CarVite AI"}

@app.post("/process")
@app.post("/upload-image")
async def process_car_image(
    image: UploadFile = File(...),
    action: str = Form("remove"),  # 'remove' or 'replace'
    bg_color: str = Form(None),
    bg_url: str = Form(None),
):
    input_dir, output_dir = get_dirs()
    
    # Save original image with unique ID
    file_id = int(time.time() * 1000)
    file_extension = Path(image.filename).suffix or ".jpg"
    input_filename = f"in_{file_id}{file_extension}"
    input_path = input_dir / input_filename
    
    try:
        with input_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save error: {str(e)}")

    try:
        # 1. Core Background Removal
        # Isnet model use ho raha hai car cutout nikalne k liye
        processed_img, _ = processor.process_image(str(input_path), model_name="isnet-general-use")
        processed_img = processed_img.convert("RGBA")

        output_filename = f"out_{file_id}.png"
        output_path = output_dir / output_filename

        # 2. Case: JUST REMOVE BACKGROUND (Transparent PNG)
        if action == "remove":
            processed_img.save(output_path, "PNG")
            return FileResponse(str(output_path), media_type="image/png")

        # 3. Case: ENHANCE / REPLACE BACKGROUND
        # Agar user ne color ya URL diya hai toh replace karega
        final_img = processed_img # Fallback

        if bg_url:
            try:
                bg_res = http_requests.get(bg_url, timeout=10)
                bg_res.raise_for_status()
                bg_img = Image.open(io.BytesIO(bg_res.content)).convert("RGBA")
                bg_img = bg_img.resize(processed_img.size, Image.LANCZOS)
                
                # Combine layers
                combined = Image.new("RGBA", processed_img.size)
                combined.paste(bg_img, (0, 0))
                combined.paste(processed_img, (0, 0), processed_img)
                final_img = combined
            except Exception as e:
                print(f"BG URL Error: {e}")
                # Agar background fail ho jaye toh sirf cutout bhej do bajaye crash hone k
                final_img = processed_img

        elif bg_color:
            try:
                # Color code like '#FFFFFF' or 'red'
                bg_img = Image.new("RGBA", processed_img.size, bg_color)
                bg_img.paste(processed_img, (0, 0), processed_img)
                final_img = bg_img
            except Exception as e:
                print(f"BG Color Error: {e}")
                final_img = processed_img

        # Save and Send
        final_img.save(output_path, "PNG")
        return FileResponse(str(output_path), media_type="image/png")

    except Exception as e:
        print(f"AI Processor Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        image.file.close()

# Special endpoint for custom background uploads
@app.post("/replace-background")
async def replace_custom_bg(
    image: UploadFile = File(...),
    background: UploadFile = File(...),
    car_size: float = Form(0.65),
    smart_placement: bool = Form(True)
):
    input_dir, output_dir = get_dirs()
    file_id = int(time.time())
    
    fg_path = input_dir / f"fg_{file_id}_{image.filename}"
    bg_path = input_dir / f"bg_{file_id}_{background.filename}"
    
    with fg_path.open("wb") as f: shutil.copyfileobj(image.file, f)
    with bg_path.open("wb") as b: shutil.copyfileobj(background.file, b)

    try:
        result_img = processor.replace_background(
            foreground_input=str(fg_path),
            background_input=str(bg_path),
            target_car_ratio=car_size,
            smart_placement=smart_placement
        )
        
        output_path = output_dir / f"custom_{file_id}.png"
        result_img.save(output_path, "PNG")
        return FileResponse(str(output_path), media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

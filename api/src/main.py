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

# --- Path Setup ---
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

# Import your core engine
try:
    from core import processor
except ImportError:
    print("Error: 'core.processor' nahi mila. Check karein ke 'core' folder sahi jagah hai.")

app = FastAPI()

# --- CORS Fix (Sirf ek baar clean code) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
    return {"status": "active", "service": "CarVite AI Backend"}

# --- Main Processing Endpoint ---
# Dono routes add kar diye hain taake frontend jo bhi call kare chal jaye
@app.post("/process")
@app.post("/upload-image")
async def process_car_image(
    image: UploadFile = File(...),
    action: str = Form("remove"),  # Default: remove background
    bg_color: str = Form(None),
    bg_url: str = Form(None),
):
    input_dir, output_dir = get_dirs()
    file_id = int(time.time() * 1000)
    
    # Save Input Image
    ext = Path(image.filename).suffix or ".jpg"
    input_path = input_dir / f"in_{file_id}{ext}"
    
    with input_path.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        # 1. Background Remove (Hamesha pehle cutout nikalte hain)
        processed_img, _ = processor.process_image(str(input_path), model_name="isnet-general-use")
        processed_img = processed_img.convert("RGBA")
        
        output_path = output_dir / f"out_{file_id}.png"

        # 2. Logic: Sirf Remove karna hai ya Replace?
        if action == "remove" and not bg_url and not bg_color:
            # Sirf Transparent PNG save karo
            processed_img.save(output_path, "PNG")
        
        else:
            # Background Replacement Logic
            final_img = processed_img
            
            if bg_url:
                # Agar URL se background lagana hai
                bg_res = http_requests.get(bg_url, timeout=10)
                bg_img = Image.open(io.BytesIO(bg_res.content)).convert("RGBA")
                bg_img = bg_img.resize(processed_img.size, Image.LANCZOS)
                final_img = Image.alpha_composite(bg_img, processed_img)
            
            elif bg_color:
                # Agar solid color lagana hai
                bg_img = Image.new("RGBA", processed_img.size, bg_color)
                final_img = Image.alpha_composite(bg_img, processed_img)
            
            final_img.save(output_path, "PNG")

        return FileResponse(str(output_path), media_type="image/png")

    except Exception as e:
        print(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        image.file.close()

# --- Custom Background Upload Endpoint ---
@app.post("/replace-background")
async def replace_custom_bg(
    image: UploadFile = File(..., description="Car Image"),
    background: UploadFile = File(..., description="Custom BG Image"),
    car_size: float = Form(0.65),
    smart_placement: bool = Form(True)
):
    input_dir, output_dir = get_dirs()
    file_id = int(time.time() * 1000)
    
    fg_path = input_dir / f"fg_{file_id}_{image.filename}"
    bg_path = input_dir / f"bg_{file_id}_{background.filename}"
    output_path = output_dir / f"final_{file_id}.png"
    
    with fg_path.open("wb") as f: shutil.copyfileobj(image.file, f)
    with bg_path.open("wb") as b: shutil.copyfileobj(background.file, b)

    try:
        # Core replacement function call
        result_img = processor.replace_background(
            foreground_input=str(fg_path),
            background_input=str(bg_path),
            target_car_ratio=car_size,
            smart_placement=smart_placement
        )
        
        result_img.save(output_path, "PNG")
        return FileResponse(str(output_path), media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        image.file.close()
        background.file.close()

# --- Serve Processed Images (Just in case) ---
@app.get("/output/{filename}")
def get_output(filename: str):
    _, output_dir = get_dirs()
    file_path = output_dir / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

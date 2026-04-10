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

# --- CORS Fix ---
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

# --- Main Processing Endpoint (For Background Removal or URL Replacement) ---
@app.post("/process")
@app.post("/upload-image")
async def process_car_image(
    image: UploadFile = File(...),
    action: str = Form("remove"),
    bg_color: str = Form(None),
    bg_url: str = Form(None),
    model_name: str = Form("isnet-general-use") # Added model_name support
):
    input_dir, output_dir = get_dirs()
    file_id = int(time.time() * 1000)
    
    ext = Path(image.filename).suffix or ".jpg"
    input_path = input_dir / f"in_{file_id}{ext}"
    
    with input_path.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        # 1. Background Remove
        processed_img, _ = processor.process_image(str(input_path), model_name=model_name)
        processed_img = processed_img.convert("RGBA")
        
        output_path = output_dir / f"out_{file_id}.png"

        ✅ FIXED LOGIC: Strict check for remove action
        # Hum ensure kar rahe hain ke agar action 'remove' hai, toh baqi cheezein ignore hon
        is_only_remove = action == "remove" and (not bg_url or bg_url == "") and (not bg_color or bg_color == "")

        if is_only_remove:
            # Sirf transparent PNG save karein
            processed_img.save(output_path, "PNG", optimize=True)
        else:
            final_img = processed_img
            # Check karein ke bg_url sach mein valid hai ya nahi
            if bg_url and str(bg_url).startswith("http"):
                bg_res = http_requests.get(bg_url, timeout=10)
                bg_img = Image.open(io.BytesIO(bg_res.content)).convert("RGBA")
                bg_img = bg_img.resize(processed_img.size, Image.LANCZOS)
                final_img = Image.alpha_composite(bg_img, processed_img)
            # Check karein ke bg_color sach mein valid hai ya nahi
            elif bg_color and bg_color != "undefined" and bg_color != "null":
                bg_img = Image.new("RGBA", processed_img.size, bg_color)
                final_img = Image.alpha_composite(bg_img, processed_img)
            
            final_img.save(output_path, "PNG", optimize=True)

        return FileResponse(str(output_path), media_type="image/png")
    except Exception as e:
        print(f"AI Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        image.file.close()

# --- Custom Background Upload Endpoint (Fixed for missing model_name) ---
@app.post("/replace-background")
async def replace_custom_bg(
    image: UploadFile = File(..., description="Car Image"),
    background: UploadFile = File(..., description="Custom BG Image"),
    car_size: float = Form(0.65),
    smart_placement: bool = Form(True),
    model_name: str = Form("isnet-general-use") # <--- Yahan ye zaroori hai!
):
    input_dir, output_dir = get_dirs()
    file_id = int(time.time() * 1000)
    
    fg_path = input_dir / f"fg_{file_id}_{image.filename}"
    bg_path = input_dir / f"bg_{file_id}_{background.filename}"
    output_path = output_dir / f"final_{file_id}.png"
    
    with fg_path.open("wb") as f: shutil.copyfileobj(image.file, f)
    with bg_path.open("wb") as b: shutil.copyfileobj(background.file, b)

    try:
        # Added model_name argument to fix the "missing positional argument" error
        result_img = processor.replace_background(
            foreground_input=str(fg_path),
            background_input=str(bg_path),
            target_car_ratio=car_size,
            smart_placement=smart_placement,
            model_name=model_name # <--- Ye argument pass hona chahiye
        )
        
        result_img.save(output_path, "PNG")
        return FileResponse(str(output_path), media_type="image/png")

    except Exception as e:
        print(f"Replacement Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        image.file.close()
        background.file.close()

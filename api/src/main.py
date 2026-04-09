from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
import os, shutil, io, time, sys
from pathlib import Path
import requests as http_requests

# Paths and imports
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))
from src.constants import ALLOWED_EXTENSIONS
from core import processor

app = FastAPI()

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

@app.post("/process")
@app.post("/upload-image")
async def upload_image(
    image: UploadFile = File(...),
    action: str = Form("remove"), # ✅ Mandatory: 'remove' or 'replace'
    bg_color: str = Form(None),
    bg_url: str = Form(None),
):
    input_dir, output_dir = get_dirs()
    
    # Save Input
    file_id = int(time.time())
    input_path = input_dir / f"{file_id}_{image.filename}"
    with input_path.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        # 1. Background Removal (Hamesha hoti hai car nikalne k liye)
        processed_img, _ = processor.process_image(str(input_path), model_name="isnet-general-use")
        processed_img = processed_img.convert("RGBA")

        output_path = output_dir / f"out_{file_id}.png"

        # 2. Agar sirf Remove BG chahiye
        if action == "remove":
            processed_img.save(output_path, "PNG")
            return FileResponse(str(output_path), media_type="image/png")

        # 3. Agar Replace BG chahiye
        final_img = processed_img
        if bg_url:
            bg_res = http_requests.get(bg_url, timeout=10)
            bg_img = Image.open(io.BytesIO(bg_res.content)).convert("RGBA")
            bg_img = bg_img.resize(processed_img.size, Image.LANCZOS)
            
            combined = Image.new("RGBA", processed_img.size)
            combined.paste(bg_img, (0,0))
            combined.paste(processed_img, (0,0), processed_img)
            final_img = combined
            
        elif bg_color:
            bg_img = Image.new("RGBA", processed_img.size, bg_color)
            bg_img.paste(processed_img, (0,0), processed_img)
            final_img = bg_img

        final_img.save(output_path, "PNG")
        return FileResponse(str(output_path), media_type="image/png")

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

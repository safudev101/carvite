from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import shutil
from pathlib import Path
import sys
import io
import requests as http_requests
import asyncio
import time

root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root_dir))

from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image

from src.constants import ALLOWED_EXTENSIONS, MAX_WORKERS, SUPPORTED_MODELS
from src.util import process_model_replacement, validate_uploaded_image
from core import processor

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_dirs() -> tuple[Path, Path, Path]:
    base_dir = Path(os.environ.get("IMAGE_BASE_DIR") or "images")
    input_dir = base_dir / "input"
    output_dir = base_dir / "output"
    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    return base_dir, input_dir, output_dir


@app.get("/")
def read_root():
    return {"status": "online", "message": "CarVite AI Engine is running"}


@app.post("/process")
@app.post("/upload-image")
def upload_image(
    image: UploadFile = File(...),
    bg_color: str = Form(None),
    bg_url: str = Form(None),
    action: str = Form("replace") # ✅ Naya parameter: 'remove' ya 'replace'
):
    if not (image.content_type and image.content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="File is not an image.")

    original_name = Path(image.filename or "upload")
    ext = original_name.suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file extension.")

    _, input_dir, output_dir = get_dirs()

    # Time stamp taake filename clash na ho
    unique_filename = f"{int(time.time())}_{original_name.name}"
    input_path = input_dir / unique_filename
    output_name = f"{original_name.stem}_processed.png"
    output_path = output_dir / output_name

    try:
        with input_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
    finally:
        image.file.close()

    try:
        # 1. Background Removal (Har soorat mein hogi foreground nikalne k liye)
        output_img, _ = processor.process_image(
            str(input_path), model_name="isnet-general-use"
        )
        output_img = output_img.convert("RGBA")

        # 2. LOGIC: Agar user ne sirf 'remove' manga hai toh transparent PNG return karo
        if action == "remove":
            output_img.save(output_path, format="PNG")
            return FileResponse(str(output_path), media_type="image/png")

        # 3. Agar 'replace' karna hai (Enhance logic)
        final_img = output_img # Default fallback

        if bg_url:
            try:
                bg_response = http_requests.get(bg_url, timeout=15)
                bg_response.raise_for_status()
                bg_img = Image.open(io.BytesIO(bg_response.content)).convert("RGBA")
                bg_img = bg_img.resize(output_img.size, Image.LANCZOS)
                
                # Nayi image banao aur uspar background aur phir car paste karo
                combined = Image.new("RGBA", output_img.size)
                combined.paste(bg_img, (0, 0))
                combined.paste(output_img, (0, 0), output_img) # Alpha mask use karna zaroori hai
                final_img = combined
            except Exception as e:
                print(f"Failed to apply BG URL: {e}")

        elif bg_color:
            try:
                bg_img = Image.new("RGBA", output_img.size, bg_color)
                bg_img.paste(output_img, (0, 0), output_img)
                final_img = bg_img
            except Exception as e:
                print(f"Failed to apply BG Color: {e}")

        # Final save
        final_img.save(output_path, format="PNG")
        return FileResponse(str(output_path), media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")


@app.post("/replace-background")
def replace_background_endpoint(
    image: UploadFile = File(..., description="Car image (foreground)"),
    background: UploadFile = File(..., description="New background image"),
    car_size: float = Form(
        60,
        description="Car size as percentage (1-100). Examples: 50=smaller, 60=standard, 80=larger",
        ge=1,
        le=100,
    ),
    smart_placement: bool = Form(
        True,
        description="Enable intelligent ground plane detection",
    ),
):
    car_size_decimal = car_size / 100.0

    for file in [image, background]:
        if not (file.content_type and file.content_type.startswith("image/")):
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} is not a valid image.",
            )

    fg_filename_str = image.filename or "foreground_upload"
    bg_filename_str = background.filename or "background_upload"

    _, input_dir, output_dir = get_dirs()

    fg_path = input_dir / f"fg_{fg_filename_str}"
    bg_path = input_dir / f"bg_{bg_filename_str}"

    output_name = f"replaced_{Path(fg_filename_str).stem}.png"
    output_path = output_dir / output_name

    try:
        with fg_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        with bg_path.open("wb") as buffer:
            shutil.copyfileobj(background.file, buffer)

        result_img = processor.replace_background(
            foreground_input=str(fg_path),
            background_input=str(bg_path),
            model_name="isnet-general-use",
            normalize=True,
            target_car_ratio=car_size_decimal,
            smart_placement=smart_placement,
        )

        result_img.save(output_path, format="PNG")

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}",
        )
    finally:
        image.file.close()
        background.file.close()

    return FileResponse(str(output_path), media_type="image/png")


@app.post("/replace-background-all-models")
async def replace_background_all_models(
    image: UploadFile = File(..., description="Car image (foreground)"),
    background: UploadFile = File(..., description="New background image"),
    car_size: float = Form(60, description="Car size as percentage (1-100)", ge=1, le=100),
    smart_placement: bool = Form(True, description="Enable intelligent ground plane detection"),
):
    start_time = time.perf_counter()
    car_size_decimal = car_size / 100.0

    fg_filename = validate_uploaded_image(image)
    bg_filename = validate_uploaded_image(background)

    _, input_dir, output_dir = get_dirs()

    fg_path = input_dir / f"fg_{fg_filename.name}"
    bg_path = input_dir / f"bg_{bg_filename.name}"

    results = []

    try:
        with fg_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        with bg_path.open("wb") as buffer:
            shutil.copyfileobj(background.file, buffer)

        async def run_model(model: str):
            try:
                return await asyncio.to_thread(
                    process_model_replacement,
                    model,
                    fg_path,
                    bg_path,
                    output_dir,
                    car_size_decimal,
                    smart_placement,
                )
            except Exception as e:
                return {
                    "model": model,
                    "status": "failed",
                    "error": str(e),
                }

        tasks = [run_model(model) for model in SUPPORTED_MODELS]
        results = await asyncio.gather(*tasks)

    finally:
        image.file.close()
        background.file.close()

    success_count = sum(1 for r in results if r["status"] == "success")
    failed_count = len(results) - success_count
    duration_seconds = round(time.perf_counter() - start_time, 2)

    if success_count == 0:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "All model runs failed",
                "input_foreground": fg_path.name,
                "input_background": bg_path.name,
                "total_models": len(SUPPORTED_MODELS),
                "successful_models": 0,
                "failed_models": failed_count,
                "duration_seconds": duration_seconds,
                "results": sorted(results, key=lambda r: r["model"]),
            },
        )

    return {
        "input_foreground": fg_path.name,
        "input_background": bg_path.name,
        "total_models": len(SUPPORTED_MODELS),
        "successful_models": success_count,
        "failed_models": failed_count,
        "car_size_percentage": f"{car_size}%",
        "smart_placement_enabled": smart_placement,
        "duration_seconds": duration_seconds,
        "results": sorted(results, key=lambda r: r["model"]),
        "message": "Multi-model background replacement completed",
    }


@app.get("/output/{filename}")
def get_output(filename: str):
    """Serve processed output images"""
    _, _, output_dir = get_dirs()
    file_path = output_dir / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="image/png")

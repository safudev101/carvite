# ─────────────────────────────────────────────
#  AutoVisio Studio — Hugging Face Spaces
#  SDK: Docker  |  Port: 7860
# ─────────────────────────────────────────────

FROM python:3.10-slim

# System deps for Pillow, rembg, and onnxruntime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    libffi-dev \
    libheif-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the rembg u2net model so cold starts are fast
# This bakes the model into the image layer
RUN python -c "from rembg import new_session; new_session('u2net')"

# Copy application code
COPY . .

# Create backgrounds directory (mount or add your bg images here)
RUN mkdir -p backgrounds

# HuggingFace Spaces uses port 7860
EXPOSE 7860

# Environment variables (override in HF Space secrets)
ENV HOST=0.0.0.0
ENV PORT=7860
ENV WORKERS=1
ENV ALLOWED_ORIGINS=*

# Start server
CMD uvicorn main:app \
    --host $HOST \
    --port $PORT \
    --workers $WORKERS \
    --timeout-keep-alive 120

# ─────────────────────────────────────────────
#  AutoVisio Studio — Hugging Face Spaces (Fixed)
# ─────────────────────────────────────────────

FROM python:3.10-slim

# 1. System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1-mesa-glx \
    libgomp1 \
    libffi-dev \
    libheif-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Setup model directory environment variable
# Ye line sab se zaroori hai taake model hamesha isi path se load ho
ENV U2NET_HOME=/app/.u2net

# 3. Install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 4. Pre-download the rembg u2net model into our app directory
RUN mkdir -p /app/.u2net && \
    python -c "import os; from rembg import new_session; new_session('u2net')"

# 5. Copy application code
COPY . .

# 6. Set permissions (Hugging Face needs this sometimes)
RUN chmod -R 777 /app

# HuggingFace Spaces uses port 7860
EXPOSE 7860

ENV HOST=0.0.0.0
ENV PORT=7860
ENV WORKERS=1
ENV ALLOWED_ORIGINS=*

# Start server with longer timeout for AI processing
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--timeout-keep-alive", "120"]





















# # ─────────────────────────────────────────────
# #  AutoVisio Studio — Hugging Face Spaces
# #  SDK: Docker  |  Port: 7860
# # ─────────────────────────────────────────────

# FROM python:3.10-slim

# # System deps for Pillow, rembg, and onnxruntime
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libglib2.0-0 \
#     libgl1 \
#     libgomp1 \
#     libffi-dev \
#     libheif-dev \
#     && rm -rf /var/lib/apt/lists/*

# WORKDIR /app

# # Copy requirements first (layer cache)
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# # Pre-download the rembg u2net model so cold starts are fast
# # This bakes the model into the image layer
# RUN python -c "from rembg import new_session; new_session('u2net')"

# # Copy application code
# COPY . .

# # Create backgrounds directory (mount or add your bg images here)
# RUN mkdir -p backgrounds

# # HuggingFace Spaces uses port 7860
# EXPOSE 7860

# # Environment variables (override in HF Space secrets)
# ENV HOST=0.0.0.0
# ENV PORT=7860
# ENV WORKERS=1
# ENV ALLOWED_ORIGINS=*

# # Start server
# CMD uvicorn main:app \
#     --host $HOST \
#     --port $PORT \
#     --workers $WORKERS \
#     --timeout-keep-alive 120

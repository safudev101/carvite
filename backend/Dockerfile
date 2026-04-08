#  AutoVisio Studio — Hugging Face Spaces (Optimized)
FROM python:3.10-slim

# 1. System dependencies (Added libsm6 and libxext6 for OpenCV/rembg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libgomp1 \
    libffi-dev \
    libheif-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Setup model directory environment variable
ENV U2NET_HOME=/app/.u2net

# 3. Install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 4. PRE-DOWNLOAD ISNET (Ye sab se zaroori hai!)
# Yahan 'u2net' ki jagah 'isnet-general-use' hona chahiye
RUN mkdir -p /app/.u2net && \
    python -c "from rembg import new_session; new_session('isnet-general-use')"

# 5. Copy application code
COPY . .

# 6. Set permissions
RUN chmod -R 777 /app

EXPOSE 7860

# Dockerfile ki aakhri line
# Agar main.py root mein hai to "main:app", agar api folder mein hai to "api.main:app"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--timeout-keep-alive", "120"]

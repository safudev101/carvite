# 1. Base Image: Python 3.10-slim (Stable & Light)
FROM python:3.10-slim

# 2. System dependencies (OpenCV aur rembg ke liye zaroori hain)
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

# 3. Model directory setup
ENV U2NET_HOME=/app/.u2net

# 4. Requirements install (requirements.txt root mein honi chahiye)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 5. Model Pre-download (Is se server foran start ho jata hai)
RUN mkdir -p /app/.u2net && \
    python -c "from rembg import new_session; new_session('isnet-general-use')"

# 6. Poora code copy karein
COPY . .

# 7. Permissions (Hugging Face ke liye zaroori)
RUN chmod -R 777 /app

EXPOSE 7860

# 8. Start Command: 
# Humne '--app-dir api/src' dala hai kyunki main.py wahan parhi hai
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--app-dir", "api/src", "--timeout-keep-alive", "120"]
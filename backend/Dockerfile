# ─────────────────────────────────────────────
#  AutoVisio Studio — Hugging Face Spaces (Fixed)
# ─────────────────────────────────────────────

FROM python:3.10-slim

# 1. System dependencies (Fixed libgl1 for Debian Trixie)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
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

# Dockerfile ki aakhri line replace karo
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]

# # Start server with longer timeout for AI processing
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--timeout-keep-alive", "120"]

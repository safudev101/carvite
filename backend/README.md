---
title: AutoVisio Studio API
emoji: 🚗
colorFrom: yellow
colorTo: gray
sdk: docker
pinned: true
app_port: 7860
---

# AutoVisio Studio — FastAPI Backend

AI-powered automotive photo enhancement API.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + model status |
| GET | `/backgrounds` | List built-in backgrounds |
| POST | `/process` | Single image enhancement |
| POST | `/process/batch` | Batch (up to 20 images) |

## Environment Variables (set in HF Secrets)

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `*` |
| `WORKERS` | Uvicorn worker count | `1` |

## Adding Custom Background Images

Upload `.jpg` or `.png` files to the `backgrounds/` directory, named to match
the IDs in `BUILTIN_BACKGROUNDS` in `main.py` (e.g. `showroom_dark.jpg`).

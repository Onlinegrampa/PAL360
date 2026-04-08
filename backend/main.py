import os
import modal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.policies import router as policies_router
from routes.claims import router as claims_router
from routes.products import router as products_router
from routes.payments import router as payments_router

load_dotenv()

# ── Modal app definition ───────────────────────────────────────────────────────
modal_app = modal.App("pal360-backend")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "fastapi>=0.110.0",
        "uvicorn[standard]>=0.29.0",
        "pydantic>=2.7.0",
        "python-dotenv>=1.0.1",
        "stripe>=8.9.0",
        "supabase>=2.4.2",
        "websockets>=12.0",
        "httpx>=0.28.1",
        "python-jose[cryptography]>=3.3.0",
    )
)

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="PAL360 API",
    description="Pan American Life Client Dashboard Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4001",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(policies_router, tags=["policies"])
app.include_router(claims_router, tags=["claims"])
app.include_router(products_router, tags=["products"])
app.include_router(payments_router, tags=["payments"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "PAL360 API"}


# ── Modal endpoint ─────────────────────────────────────────────────────────────
@modal_app.function(
    image=image,
    mounts=[modal.Mount.from_local_dir("data", remote_path="/root/data")],
)
@modal.asgi_app()
def fastapi_app():
    return app

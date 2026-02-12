from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import create_db_and_tables
from app.upload_service import router as upload_router
from app.routers import auth, templates

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    create_db_and_tables()
    
    # SEED: Create Default Template & Admin User if missing
    # We can do this in a separate function or here. 
    # For now, let's keep it simple.
    yield

app = FastAPI(lifespan=lifespan, redirect_slashes=False)

# Configurar CORS
import os
frontend_url = os.getenv("FRONTEND_URL")
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://192.168.0.183:3000",
]
if frontend_url:
    origins.append(frontend_url.strip().rstrip("/")) # Strip trailing slash just in case

print(f"DEBUG: Allowed Origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    # allow_origins=origins, 
    allow_origins=["*"], # TEMPORARY: Allow all to debug 400 Bad Request on OPTIONS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")       # /api/auth/...
app.include_router(templates.router, prefix="/api")  # /api/templates/...
app.include_router(upload_router, prefix="/api")     # /api/upload, /api/sessoes

@app.get("/")
def read_root():
    return {"message": "API Aconselhamento Ativa - Multi-User Ready"}

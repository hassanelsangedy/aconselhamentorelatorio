from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import traceback
import sys

# Global variables for components
upload_router = None
auth_router = None
templates_router = None
create_db_and_tables = None
startup_error = None

# Try to import application components
try:
    from app.database import create_db_and_tables
    from app.upload_service import router as upload_router
    from app.routers import auth
    from app.routers import templates as templates_router
except Exception as e:
    startup_error = traceback.format_exc()
    print(f"🔥 CRITICAL STARTUP ERROR: {startup_error}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    if startup_error:
        yield
        return
        
    # Normal startup
    try:
        create_db_and_tables()
        # SEED: Create Default Template & Admin User if missing
    except Exception as e:
        print(f"🔥 DB STARTUP ERROR: {e}")
        # Don't crash, just log
    yield

app = FastAPI(lifespan=lifespan, redirect_slashes=False)

# Configurar CORS (Always apply this so error page is accessible)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*", # Allow ANY http/https origin with credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if startup_error:
    # --- ERROR MODE ---
    @app.get("/{path:path}")
    def read_root_error(path: str):
        return JSONResponse(
            status_code=500, 
            content={
                "status": "CRITICAL_STARTUP_ERROR", 
                "message": "The backend failed to start correctly.",
                "traceback": startup_error
            }
        )
else:
    # --- NORMAL MODE ---
    app.include_router(auth.router, prefix="/api")       # /api/auth/...
    app.include_router(templates_router.router, prefix="/api")  # /api/templates/...
    app.include_router(upload_router, prefix="/api")     # /api/upload, /api/sessoes

    @app.get("/")
    def read_root():
        return {"message": "API Aconselhamento Ativa - Multi-User Ready"}

    from fastapi.exceptions import RequestValidationError
    from starlette.exceptions import HTTPException as StarletteHTTPException

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request, exc):
        print(f"🔥 HTTP Error {exc.status_code} at {request.url.path}: {exc.detail}")
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request, exc):
        print(f"❌ Validation Error at {request.url.path}: {exc}")
        return JSONResponse(status_code=422, content={"detail": str(exc)})

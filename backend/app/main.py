import sys
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

print("🚀 [BOOT] Starting SIMPLE main.py...", file=sys.stderr)

# --- GLOBAL APP STATE ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔄 [LIFESPAN] Starting...", file=sys.stderr)
    try:
        from app.database import create_db_and_tables
        create_db_and_tables()
        print("✅ [LIFESPAN] Tables created.", file=sys.stderr)
    except Exception as e:
        print(f"🔥 [LIFESPAN] DB Initialization Error: {e}", file=sys.stderr)
    yield

app = FastAPI(lifespan=lifespan, redirect_slashes=False)

# --- MIDDLEWARE: CORS FORCE ---
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    # Handle Preflight OPTIONS
    if request.method == "OPTIONS":
        return JSONResponse(
            status_code=200,
            content={"message": "Preflight OK"},
            headers={
                "Access-Control-Allow-Origin": request.headers.get("origin") or "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
            }
        )
    
    # Handle Request
    try:
        response = await call_next(request)
    except Exception as e:
        print(f"❌ Uncaught App Error: {e}")
        traceback.print_exc()
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(e)}
        )

    # Add Headers to Response
    origin = request.headers.get("origin")
    response.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# --- MIDDLEWARE: LOGGING ---
class LogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        print(f"📡 [REQ] {request.method} {request.url.path}")
        try:
            response = await call_next(request)
            print(f"✅ [RES] {response.status_code} for {request.url.path}")
            return response
        except Exception as e:
            print(f"❌ [ERR] Middleware caught: {e}")
            raise e

app.add_middleware(LogMiddleware)


# --- ROUTES ---

# 1. Health Check (Top Priority)
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is Reachable!"}

@app.get("/")
def read_root():
    return {"message": "API Active"}

# 2. Application Routes (Imported safely)
try:
    from app.routers import auth, templates
    from app.upload_service import router as upload_router
    
    app.include_router(auth.router, prefix="/api")
    app.include_router(templates.router, prefix="/api")
    app.include_router(upload_router, prefix="/api")
    print("✅ [BOOT] Application Routers Registered.", file=sys.stderr)
except Exception as e:
    print(f"🔥 [BOOT] Failed to import routers: {e}", file=sys.stderr)
    traceback.print_exc()

# 3. Exception Handlers
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)},
    )

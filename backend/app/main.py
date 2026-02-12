import sys
print("🚀 [BOOT] Starting main.py...", file=sys.stderr)

try:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    from contextlib import asynccontextmanager
    import traceback
    print("✅ [BOOT] Imports successful.", file=sys.stderr)
except Exception as ie:
    print(f"❌ [BOOT] Import Error: {ie}", file=sys.stderr)
    sys.exit(1)

# Global variables
upload_router = None
auth_router = None
templates_router = None
create_db_and_tables = None
startup_error = None

# Try to import application components
try:
    print("🔄 [BOOT] Importing app components...", file=sys.stderr)
    from app.database import create_db_and_tables
    from app.upload_service import router as upload_router
    from app.routers import auth
    from app.routers import templates as templates_router
    print("✅ [BOOT] App components imported.", file=sys.stderr)
except Exception as e:
    startup_error = traceback.format_exc()
    print(f"🔥 [BOOT] CRITICAL STARTUP ERROR: {startup_error}", file=sys.stderr)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if startup_error:
        yield
        return
        
    try:
        print("🔄 [LIFESPAN] Creating DB tables...", file=sys.stderr)
        create_db_and_tables()
        print("✅ [LIFESPAN] Tables created.", file=sys.stderr)
    except Exception as e:
        print(f"🔥 [LIFESPAN] DB Error: {e}", file=sys.stderr)
    yield

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

# Debug Middleware to log every request
class LogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        print(f"📡 [REQ] {request.method} {request.url.path} | Origin: {request.headers.get('origin')}")
        try:
            response = await call_next(request)
            print(f"✅ [RES] {response.status_code}")
            return response
        except Exception as e:
            print(f"❌ [ERR] Request Failed: {e}")
            raise e

app = FastAPI(lifespan=lifespan, redirect_slashes=False)
app.add_middleware(LogMiddleware)

# --- CUSTOM CORS MIDDLEWARE (BRUTE FORCE) ---
# Standard CORSMiddleware is being difficult. We will handle headers manually.
@app.middleware("http")
async def cors_guard(request: Request, call_next):
    origin = request.headers.get("origin")
    
    # Allow all origins for now to unblock (since we use Bearer tokens, CSRF risk is low)
    # In production, check against a whitelist if needed.
    safe_origin = origin if origin else "*"
    
    if request.method == "OPTIONS":
        response = JSONResponse(content={"message": "CORS Preflight OK"}, status_code=200)
    else:
        response = await call_next(request)
    
    # Attach CORS Headers to EVERY response
    response.headers["Access-Control-Allow-Origin"] = safe_origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response


# Log Middleware (Keep this for debugging)
app.add_middleware(LogMiddleware)

if startup_error:
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
    app.include_router(auth.router, prefix="/api")
    app.include_router(templates_router.router, prefix="/api")
    app.include_router(upload_router, prefix="/api")

    @app.api_route("/", methods=["GET", "HEAD"])
    def read_root():
        return {"message": "API Aconselhamento Ativa - Multi-User Ready"}

    from fastapi.exceptions import RequestValidationError
    from starlette.exceptions import HTTPException as StarletteHTTPException

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request, exc):
        print(f"🔥 HTTP Error {exc.status_code}: {exc.detail}")
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request, exc):
        print(f"❌ Validation Error: {exc}")
        return JSONResponse(status_code=422, content={"detail": str(exc)})

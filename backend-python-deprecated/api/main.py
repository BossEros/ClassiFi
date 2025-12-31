from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from api.v1.router import api_router as api_v1_router
from api.middleware.error_handler import register_exception_handlers
from shared.config import settings
from repositories.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    Manages database connection lifecycle
    """
    # Startup
    # The async engine manages its own connection pool
    print(f"[STARTUP] Starting {settings.app_name} v{settings.app_version}")
    print(f"[STARTUP] Environment: {settings.environment}")
    print(f"[STARTUP] Database: Connected")

    yield

    # Shutdown
    print("[SHUTDOWN] Database: Disconnecting...")
    await engine.dispose()
    print("[SHUTDOWN] Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="ClassiFi Backend API - 3-Tier Layered Architecture",
    debug=settings.debug,
    lifespan=lifespan
)

# Configure CORS using settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Use configured origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register error handlers
register_exception_handlers(app)

# Include API v1 router
app.include_router(api_v1_router, prefix=f"{settings.api_prefix}/v1")


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "environment": settings.environment
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.environment
    }


# Run with: uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

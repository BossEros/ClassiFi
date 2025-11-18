"""
FastAPI Application Entry Point
Part of the API Layer
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import auth, teacher_dashboard, class_router
from shared.config import settings

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="ClassiFi Backend API - 3-Tier Layered Architecture",
    debug=settings.debug
)

# Configure CORS - CRITICAL: This must be configured correctly for frontend to work
# Allow all origins in development (you can restrict this in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(teacher_dashboard.router, prefix=settings.api_prefix)
app.include_router(class_router.router, prefix=settings.api_prefix)


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

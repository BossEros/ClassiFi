"""
FastAPI Application Entry Point
Part of the Presentation Layer
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from presentation.routers import auth
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


@app.get("/")
async def root():
    """
    Root endpoint - Health check
    """
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "environment": settings.environment
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "environment": settings.environment
    }


# Run with: uvicorn presentation.main:app --reload --host 0.0.0.0 --port 8000

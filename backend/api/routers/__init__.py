"""
Routers Package
Part of the API Layer
Exports all API routers
"""

from api.routers import auth, teacher_dashboard, class_router

__all__ = ["auth", "teacher_dashboard", "class_router"]

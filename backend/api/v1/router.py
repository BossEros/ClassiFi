from fastapi import APIRouter
from api.routers import auth, teacher_dashboard, student_dashboard, class_router, submission_router, assignment_router

# Create v1 API router
api_router = APIRouter()

# Include all v1 routers
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(teacher_dashboard.router, tags=["Teacher Dashboard"])
api_router.include_router(student_dashboard.router, tags=["Student Dashboard"])
api_router.include_router(class_router.router, tags=["Classes"])
api_router.include_router(submission_router.router, tags=["Submissions"])
api_router.include_router(assignment_router.router, tags=["Assignments"])

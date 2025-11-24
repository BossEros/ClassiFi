"""
Student Dashboard Router
Part of the API Layer
Defines API endpoints for student dashboard
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.schemas.student_dashboard import (
    StudentDashboardResponse,
    EnrolledClassesResponse,
    PendingAssignmentsResponse,
    JoinClassRequest,
    JoinClassResponse,
    LeaveClassRequest,
    LeaveClassResponse,
    ClassResponse,
    AssignmentResponse
)
from services.services.student_dashboard_service import StudentDashboardService
from repositories.database import get_db

router = APIRouter(prefix="/student/dashboard", tags=["Student Dashboard"])


@router.get("/{student_id}", response_model=StudentDashboardResponse)
async def get_student_dashboard(
    student_id: int,
    enrolled_classes_limit: int = 12,
    pending_assignments_limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete dashboard data for a student

    **Path Parameters:**
    - student_id: ID of the student

    **Query Parameters:**
    - enrolled_classes_limit: Number of enrolled classes to return (default: 12)
    - pending_assignments_limit: Number of pending assignments to return (default: 10)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - enrolled_classes: List of enrolled classes
    - pending_assignments: List of pending assignments
    """
    dashboard_service = StudentDashboardService(db)

    success, message, data = await dashboard_service.get_dashboard_data(
        student_id,
        enrolled_classes_limit=enrolled_classes_limit,
        pending_assignments_limit=pending_assignments_limit
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return StudentDashboardResponse(
        success=True,
        message=message,
        enrolled_classes=[ClassResponse(**c) for c in data.get("enrolled_classes", [])],
        pending_assignments=[AssignmentResponse(**a) for a in data.get("pending_assignments", [])]
    )


@router.get("/{student_id}/classes", response_model=EnrolledClassesResponse)
async def get_enrolled_classes(
    student_id: int,
    limit: int = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get enrolled classes for a student

    **Path Parameters:**
    - student_id: ID of the student

    **Query Parameters:**
    - limit: Number of classes to return (default: all)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - classes: List of enrolled classes
    """
    dashboard_service = StudentDashboardService(db)

    success, message, classes_data = await dashboard_service.get_enrolled_classes(
        student_id=student_id,
        limit=limit
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return EnrolledClassesResponse(
        success=True,
        message=message,
        classes=[ClassResponse(**c) for c in classes_data]
    )


@router.get("/{student_id}/assignments", response_model=PendingAssignmentsResponse)
async def get_pending_assignments(
    student_id: int,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    Get pending assignments for a student

    **Path Parameters:**
    - student_id: ID of the student

    **Query Parameters:**
    - limit: Number of assignments to return (default: 10)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - assignments: List of pending assignments
    """
    dashboard_service = StudentDashboardService(db)

    success, message, assignments_data = await dashboard_service.get_pending_assignments(
        student_id=student_id,
        limit=limit
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return PendingAssignmentsResponse(
        success=True,
        message=message,
        assignments=[AssignmentResponse(**a) for a in assignments_data]
    )


@router.post("/join", response_model=JoinClassResponse)
async def join_class(
    request: JoinClassRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Join a class using a class code

    **Request Body:**
    - student_id: ID of the student
    - class_code: Unique class code to join

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - class_info: Joined class data (if successful)
    """
    dashboard_service = StudentDashboardService(db)

    success, message, class_data = await dashboard_service.join_class(
        student_id=request.student_id,
        class_code=request.class_code
    )

    if not success:
        return JoinClassResponse(
            success=False,
            message=message,
            class_info=None
        )

    return JoinClassResponse(
        success=True,
        message=message,
        class_info=ClassResponse(**class_data) if class_data else None
    )


@router.post("/leave", response_model=LeaveClassResponse)
async def leave_class(
    request: LeaveClassRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Leave a class

    **Request Body:**
    - student_id: ID of the student
    - class_id: ID of the class to leave

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    """
    dashboard_service = StudentDashboardService(db)

    success, message = await dashboard_service.leave_class(
        student_id=request.student_id,
        class_id=request.class_id
    )

    return LeaveClassResponse(
        success=success,
        message=message
    )

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.schemas.teacher_dashboard import (
    DashboardDataResponse,
    RecentClassesResponse,
    PendingTasksResponse,
    ClassResponse,
    TaskResponse
)
from services.services.teacher_dashboard_service import TeacherDashboardService
from repositories.database import get_db
import sys

router = APIRouter(prefix="/teacher/dashboard", tags=["Teacher Dashboard"])


@router.get("/{teacher_id}", response_model=DashboardDataResponse)
async def get_teacher_dashboard(
    teacher_id: int,
    recent_classes_limit: int = 12,
    pending_tasks_limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete dashboard data for a teacher

    **Path Parameters:**
    - teacher_id: ID of the teacher

    **Query Parameters:**
    - recent_classes_limit: Number of recent classes to return (default: 20)
    - pending_tasks_limit: Number of pending tasks to return (default: 10)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - recent_classes: List of recent classes
    - pending_tasks: List of pending assignments/tasks
    """
    dashboard_service = TeacherDashboardService(db)
    success, message, data = await dashboard_service.get_dashboard_data(
        teacher_id,
        recent_classes_limit=recent_classes_limit,
        pending_tasks_limit=pending_tasks_limit
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return DashboardDataResponse(
        success=True,
        message=message,
        recent_classes=[ClassResponse(**c) for c in data.get("recent_classes", [])],
        pending_tasks=[TaskResponse(**t) for t in data.get("pending_tasks", [])]
    )


@router.get("/{teacher_id}/classes", response_model=RecentClassesResponse)
async def get_recent_classes(
    teacher_id: int,
    limit: int = 5,
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent classes for a teacher

    **Path Parameters:**
    - teacher_id: ID of the teacher

    **Query Parameters:**
    - limit: Number of classes to return (default: 5)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - classes: List of recent classes
    """
    dashboard_service = TeacherDashboardService(db)

    success, message, classes_data = await dashboard_service.get_recent_classes(
        teacher_id=teacher_id,
        limit=limit
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return RecentClassesResponse(
        success=True,
        message=message,
        classes=[ClassResponse(**c) for c in classes_data]
    )


@router.get("/{teacher_id}/tasks", response_model=PendingTasksResponse)
async def get_pending_tasks(
    teacher_id: int,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    Get pending tasks for a teacher

    **Path Parameters:**
    - teacher_id: ID of the teacher

    **Query Parameters:**
    - limit: Number of tasks to return (default: 10)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - tasks: List of pending assignments/tasks
    """
    dashboard_service = TeacherDashboardService(db)

    success, message, tasks_data = await dashboard_service.get_pending_tasks(
        teacher_id=teacher_id,
        limit=limit
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return PendingTasksResponse(
        success=True,
        message=message,
        tasks=[TaskResponse(**t) for t in tasks_data]
    )

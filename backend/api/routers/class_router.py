"""
Class Router
Part of the API Layer
Defines API endpoints for class operations
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from api.schemas.class_schema import (
    CreateClassRequest,
    CreateClassResponse,
    ClassListResponse,
    ClassResponse
)
from services.services.class_service import ClassService
from repositories.database import get_db

router = APIRouter(prefix="/classes", tags=["Classes"])


@router.post("", response_model=CreateClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    request: CreateClassRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new class

    **Request Body:**
    - teacher_id: ID of the teacher creating the class
    - class_name: Name of the class (1-100 characters)
    - description: Optional class description (max 1000 characters)
    - class_code: Optional class code (auto-generated if not provided)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - class: Created class data
    """
    class_service = ClassService(db)

    success, message, class_data = class_service.create_class(
        teacher_id=request.teacher_id,
        class_name=request.class_name,
        description=request.description,
        class_code=request.class_code
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return CreateClassResponse(
        success=True,
        message=message,
        class_data=ClassResponse(**class_data)
    )


@router.get("/teacher/{teacher_id}", response_model=ClassListResponse)
async def get_all_classes_by_teacher(
    teacher_id: int,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get all classes for a teacher

    **Path Parameters:**
    - teacher_id: ID of the teacher

    **Query Parameters:**
    - active_only: If True, only return active classes (default: True)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - classes: List of classes
    """
    class_service = ClassService(db)

    success, message, classes_data = class_service.get_all_classes_by_teacher(
        teacher_id=teacher_id,
        active_only=active_only
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return ClassListResponse(
        success=True,
        message=message,
        classes=[ClassResponse(**c) for c in classes_data]
    )


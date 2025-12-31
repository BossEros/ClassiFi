from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from api.schemas.class_schema import (
    CreateClassRequest,
    CreateClassResponse,
    ClassListResponse,
    ClassResponse,
    ClassDetailResponse,
    AssignmentListResponse,
    AssignmentResponse,
    StudentListResponse,
    StudentResponse,
    DeleteClassRequest,
    DeleteClassResponse,
    UpdateClassRequest,
    UpdateClassResponse,
    GenerateCodeResponse
)
from api.schemas.assignment_schema import (
    CreateAssignmentRequest,
    CreateAssignmentResponse,
    AssignmentDetailResponse
)
from services.services.class_service import ClassService
from repositories.database import get_db

router = APIRouter(prefix="/classes", tags=["Classes"])


@router.post("", response_model=CreateClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    request: CreateClassRequest,
    db: AsyncSession = Depends(get_db)
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

    success, message, class_data = await class_service.create_class(
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
        class_info=ClassResponse(**class_data)
    )


@router.get("/generate-code", response_model=GenerateCodeResponse)
async def generate_class_code(
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a unique class code

    **Response:**
    - success: Boolean indicating success
    - code: The generated unique class code
    - message: Optional message
    """
    class_service = ClassService(db)

    code = await class_service.generate_unique_class_code()

    return GenerateCodeResponse(
        success=True,
        code=code,
        message="Class code generated successfully"
    )


@router.get("/teacher/{teacher_id}", response_model=ClassListResponse)
async def get_all_classes_by_teacher(
    teacher_id: int,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
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

    success, message, classes_data = await class_service.get_all_classes_by_teacher(
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


@router.get("/{class_id}", response_model=ClassDetailResponse)
async def get_class_by_id(
    class_id: int,
    teacher_id: int = Query(None, description="Teacher ID for authorization"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a class by ID

    **Path Parameters:**
    - class_id: ID of the class

    **Query Parameters:**
    - teacher_id: Optional teacher ID for authorization check

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - class: Class data
    """
    class_service = ClassService(db)

    success, message, class_data = await class_service.get_class_by_id(
        class_id=class_id,
        teacher_id=teacher_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message
        )

    return ClassDetailResponse(
        success=True,
        message=message,
        class_info=ClassResponse(**class_data)
    )


@router.put("/{class_id}", response_model=UpdateClassResponse)
async def update_class(
    class_id: int,
    request: UpdateClassRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a class

    **Path Parameters:**
    - class_id: ID of the class to update

    **Request Body:**
    - teacher_id: ID of the teacher (for authorization)
    - class_name: New name for the class (optional)
    - description: New description for the class (optional)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - class_info: Updated class data
    """
    class_service = ClassService(db)

    success, message, class_data = await class_service.update_class(
        class_id=class_id,
        teacher_id=request.teacher_id,
        class_name=request.class_name,
        description=request.description
    )

    if not success:
        error_code = status.HTTP_404_NOT_FOUND
        if "Unauthorized" in message:
            error_code = status.HTTP_403_FORBIDDEN
        elif "No fields" in message:
            error_code = status.HTTP_400_BAD_REQUEST
        raise HTTPException(
            status_code=error_code,
            detail=message
        )

    return UpdateClassResponse(
        success=True,
        message=message,
        class_info=ClassResponse(**class_data)
    )


@router.post("/{class_id}/assignments", response_model=CreateAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    class_id: int,
    request: CreateAssignmentRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new assignment for a class

    **Path Parameters:**
    - class_id: ID of the class

    **Request Body:**
    - teacher_id: ID of the teacher (for authorization)
    - assignment_name: Name of the assignment (1-150 characters)
    - description: Assignment description (min 10 characters)
    - programming_language: "python" or "java"
    - deadline: Assignment deadline (must be in the future)
    - allow_resubmission: Whether to allow resubmissions (default: True)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - assignment: Created assignment data
    """
    class_service = ClassService(db)

    # Ensure class_id from path matches request
    if request.class_id != class_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Class ID in path must match class ID in request body"
        )

    success, message, assignment_data = await class_service.create_assignment(
        class_id=class_id,
        teacher_id=request.teacher_id,
        assignment_name=request.assignment_name,
        description=request.description,
        programming_language=request.programming_language,
        deadline=request.deadline,
        allow_resubmission=request.allow_resubmission
    )

    if not success:
        error_code = status.HTTP_400_BAD_REQUEST
        if "not found" in message.lower():
            error_code = status.HTTP_404_NOT_FOUND
        elif "unauthorized" in message.lower():
            error_code = status.HTTP_403_FORBIDDEN
        raise HTTPException(
            status_code=error_code,
            detail=message
        )

    return CreateAssignmentResponse(
        success=True,
        message=message,
        assignment=AssignmentDetailResponse(**assignment_data)
    )


@router.get("/{class_id}/assignments", response_model=AssignmentListResponse)
async def get_class_assignments(
    class_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all assignments for a class

    **Path Parameters:**
    - class_id: ID of the class

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - assignments: List of assignments with check status
    """
    class_service = ClassService(db)

    success, message, assignments_data = await class_service.get_class_assignments(
        class_id=class_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message
        )

    return AssignmentListResponse(
        success=True,
        message=message,
        assignments=[AssignmentResponse(**a) for a in assignments_data]
    )


@router.get("/{class_id}/students", response_model=StudentListResponse)
async def get_class_students(
    class_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all students enrolled in a class

    **Path Parameters:**
    - class_id: ID of the class

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - students: List of enrolled students
    """
    class_service = ClassService(db)

    success, message, students_data = await class_service.get_class_students(
        class_id=class_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message
        )

    return StudentListResponse(
        success=True,
        message=message,
        students=[StudentResponse(**s) for s in students_data]
    )


@router.delete("/{class_id}", response_model=DeleteClassResponse)
async def delete_class(
    class_id: int,
    request: DeleteClassRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a class (soft delete)

    **Path Parameters:**
    - class_id: ID of the class to delete

    **Request Body:**
    - teacher_id: ID of the teacher (for authorization)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    """
    class_service = ClassService(db)

    success, message = await class_service.delete_class(
        class_id=class_id,
        teacher_id=request.teacher_id
    )

    if not success:
        error_code = status.HTTP_404_NOT_FOUND
        if "Unauthorized" in message:
            error_code = status.HTTP_403_FORBIDDEN
        raise HTTPException(
            status_code=error_code,
            detail=message
        )

    return DeleteClassResponse(
        success=True,
        message=message
    )


@router.delete("/{class_id}/students/{student_id}", response_model=DeleteClassResponse)
async def remove_student(
    class_id: int,
    student_id: int,
    teacher_id: int = Query(..., description="ID of the teacher (for authorization)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a student from a class

    **Path Parameters:**
    - class_id: ID of the class
    - student_id: ID of the student to remove

    **Query Parameters:**
    - teacher_id: ID of the teacher (for authorization)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    """
    class_service = ClassService(db)

    success, message = await class_service.remove_student(
        class_id=class_id,
        student_id=student_id,
        teacher_id=teacher_id
    )

    if not success:
        error_code = status.HTTP_404_NOT_FOUND
        if "Unauthorized" in message:
            error_code = status.HTTP_403_FORBIDDEN
        raise HTTPException(
            status_code=error_code,
            detail=message
        )

    return DeleteClassResponse(
        success=True,
        message=message
    )


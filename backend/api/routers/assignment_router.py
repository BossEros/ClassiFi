from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from api.schemas.assignment_schema import (
    UpdateAssignmentRequest,
    UpdateAssignmentResponse,
    DeleteAssignmentResponse,
    AssignmentDetailResponse,
    GetAssignmentResponse
)
from services.services.class_service import ClassService
from repositories.database import get_db

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.get("/{assignment_id}", response_model=GetAssignmentResponse)
async def get_assignment_details(
    assignment_id: int,
    user_id: int,  # Passed as query param for now, should be from auth token in real app
    db: AsyncSession = Depends(get_db)
):
    """
    Get assignment details

    **Path Parameters:**
    - assignment_id: ID of the assignment

    **Query Parameters:**
    - user_id: ID of the user requesting details

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - assignment: Assignment details
    """
    class_service = ClassService(db)

    success, message, assignment_data = await class_service.get_assignment_details(
        assignment_id=assignment_id,
        user_id=user_id
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

    return GetAssignmentResponse(
        success=True,
        message=message,
        assignment=AssignmentDetailResponse(**assignment_data)
    )



@router.put("/{assignment_id}", response_model=UpdateAssignmentResponse)
async def update_assignment(
    assignment_id: int,
    request: UpdateAssignmentRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Update an assignment
    
    **Path Parameters:**
    - assignment_id: ID of the assignment to update
    
    **Request Body:**
    - teacher_id: ID of the teacher (for authorization)
    - assignment_name: New name (optional)
    - description: New description (optional)
    - programming_language: New programming language (optional)
    - deadline: New deadline (optional)
    - allow_resubmission: New allow_resubmission setting (optional)
    
    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - assignment: Updated assignment data
    """
    class_service = ClassService(db)
    
    success, message, assignment_data = await class_service.update_assignment(
        assignment_id=assignment_id,
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
        
    return UpdateAssignmentResponse(
        success=True,
        message=message,
        assignment=AssignmentDetailResponse(**assignment_data)
    )


@router.delete("/{assignment_id}", response_model=DeleteAssignmentResponse)
async def delete_assignment(
    assignment_id: int,
    teacher_id: int,  # Passed as query param usually, but here we might need it in body or query
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an assignment (hard delete)
    
    **Path Parameters:**
    - assignment_id: ID of the assignment to delete
    
    **Query Parameters:**
    - teacher_id: ID of the teacher (for authorization)
    
    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    """
    class_service = ClassService(db)
    
    success, message = await class_service.delete_assignment(
        assignment_id=assignment_id,
        teacher_id=teacher_id
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
        
    return DeleteAssignmentResponse(
        success=True,
        message=message
    )

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from api.schemas.submission_schema import (
    SubmitAssignmentResponse,
    SubmissionResponse,
    SubmissionListResponse,
    SubmissionHistoryResponse,
    SubmissionDetailResponse
)
from services.services.submission_service import SubmissionService
from repositories.database import get_db

router = APIRouter(prefix="/submissions", tags=["Submissions"])


@router.post("", response_model=SubmitAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def submit_assignment(
    assignment_id: int = Form(..., description="ID of the assignment"),
    student_id: int = Form(..., description="ID of the student"),
    file: UploadFile = File(..., description="Code file to submit"),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit an assignment

    **Form Data:**
    - assignment_id: ID of the assignment
    - student_id: ID of the student
    - file: Code file to submit (Python or Java)

    **Validations:**
    - Assignment must exist and be active
    - Student must be enrolled in the class
    - Deadline must not have passed
    - File size must be <= 10MB
    - File extension must match programming language
    - Resubmission allowed only if configured

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - submission: Submission data with ID, file info, and submission number
    """
    submission_service = SubmissionService(db)

    success, message, submission_data = await submission_service.submit_assignment(
        assignment_id=assignment_id,
        student_id=student_id,
        file=file
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return SubmitAssignmentResponse(
        success=True,
        message=message,
        submission=SubmissionResponse(**submission_data)
    )


@router.get("/history/{assignment_id}/{student_id}", response_model=SubmissionHistoryResponse)
async def get_submission_history(
    assignment_id: int,
    student_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get submission history for a student-assignment pair

    **Path Parameters:**
    - assignment_id: ID of the assignment
    - student_id: ID of the student

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - submissions: List of all submissions ordered by submission number
    - total_submissions: Total number of submissions
    """
    submission_service = SubmissionService(db)

    success, message, submissions_data = await submission_service.get_submission_history(
        assignment_id=assignment_id,
        student_id=student_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return SubmissionHistoryResponse(
        success=True,
        message=message,
        submissions=[SubmissionResponse(**sub) for sub in submissions_data],
        total_submissions=len(submissions_data)
    )


@router.get("/assignment/{assignment_id}", response_model=SubmissionListResponse)
async def get_assignment_submissions(
    assignment_id: int,
    latest_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all submissions for an assignment (typically used by teachers)

    **Path Parameters:**
    - assignment_id: ID of the assignment

    **Query Parameters:**
    - latest_only: If True, only return the latest submission per student (default: True)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - submissions: List of submissions with student names
    """
    submission_service = SubmissionService(db)

    success, message, submissions_data = await submission_service.get_assignment_submissions(
        assignment_id=assignment_id,
        latest_only=latest_only
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message
        )

    return SubmissionListResponse(
        success=True,
        message=message,
        submissions=[SubmissionResponse(**sub) for sub in submissions_data]
    )


@router.get("/student/{student_id}", response_model=SubmissionListResponse)
async def get_student_submissions(
    student_id: int,
    latest_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all submissions by a student

    **Path Parameters:**
    - student_id: ID of the student

    **Query Parameters:**
    - latest_only: If True, only return the latest submission per assignment (default: True)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - submissions: List of submissions with assignment names
    """
    submission_service = SubmissionService(db)

    success, message, submissions_data = await submission_service.get_student_submissions(
        student_id=student_id,
        latest_only=latest_only
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=message
        )

    return SubmissionListResponse(
        success=True,
        message=message,
        submissions=[SubmissionResponse(**sub) for sub in submissions_data]
    )


class DownloadURLResponse(BaseModel):
    """Response schema for file download URL"""
    success: bool
    message: str
    download_url: str


@router.get("/{submission_id}/download", response_model=DownloadURLResponse)
async def get_submission_download_url(
    submission_id: int,
    student_id: int = Query(..., description="ID of the student (for authorization)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a signed download URL for a submission file

    **Path Parameters:**
    - submission_id: ID of the submission

    **Query Parameters:**
    - student_id: ID of the student (for authorization)

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - download_url: Temporary signed URL for file download (expires in 1 hour)

    **Authorization:**
    - Students can only download their own submissions
    - Teachers can download submissions for their classes
    """
    from repositories.repositories.submission_repository import SubmissionRepository

    submission_service = SubmissionService(db)
    submission_repo = SubmissionRepository(db)

    # Get submission details
    submission = await submission_repo.get_submission_by_id(submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    # Verify authorization (student can only access their own submissions)
    if submission.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this submission"
        )

    try:
        # Generate signed download URL (valid for 1 hour)
        download_url = submission_service.get_file_download_url(
            file_path=submission.file_path,
            expires_in=3600
        )

        return DownloadURLResponse(
            success=True,
            message="Download URL generated successfully",
            download_url=download_url
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )

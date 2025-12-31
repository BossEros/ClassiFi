from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SubmissionResponse(BaseModel):
    """Response schema for submission data"""
    id: int
    assignment_id: int
    student_id: int
    file_name: str
    file_size: int
    submission_number: int
    submitted_at: str
    is_latest: bool

    # Optional related data
    assignment_name: Optional[str] = None
    student_name: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class SubmitAssignmentResponse(BaseModel):
    """Response schema for assignment submission"""
    success: bool
    message: Optional[str] = None
    submission: Optional[SubmissionResponse] = None


class SubmissionListResponse(BaseModel):
    """Response schema for list of submissions"""
    success: bool
    message: Optional[str] = None
    submissions: List[SubmissionResponse]


class SubmissionHistoryResponse(BaseModel):
    """Response schema for submission history"""
    success: bool
    message: Optional[str] = None
    submissions: List[SubmissionResponse]
    total_submissions: int


class SubmissionDetailResponse(BaseModel):
    """Response schema for single submission details"""
    success: bool
    message: Optional[str] = None
    submission: Optional[SubmissionResponse] = None

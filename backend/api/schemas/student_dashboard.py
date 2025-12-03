from pydantic import BaseModel, Field
from typing import List, Optional


class ClassResponse(BaseModel):
    """Response schema for class data"""
    id: int
    name: str
    code: str
    description: Optional[str] = None
    student_count: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class AssignmentResponse(BaseModel):
    """Response schema for assignment data"""
    id: int
    title: str
    description: str
    class_id: int
    class_name: str
    programming_language: str
    deadline: str
    allow_resubmission: bool
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class StudentDashboardResponse(BaseModel):
    """Response schema for complete student dashboard data"""
    success: bool
    message: Optional[str] = None
    enrolled_classes: List[ClassResponse]
    pending_assignments: List[AssignmentResponse]


class EnrolledClassesResponse(BaseModel):
    """Response schema for enrolled classes list"""
    success: bool
    message: Optional[str] = None
    classes: List[ClassResponse]


class PendingAssignmentsResponse(BaseModel):
    """Response schema for pending assignments list"""
    success: bool
    message: Optional[str] = None
    assignments: List[AssignmentResponse]


class JoinClassRequest(BaseModel):
    """Request schema for joining a class"""
    student_id: int = Field(..., description="ID of the student joining the class")
    class_code: str = Field(
        ...,
        min_length=6,
        max_length=8,
        description="Unique class code to join"
    )


class JoinClassResponse(BaseModel):
    """Response schema for join class operation"""
    success: bool
    message: str
    class_info: Optional[ClassResponse] = None


class LeaveClassRequest(BaseModel):
    """Request schema for leaving a class"""
    student_id: int = Field(..., description="ID of the student leaving the class")
    class_id: int = Field(..., description="ID of the class to leave")


class LeaveClassResponse(BaseModel):
    """Response schema for leave class operation"""
    success: bool
    message: str

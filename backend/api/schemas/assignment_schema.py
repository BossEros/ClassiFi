from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime, timezone


class CreateAssignmentRequest(BaseModel):
    """Request schema for creating an assignment"""
    class_id: int = Field(..., description="ID of the class")
    teacher_id: int = Field(..., description="ID of the teacher (for authorization)")
    assignment_name: str = Field(..., min_length=1, max_length=150, description="Name of the assignment")
    description: str = Field(..., min_length=1, description="Assignment description")
    programming_language: Literal["python", "java"] = Field(..., description="Programming language")
    deadline: datetime = Field(..., description="Assignment deadline")
    allow_resubmission: bool = Field(default=True, description="Whether to allow resubmissions")

    @field_validator('assignment_name')
    @classmethod
    def validate_assignment_name(cls, v: str) -> str:
        """Validate and trim assignment name"""
        trimmed = v.strip()
        if not trimmed:
            raise ValueError('Assignment name cannot be empty')
        if len(trimmed) > 150:
            raise ValueError('Assignment name must not exceed 150 characters')
        return trimmed

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: str) -> str:
        """Validate and trim description"""
        trimmed = v.strip()
        if not trimmed:
            raise ValueError('Description cannot be empty')
        if len(trimmed) < 10:
            raise ValueError('Description must be at least 10 characters')
        return trimmed

    @field_validator('deadline')
    @classmethod
    def validate_deadline(cls, v: datetime) -> datetime:
        """Validate deadline is in the future"""
        # Always use UTC for comparison to match database timezone
        now = datetime.now(timezone.utc)

        # If v is naive, make it UTC-aware
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)

        if v <= now:
            raise ValueError('Deadline must be in the future')
        return v


class UpdateAssignmentRequest(BaseModel):
    """Request schema for updating an assignment"""
    teacher_id: int = Field(..., description="ID of the teacher (for authorization)")
    assignment_name: Optional[str] = Field(None, min_length=1, max_length=150, description="Name of the assignment")
    description: Optional[str] = Field(None, min_length=1, description="Assignment description")
    programming_language: Optional[Literal["python", "java"]] = Field(None, description="Programming language")
    deadline: Optional[datetime] = Field(None, description="Assignment deadline")
    allow_resubmission: Optional[bool] = Field(None, description="Whether to allow resubmissions")

    @field_validator('assignment_name')
    @classmethod
    def validate_assignment_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate and trim assignment name"""
        if v is None:
            return v
        trimmed = v.strip()
        if not trimmed:
            raise ValueError('Assignment name cannot be empty')
        if len(trimmed) > 150:
            raise ValueError('Assignment name must not exceed 150 characters')
        return trimmed

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate and trim description"""
        if v is None:
            return v
        trimmed = v.strip()
        if not trimmed:
            raise ValueError('Description cannot be empty')
        if len(trimmed) < 10:
            raise ValueError('Description must be at least 10 characters')
        return trimmed

    @field_validator('deadline')
    @classmethod
    def validate_deadline(cls, v: Optional[datetime]) -> Optional[datetime]:
        """Validate deadline is in the future"""
        if v is None:
            return v

        # Always use UTC for comparison to match database timezone
        now = datetime.now(timezone.utc)

        # If v is naive, make it UTC-aware
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)

        if v <= now:
            raise ValueError('Deadline must be in the future')
        return v


class AssignmentDetailResponse(BaseModel):
    """Response schema for assignment details"""
    id: int
    class_id: int
    title: str
    description: str
    programming_language: str
    deadline: str
    allow_resubmission: bool
    is_active: bool
    class_name: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class CreateAssignmentResponse(BaseModel):
    """Response schema for assignment creation"""
    success: bool
    message: Optional[str] = None
    assignment: Optional[AssignmentDetailResponse] = None


class UpdateAssignmentResponse(BaseModel):
    """Response schema for assignment update"""
    success: bool
    message: Optional[str] = None
    assignment: Optional[AssignmentDetailResponse] = None


class DeleteAssignmentResponse(BaseModel):
    """Response schema for assignment deletion"""
    success: bool
    message: Optional[str] = None


class GetAssignmentResponse(BaseModel):
    """Response schema for getting assignment details"""
    success: bool
    message: Optional[str] = None
    assignment: Optional[AssignmentDetailResponse] = None

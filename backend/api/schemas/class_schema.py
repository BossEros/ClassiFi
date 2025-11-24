"""
Class Schemas (Request/Response models)
Part of the API Layer
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CreateClassRequest(BaseModel):
    """Request schema for creating a class"""
    teacher_id: int = Field(..., description="ID of the teacher creating the class")
    class_name: str = Field(..., min_length=1, max_length=100, description="Name of the class")
    description: Optional[str] = Field(None, max_length=1000, description="Optional class description")
    class_code: Optional[str] = Field(None, max_length=20, description="Optional class code (auto-generated if not provided)")


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
        populate_by_name = True


class CreateClassResponse(BaseModel):
    """Response schema for class creation"""
    success: bool
    message: Optional[str] = None
    class_info: ClassResponse


class ClassListResponse(BaseModel):
    """Response schema for class list"""
    success: bool
    message: Optional[str] = None
    classes: list[ClassResponse]


class ClassDetailResponse(BaseModel):
    """Response schema for single class details"""
    success: bool
    message: Optional[str] = None
    class_info: Optional[ClassResponse] = None


class AssignmentResponse(BaseModel):
    """Response schema for assignment data"""
    id: int
    title: str
    description: str
    programming_language: str
    deadline: Optional[str] = None
    allow_resubmission: bool
    is_checked: bool
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class AssignmentListResponse(BaseModel):
    """Response schema for assignment list"""
    success: bool
    message: Optional[str] = None
    assignments: List[AssignmentResponse]


class StudentResponse(BaseModel):
    """Response schema for student data"""
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    enrolled_at: Optional[str] = None

    class Config:
        from_attributes = True


class StudentListResponse(BaseModel):
    """Response schema for student list"""
    success: bool
    message: Optional[str] = None
    students: List[StudentResponse]


class DeleteClassRequest(BaseModel):
    """Request schema for deleting a class"""
    teacher_id: int = Field(..., description="ID of the teacher (for authorization)")


class DeleteClassResponse(BaseModel):
    """Response schema for class deletion"""
    success: bool
    message: Optional[str] = None


class UpdateClassRequest(BaseModel):
    """Request schema for updating a class"""
    teacher_id: int = Field(..., description="ID of the teacher (for authorization)")
    class_name: Optional[str] = Field(None, min_length=1, max_length=100, description="New name for the class")
    description: Optional[str] = Field(None, max_length=1000, description="New description for the class")


class UpdateClassResponse(BaseModel):
    """Response schema for class update"""
    success: bool
    message: Optional[str] = None
    class_info: Optional[ClassResponse] = None


class GenerateCodeResponse(BaseModel):
    """Response schema for generating a unique class code"""
    success: bool
    code: str
    message: Optional[str] = None


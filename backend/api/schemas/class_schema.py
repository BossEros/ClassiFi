"""
Class Schemas (Request/Response models)
Part of the API Layer
"""

from pydantic import BaseModel, Field
from typing import Optional
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
    class_data: ClassResponse = Field(..., alias="class", serialization_alias="class")


class ClassListResponse(BaseModel):
    """Response schema for class list"""
    success: bool
    message: Optional[str] = None
    classes: list[ClassResponse]


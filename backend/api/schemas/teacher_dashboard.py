"""
Teacher Dashboard Schemas (Request/Response models)
Part of the API Layer
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


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


class TaskResponse(BaseModel):
    """Response schema for assignment/task data"""
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


class DashboardDataResponse(BaseModel):
    """Response schema for complete dashboard data"""
    success: bool
    message: Optional[str] = None
    recent_classes: List[ClassResponse]
    pending_tasks: List[TaskResponse]


class RecentClassesResponse(BaseModel):
    """Response schema for recent classes list"""
    success: bool
    message: Optional[str] = None
    classes: List[ClassResponse]


class PendingTasksResponse(BaseModel):
    """Response schema for pending tasks list"""
    success: bool
    message: Optional[str] = None
    tasks: List[TaskResponse]

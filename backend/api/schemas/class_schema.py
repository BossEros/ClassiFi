from pydantic import BaseModel
from typing import List, Optional

class ClassResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    student_count: int
    created_at: Optional[str] = None

class CreateClassRequest(BaseModel):
    teacher_id: int
    class_name: str
    description: Optional[str] = None
    class_code: Optional[str] = None

class CreateClassResponse(BaseModel):
    success: bool
    message: str
    class_info: Optional[ClassResponse] = None

class ClassListResponse(BaseModel):
    success: bool
    message: str
    classes: List[ClassResponse]

class ClassDetailResponse(BaseModel):
    success: bool
    message: str
    class_info: Optional[ClassResponse] = None

class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: str
    programming_language: str
    deadline: Optional[str] = None
    allow_resubmission: bool
    is_checked: bool
    created_at: Optional[str] = None

class AssignmentListResponse(BaseModel):
    success: bool
    message: str
    assignments: List[AssignmentResponse]

class StudentResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    enrolled_at: Optional[str] = None

class StudentListResponse(BaseModel):
    success: bool
    message: str
    students: List[StudentResponse]

class DeleteClassRequest(BaseModel):
    teacher_id: int

class DeleteClassResponse(BaseModel):
    success: bool
    message: str

class UpdateClassRequest(BaseModel):
    teacher_id: int
    class_name: Optional[str] = None
    description: Optional[str] = None

class UpdateClassResponse(BaseModel):
    success: bool
    message: str
    class_info: Optional[ClassResponse] = None

class GenerateCodeResponse(BaseModel):
    success: bool
    code: str
    message: str

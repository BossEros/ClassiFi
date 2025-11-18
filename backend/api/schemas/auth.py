"""
Authentication Schemas (Request/Response models)
Part of the API Layer
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from enum import Enum
from typing import Optional
from datetime import datetime
import re


def validate_password_complexity(password: str) -> str:
    """
    Reusable password validation function
    Used by RegisterRequest
    """
    if not re.search(r'[A-Z]', password):
        raise ValueError('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', password):
        raise ValueError('Password must contain at least one lowercase letter')
    if not re.search(r'[0-9]', password):
        raise ValueError('Password must contain at least one number')
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValueError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
    return password


class UserRoleEnum(str, Enum):
    """User role enumeration"""
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class RegisterRequest(BaseModel):
    """
    Request schema for user registration
    """
    role: UserRoleEnum
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format (alphanumeric and underscores only)"""
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must contain only letters, numbers, and underscores')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        return validate_password_complexity(v)

    def validate_passwords_match(self) -> bool:
        """Check if passwords match"""
        return self.password == self.confirm_password


class LoginRequest(BaseModel):
    """
    Request schema for user login
    """
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    """
    Response schema for user data
    """
    id: int
    supabase_user_id: Optional[str] = None
    username: str
    email: str
    first_name: str
    last_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True  # Allows ORM model conversion


class AuthResponse(BaseModel):
    """
    Response schema for authentication operations
    """
    success: bool
    message: Optional[str] = None
    user: Optional[UserResponse] = None
    token: Optional[str] = None  # Supabase access token


class ErrorResponse(BaseModel):
    """
    Response schema for errors
    """
    success: bool = False
    message: str
    errors: Optional[list[str]] = None


class ForgotPasswordRequest(BaseModel):
    """
    Request schema for forgot password
    """
    email: EmailStr



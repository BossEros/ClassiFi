"""
Authentication Router
Part of the API Layer
Defines API endpoints for authentication
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from api.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    ErrorResponse,
    ForgotPasswordRequest,
    UserResponse
)
from services.services.auth_service import AuthService
from repositories.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user

    This endpoint:
    1. Validates the registration data
    2. Creates a Supabase Auth user
    3. Creates a record in the local users table
    4. Returns user data and access token

    **Request Body:**
    - role: User role (student or instructor)
    - first_name: User's first name
    - last_name: User's last name
    - email: Valid email address
    - username: Unique username (3-50 chars, alphanumeric + underscores)
    - password: Password (min 8 chars, must contain uppercase, lowercase, and number)
    - confirm_password: Must match password

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - user: User data object
    - token: Supabase access token
    """
    # Validate passwords match
    if not request.validate_passwords_match():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )

    # Create auth service
    auth_service = AuthService(db)

    # Register user
    success, message, user_data, token = auth_service.register_user(
        email=request.email,
        password=request.password,
        username=request.username,
        first_name=request.first_name,
        last_name=request.last_name,
        role=request.role.value
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    # Convert user_data dict to UserResponse
    user_response = UserResponse(**user_data) if user_data else None

    return AuthResponse(
        success=True,
        message=message,
        user=user_response,
        token=token
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login a user

    This endpoint:
    1. Authenticates with Supabase
    2. Fetches user data from local database
    3. Returns user data and access token

    **Request Body:**
    - email: User's email address
    - password: User's password

    **Response:**
    - success: Boolean indicating success
    - message: Success or error message
    - user: User data object
    - token: Supabase access token
    """
    auth_service = AuthService(db)

    success, message, user_data, token = auth_service.login_user(
        email=request.email,
        password=request.password
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message
        )

    user_response = UserResponse(**user_data) if user_data else None

    return AuthResponse(
        success=True,
        message=message,
        user=user_response,
        token=token
    )


@router.post("/verify", response_model=AuthResponse)
async def verify_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify a Supabase access token

    **Query Parameters:**
    - token: Supabase access token

    **Response:**
    - success: Boolean indicating if token is valid
    - user: User data if token is valid
    """
    auth_service = AuthService(db)

    is_valid, user_data = auth_service.verify_token(token)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_response = UserResponse(**user_data) if user_data else None

    return AuthResponse(
        success=True,
        message="Token is valid",
        user=user_response
    )


@router.post("/forgot-password", response_model=AuthResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request a password reset email

    **Request Body:**
    - email: User's email address

    **Response:**
    - success: Boolean (always True for security)
    - message: Confirmation message
    """
    auth_service = AuthService(db)

    success, message = auth_service.request_password_reset(request.email)

    return AuthResponse(
        success=True,  # Always return True for security
        message=message
    )


@router.post("/logout", response_model=AuthResponse)
async def logout():
    """
    Logout endpoint (placeholder)

    Note: Actual logout is handled client-side by calling supabase.auth.signOut()
    This endpoint exists for API completeness but doesn't perform server-side operations

    **Response:**
    - success: Boolean
    - message: Confirmation message
    """
    return AuthResponse(
        success=True,
        message="Logout successful. Clear session on client."
    )

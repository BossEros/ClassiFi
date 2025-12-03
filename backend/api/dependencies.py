from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.database import get_db
from repositories.repositories.user_repository import UserRepository
from repositories.models.user import User
from shared.supabase_client import supabase
from typing import Optional
from uuid import UUID

# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user

    Validates the JWT token from the Authorization header
    and returns the corresponding user from the database.

    Args:
        credentials: Bearer token from Authorization header
        db: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise credentials_exception

        supabase_user_id = UUID(user_response.user.id)

        # Get user from local database
        user_repo = UserRepository(db)
        user = await user_repo.get_user_by_supabase_id(supabase_user_id)

        if not user:
            raise credentials_exception

        return user

    except Exception:
        raise credentials_exception


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the current active user

    This can be extended to check if user is active, verified, etc.

    Args:
        current_user: The authenticated user

    Returns:
        User: The active user

    Raises:
        HTTPException: 403 if user is inactive
    """
    # Add your custom logic here (e.g., check if user is active)
    # if not current_user.is_active:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Inactive user"
    #     )

    return current_user


async def get_current_teacher(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to get the current user if they are a teacher

    Args:
        current_user: The authenticated user

    Returns:
        User: The teacher user

    Raises:
        HTTPException: 403 if user is not a teacher
    """
    if current_user.role.value != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access this resource"
        )

    return current_user


async def get_current_student(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to get the current user if they are a student

    Args:
        current_user: The authenticated user

    Returns:
        User: The student user

    Raises:
        HTTPException: 403 if user is not a student
    """
    if current_user.role.value != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this resource"
        )

    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to get the current user if they are an admin

    Args:
        current_user: The authenticated user

    Returns:
        User: The admin user

    Raises:
        HTTPException: 403 if user is not an admin
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this resource"
        )

    return current_user

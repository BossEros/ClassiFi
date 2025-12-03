from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from repositories.models.user import User, UserRole
from repositories.repositories.base_repository import BaseRepository
from pydantic import BaseModel
from typing import Optional
from uuid import UUID


# Pydantic schemas for CRUD operations
class UserCreate(BaseModel):
    """Schema for creating a user"""
    supabase_user_id: UUID
    username: str
    email: str
    first_name: str
    last_name: str
    role: UserRole

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None

    class Config:
        from_attributes = True


class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    """
    Repository pattern for User data access
    Inherits common CRUD operations from BaseRepository
    Adds user-specific query methods
    """

    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def create_user(
        self,
        supabase_user_id: UUID,
        username: str,
        email: str,
        first_name: str,
        last_name: str,
        role: UserRole
    ) -> Optional[User]:
        """
        Create a new user in the database

        Args:
            supabase_user_id: UUID from Supabase auth.users
            username: Unique username
            email: User's email address
            first_name: User's first name
            last_name: User's last name
            role: User role (student or instructor)

        Returns:
            Created User object or None if creation failed
        """
        user_create = UserCreate(
            supabase_user_id=supabase_user_id,
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role
        )
        return await self.create(user_create)

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by internal database ID

        Args:
            user_id: Internal database user ID

        Returns:
            User object or None if not found
        """
        return await self.get(user_id)

    async def get_user_by_supabase_id(self, supabase_user_id: UUID) -> Optional[User]:
        """
        Get user by Supabase user ID

        Args:
            supabase_user_id: UUID from Supabase auth.users

        Returns:
            User object or None if not found
        """
        result = await self.db.execute(
            select(User).where(User.supabase_user_id == supabase_user_id)
        )
        return result.scalars().first()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address

        Args:
            email: User's email address

        Returns:
            User object or None if not found
        """
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalars().first()

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username

        Args:
            username: User's username

        Returns:
            User object or None if not found
        """
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalars().first()

    async def update_user(
        self,
        user_id: int,
        **kwargs
    ) -> Optional[User]:
        """
        Update user information

        Args:
            user_id: Internal database user ID
            **kwargs: Fields to update

        Returns:
            Updated User object or None if not found
        """
        # Filter out None values
        update_data = {k: v for k, v in kwargs.items() if v is not None}

        if not update_data:
            return await self.get_user_by_id(user_id)

        user_update = UserUpdate(**update_data)
        return await self.update(user_id, user_update)

    async def delete_user(self, user_id: int) -> bool:
        """
        Delete a user

        Args:
            user_id: Internal database user ID

        Returns:
            True if deleted, False if not found
        """
        return await self.delete(user_id)

    async def check_username_exists(self, username: str) -> bool:
        """
        Check if username already exists

        Args:
            username: Username to check

        Returns:
            True if exists, False otherwise
        """
        result = await self.db.execute(
            select(User.id).where(User.username == username)
        )
        return result.scalars().first() is not None

    async def check_email_exists(self, email: str) -> bool:
        """
        Check if email already exists

        Args:
            email: Email to check

        Returns:
            True if exists, False otherwise
        """
        result = await self.db.execute(
            select(User.id).where(User.email == email)
        )
        return result.scalars().first() is not None

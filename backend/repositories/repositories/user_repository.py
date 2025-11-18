"""
User Repository
Part of the Data Access Layer
Handles all database operations for the users table
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from repositories.models.user import User, UserRole
from typing import Optional
from uuid import UUID


class UserRepository:
    """
    Repository pattern for User data access
    """

    def __init__(self, db: Session):
        self.db = db

    def create_user(
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
        try:
            user = User(
                supabase_user_id=supabase_user_id,
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        except IntegrityError:
            self.db.rollback()
            return None

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by internal database ID

        Args:
            user_id: Internal database user ID

        Returns:
            User object or None if not found
        """
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_supabase_id(self, supabase_user_id: UUID) -> Optional[User]:
        """
        Get user by Supabase user ID

        Args:
            supabase_user_id: UUID from Supabase auth.users

        Returns:
            User object or None if not found
        """
        return self.db.query(User).filter(User.supabase_user_id == supabase_user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address

        Args:
            email: User's email address

        Returns:
            User object or None if not found
        """
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username

        Args:
            username: User's username

        Returns:
            User object or None if not found
        """
        return self.db.query(User).filter(User.username == username).first()

    def update_user(
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
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)

        try:
            self.db.commit()
            self.db.refresh(user)
            return user
        except IntegrityError:
            self.db.rollback()
            return None

    def delete_user(self, user_id: int) -> bool:
        """
        Delete a user

        Args:
            user_id: Internal database user ID

        Returns:
            True if deleted, False if not found
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return False

        self.db.delete(user)
        self.db.commit()
        return True

    def check_username_exists(self, username: str) -> bool:
        """
        Check if username already exists

        Args:
            username: Username to check

        Returns:
            True if exists, False otherwise
        """
        return self.db.query(User).filter(User.username == username).first() is not None

    def check_email_exists(self, email: str) -> bool:
        """
        Check if email already exists

        Args:
            email: Email to check

        Returns:
            True if exists, False otherwise
        """
        return self.db.query(User).filter(User.email == email).first() is not None

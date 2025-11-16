"""
User Database Model
Part of the Data Access Layer
"""

from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLAlchemyEnum, UUID
from sqlalchemy.sql import func
from data.database import Base
import enum


class UserRole(str, enum.Enum):
    """
    User role enumeration
    """
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Base):
    """
    SQLAlchemy model for users table
    Maps to the existing users table in your database
    """

    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Supabase integration
    supabase_user_id = Column(UUID(as_uuid=True), unique=True, nullable=True, index=True)

    # User information
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)

    # Role - use native PostgreSQL enum with values_callable to get lowercase values
    role = Column(
        SQLAlchemyEnum(UserRole, name="user_role", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), default=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}', role='{self.role.value}')>"

    @property
    def full_name(self) -> str:
        """Return user's full name"""
        return f"{self.first_name} {self.last_name}"

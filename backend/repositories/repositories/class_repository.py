"""
Class Repository
Part of the Data Access Layer
Handles database operations for classes
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from repositories.models.class_model import Class
from repositories.models.enrollment import Enrollment
from typing import List, Optional


class ClassRepository:
    """Repository for class-related database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_class_by_id(self, class_id: int) -> Optional[Class]:
        """
        Get a class by ID

        Args:
            class_id: ID of the class

        Returns:
            Class object or None if not found
        """
        return self.db.query(Class).filter(Class.id == class_id).first()

    def get_class_by_code(self, class_code: str) -> Optional[Class]:
        """
        Get a class by class code

        Args:
            class_code: Unique class code

        Returns:
            Class object or None if not found
        """
        return self.db.query(Class).filter(Class.class_code == class_code).first()

    def get_classes_by_teacher(
        self,
        teacher_id: int,
        active_only: bool = True
    ) -> List[Class]:
        """
        Get all classes taught by a teacher

        Args:
            teacher_id: ID of the teacher
            active_only: If True, only return active classes

        Returns:
            List of Class objects
        """
        query = self.db.query(Class).filter(Class.teacher_id == teacher_id)

        if active_only:
            query = query.filter(Class.is_active == True)

        return query.order_by(Class.created_at.desc()).all()

    def get_recent_classes_by_teacher(
        self,
        teacher_id: int,
        limit: int = 5
    ) -> List[Class]:
        """
        Get most recent classes taught by a teacher

        Args:
            teacher_id: ID of the teacher
            limit: Maximum number of classes to return

        Returns:
            List of Class objects
        """
        return (
            self.db.query(Class)
            .filter(and_(
                Class.teacher_id == teacher_id,
                Class.is_active == True
            ))
            .order_by(Class.created_at.desc())
            .limit(limit)
            .all()
        )

    def create_class(
        self,
        teacher_id: int,
        class_name: str,
        class_code: str,
        description: Optional[str] = None
    ) -> Class:
        """
        Create a new class

        Args:
            teacher_id: ID of the teacher
            class_name: Name of the class
            class_code: Unique class code
            description: Optional class description

        Returns:
            Created Class object
        """
        new_class = Class(
            teacher_id=teacher_id,
            class_name=class_name,
            class_code=class_code,
            description=description,
            is_active=True
        )

        self.db.add(new_class)
        self.db.commit()
        self.db.refresh(new_class)

        return new_class

    def update_class(
        self,
        class_id: int,
        **kwargs
    ) -> Optional[Class]:
        """
        Update a class

        Args:
            class_id: ID of the class to update
            **kwargs: Fields to update

        Returns:
            Updated Class object or None if not found
        """
        class_obj = self.get_class_by_id(class_id)

        if not class_obj:
            return None

        for key, value in kwargs.items():
            if hasattr(class_obj, key):
                setattr(class_obj, key, value)

        self.db.commit()
        self.db.refresh(class_obj)

        return class_obj

    def delete_class(self, class_id: int) -> bool:
        """
        Delete a class (sets is_active to False)

        Args:
            class_id: ID of the class to delete

        Returns:
            True if deleted, False if not found
        """
        class_obj = self.get_class_by_id(class_id)

        if not class_obj:
            return False

        class_obj.is_active = False
        self.db.commit()

        return True

    def get_student_count(self, class_id: int) -> int:
        """
        Get the number of students in a class

        Args:
            class_id: ID of the class

        Returns:
            Number of students enrolled in the class
        """
        return self.db.query(Enrollment).filter(
            Enrollment.class_id == class_id
        ).count()

    def check_class_code_exists(self, class_code: str) -> bool:
        """
        Check if a class code already exists

        Args:
            class_code: Class code to check

        Returns:
            True if code exists, False otherwise
        """
        existing_class = self.get_class_by_code(class_code)
        return existing_class is not None

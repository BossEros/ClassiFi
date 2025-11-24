"""
Class Repository
Part of the Data Access Layer
Handles database operations for classes
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from repositories.models.class_model import Class
from repositories.models.enrollment import Enrollment
from typing import List, Optional
import sys


class ClassRepository:
    """Repository for class-related database operations"""

    def __init__(self, db: AsyncSession):
        print(f"[DEBUGGER:ClassRepository.__init__:19] db type: {type(db)}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:ClassRepository.__init__:20] db class: {db.__class__.__name__}", file=sys.stderr, flush=True)
        self.db = db

    async def get_class_by_id(self, class_id: int) -> Optional[Class]:
        """
        Get a class by ID

        Args:
            class_id: ID of the class

        Returns:
            Class object or None if not found
        """
        result = await self.db.execute(
            select(Class).where(Class.id == class_id)
        )
        return result.scalar_one_or_none()

    async def get_class_by_code(self, class_code: str) -> Optional[Class]:
        """
        Get a class by class code

        Args:
            class_code: Unique class code

        Returns:
            Class object or None if not found
        """
        result = await self.db.execute(
            select(Class).where(Class.class_code == class_code)
        )
        return result.scalar_one_or_none()

    async def get_classes_by_teacher(
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
        query = select(Class).where(Class.teacher_id == teacher_id)

        if active_only:
            query = query.where(Class.is_active == True)

        query = query.order_by(Class.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_recent_classes_by_teacher(
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
        print(f"[DEBUGGER:ClassRepository.get_recent_classes_by_teacher:91] teacher_id={teacher_id}, limit={limit}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:ClassRepository.get_recent_classes_by_teacher:92] self.db type: {type(self.db)}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:ClassRepository.get_recent_classes_by_teacher:93] Building query...", file=sys.stderr, flush=True)
        query = (
            select(Class)
            .where(and_(
                Class.teacher_id == teacher_id,
                Class.is_active == True
            ))
            .order_by(Class.created_at.desc())
            .limit(limit)
        )
        print(f"[DEBUGGER:ClassRepository.get_recent_classes_by_teacher:102] About to execute query", file=sys.stderr, flush=True)
        result = await self.db.execute(query)
        print(f"[DEBUGGER:ClassRepository.get_recent_classes_by_teacher:104] Query executed successfully", file=sys.stderr, flush=True)
        return list(result.scalars().all())

    async def create_class(
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
        await self.db.commit()
        await self.db.refresh(new_class)

        return new_class

    async def update_class(
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
        class_obj = await self.get_class_by_id(class_id)

        if not class_obj:
            return None

        for key, value in kwargs.items():
            if hasattr(class_obj, key):
                setattr(class_obj, key, value)

        await self.db.commit()
        await self.db.refresh(class_obj)

        return class_obj

    async def delete_class(self, class_id: int) -> bool:
        """
        Delete a class permanently (hard delete with cascade)

        Args:
            class_id: ID of the class to delete

        Returns:
            True if deleted, False if not found
        """
        class_obj = await self.get_class_by_id(class_id)

        if not class_obj:
            return False

        await self.db.delete(class_obj)
        await self.db.commit()

        return True

    async def get_student_count(self, class_id: int) -> int:
        """
        Get the number of students in a class

        Args:
            class_id: ID of the class

        Returns:
            Number of students enrolled in the class
        """
        print(f"[DEBUGGER:ClassRepository.get_student_count:198] class_id={class_id}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:ClassRepository.get_student_count:199] self.db type: {type(self.db)}", file=sys.stderr, flush=True)
        result = await self.db.execute(
            select(func.count()).select_from(Enrollment).where(
                Enrollment.class_id == class_id
            )
        )
        print(f"[DEBUGGER:ClassRepository.get_student_count:205] Query executed", file=sys.stderr, flush=True)
        return result.scalar() or 0

    async def check_class_code_exists(self, class_code: str) -> bool:
        """
        Check if a class code already exists

        Args:
            class_code: Class code to check

        Returns:
            True if code exists, False otherwise
        """
        existing_class = await self.get_class_by_code(class_code)
        return existing_class is not None

    async def get_enrolled_students(self, class_id: int) -> List:
        """
        Get all students enrolled in a class

        Args:
            class_id: ID of the class

        Returns:
            List of User objects (students)
        """
        from repositories.models.user import User

        query = (
            select(User)
            .join(Enrollment, User.id == Enrollment.student_id)
            .where(Enrollment.class_id == class_id)
            .order_by(User.last_name.asc(), User.first_name.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_classes_by_student(
        self,
        student_id: int,
        active_only: bool = True
    ) -> List[Class]:
        """
        Get all classes a student is enrolled in

        Args:
            student_id: ID of the student
            active_only: If True, only return active classes

        Returns:
            List of Class objects
        """
        query = (
            select(Class)
            .join(Enrollment, Class.id == Enrollment.class_id)
            .where(Enrollment.student_id == student_id)
        )
        if active_only:
            query = query.where(Class.is_active == True)
        query = query.order_by(Enrollment.enrolled_at.desc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

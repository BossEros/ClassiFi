"""
Enrollment Repository
Part of the Data Access Layer
Handles database operations for class enrollments
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from repositories.models.enrollment import Enrollment
from repositories.models.class_model import Class
from typing import List, Optional


class EnrollmentRepository:
    """Repository for enrollment-related database operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_enrollment(self, student_id: int, class_id: int) -> Enrollment:
        """
        Create a new enrollment

        Args:
            student_id: ID of the student
            class_id: ID of the class

        Returns:
            Created Enrollment object
        """
        enrollment = Enrollment(
            student_id=student_id,
            class_id=class_id
        )
        self.db.add(enrollment)
        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment

    async def check_enrollment_exists(self, student_id: int, class_id: int) -> bool:
        """
        Check if an enrollment already exists

        Args:
            student_id: ID of the student
            class_id: ID of the class

        Returns:
            True if enrollment exists, False otherwise
        """
        result = await self.db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == student_id,
                    Enrollment.class_id == class_id
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_enrollment(self, student_id: int, class_id: int) -> Optional[Enrollment]:
        """
        Get a specific enrollment

        Args:
            student_id: ID of the student
            class_id: ID of the class

        Returns:
            Enrollment object or None if not found
        """
        result = await self.db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == student_id,
                    Enrollment.class_id == class_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_enrollments_by_student(self, student_id: int) -> List[Enrollment]:
        """
        Get all enrollments for a student

        Args:
            student_id: ID of the student

        Returns:
            List of Enrollment objects
        """
        result = await self.db.execute(
            select(Enrollment)
            .where(Enrollment.student_id == student_id)
            .order_by(Enrollment.enrolled_at.desc())
        )
        return list(result.scalars().all())

    async def delete_enrollment(self, student_id: int, class_id: int) -> bool:
        """
        Delete an enrollment (leave class)

        Args:
            student_id: ID of the student
            class_id: ID of the class

        Returns:
            True if deleted, False if not found
        """
        enrollment = await self.get_enrollment(student_id, class_id)
        if not enrollment:
            return False

        await self.db.delete(enrollment)
        await self.db.commit()
        return True

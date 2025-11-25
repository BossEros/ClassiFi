"""
Submission Repository
Part of the Data Access Layer
Handles database operations for assignment submissions
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update
from sqlalchemy.orm import selectinload
from repositories.models.submission import Submission
from repositories.models.assignment import Assignment
from repositories.models.user import User
from typing import List, Optional


class SubmissionRepository:
    """Repository for submission-related database operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_submission(
        self,
        assignment_id: int,
        student_id: int,
        file_name: str,
        file_path: str,
        file_size: int
    ) -> Submission:
        """
        Create a new submission
        Automatically calculates submission_number and marks it as latest

        Args:
            assignment_id: ID of the assignment
            student_id: ID of the student
            file_name: Name of the uploaded file
            file_path: Path where the file is stored
            file_size: Size of the file in bytes

        Returns:
            Created Submission object
        """
        # Get the next submission number
        existing_submissions = await self.get_submission_history(
            assignment_id, student_id
        )
        submission_number = len(existing_submissions) + 1

        # Mark all previous submissions as not latest
        if existing_submissions:
            await self._update_is_latest_flags(assignment_id, student_id, False)

        # Create new submission
        submission = Submission(
            assignment_id=assignment_id,
            student_id=student_id,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            submission_number=submission_number,
            is_latest=True
        )

        self.db.add(submission)
        await self.db.commit()
        await self.db.refresh(submission)

        return submission

    async def get_submission_by_id(self, submission_id: int) -> Optional[Submission]:
        """
        Get a submission by ID

        Args:
            submission_id: ID of the submission

        Returns:
            Submission object or None if not found
        """
        result = await self.db.execute(
            select(Submission)
            .options(
                selectinload(Submission.assignment),
                selectinload(Submission.student)
            )
            .where(Submission.id == submission_id)
        )
        return result.scalar_one_or_none()

    async def get_submissions_by_assignment(
        self,
        assignment_id: int,
        latest_only: bool = True
    ) -> List[Submission]:
        """
        Get all submissions for an assignment

        Args:
            assignment_id: ID of the assignment
            latest_only: If True, only return the latest submission for each student

        Returns:
            List of Submission objects
        """
        query = (
            select(Submission)
            .options(
                selectinload(Submission.student)
            )
            .where(Submission.assignment_id == assignment_id)
        )

        if latest_only:
            query = query.where(Submission.is_latest == True)

        query = query.order_by(Submission.submitted_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_submissions_by_student(
        self,
        student_id: int,
        latest_only: bool = True
    ) -> List[Submission]:
        """
        Get all submissions by a student

        Args:
            student_id: ID of the student
            latest_only: If True, only return the latest submission for each assignment

        Returns:
            List of Submission objects
        """
        query = (
            select(Submission)
            .options(
                selectinload(Submission.assignment)
            )
            .where(Submission.student_id == student_id)
        )

        if latest_only:
            query = query.where(Submission.is_latest == True)

        query = query.order_by(Submission.submitted_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_latest_submission(
        self,
        assignment_id: int,
        student_id: int
    ) -> Optional[Submission]:
        """
        Get the latest submission for a specific student-assignment pair

        Args:
            assignment_id: ID of the assignment
            student_id: ID of the student

        Returns:
            Latest Submission object or None if not found
        """
        result = await self.db.execute(
            select(Submission)
            .options(
                selectinload(Submission.assignment),
                selectinload(Submission.student)
            )
            .where(
                and_(
                    Submission.assignment_id == assignment_id,
                    Submission.student_id == student_id,
                    Submission.is_latest == True
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_submission_history(
        self,
        assignment_id: int,
        student_id: int
    ) -> List[Submission]:
        """
        Get all submissions for a specific student-assignment pair (submission history)

        Args:
            assignment_id: ID of the assignment
            student_id: ID of the student

        Returns:
            List of Submission objects ordered by submission number
        """
        result = await self.db.execute(
            select(Submission)
            .where(
                and_(
                    Submission.assignment_id == assignment_id,
                    Submission.student_id == student_id
                )
            )
            .order_by(Submission.submission_number.asc())
        )
        return list(result.scalars().all())

    async def check_submission_exists(
        self,
        assignment_id: int,
        student_id: int
    ) -> bool:
        """
        Check if a student has submitted for an assignment

        Args:
            assignment_id: ID of the assignment
            student_id: ID of the student

        Returns:
            True if submission exists, False otherwise
        """
        result = await self.db.execute(
            select(Submission).where(
                and_(
                    Submission.assignment_id == assignment_id,
                    Submission.student_id == student_id
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def _update_is_latest_flags(
        self,
        assignment_id: int,
        student_id: int,
        is_latest: bool
    ) -> None:
        """
        Update is_latest flag for all submissions of a student-assignment pair

        Args:
            assignment_id: ID of the assignment
            student_id: ID of the student
            is_latest: New value for is_latest flag
        """
        await self.db.execute(
            update(Submission)
            .where(
                and_(
                    Submission.assignment_id == assignment_id,
                    Submission.student_id == student_id
                )
            )
            .values(is_latest=is_latest)
        )
        await self.db.commit()

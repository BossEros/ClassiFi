from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from repositories.models.assignment import Assignment, ProgrammingLanguage
from typing import List, Optional
from datetime import datetime
import sys


class AssignmentRepository:
    """Repository for assignment-related database operations"""

    def __init__(self, db: AsyncSession):
        print(f"[DEBUGGER:AssignmentRepository.__init__:19] db type: {type(db)}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:AssignmentRepository.__init__:20] db class: {db.__class__.__name__}", file=sys.stderr, flush=True)
        self.db = db

    async def get_assignment_by_id(self, assignment_id: int) -> Optional[Assignment]:
        """
        Get an assignment by ID

        Args:
            assignment_id: ID of the assignment

        Returns:
            Assignment object or None if not found
        """
        result = await self.db.execute(
            select(Assignment).where(Assignment.id == assignment_id)
        )
        return result.scalar_one_or_none()

    async def get_assignments_by_class(
        self,
        class_id: int,
        active_only: bool = True
    ) -> List[Assignment]:
        """
        Get all assignments for a class

        Args:
            class_id: ID of the class
            active_only: If True, only return active assignments

        Returns:
            List of Assignment objects
        """
        query = select(Assignment).where(Assignment.class_id == class_id)

        if active_only:
            query = query.where(Assignment.is_active == True)

        query = query.order_by(Assignment.deadline.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_pending_assignments_by_teacher(
        self,
        teacher_id: int,
        limit: Optional[int] = None
    ) -> List[Assignment]:
        """
        Get pending assignments for all classes taught by a teacher
        Returns assignments that haven't passed their deadline yet

        Args:
            teacher_id: ID of the teacher
            limit: Optional limit on number of assignments to return

        Returns:
            List of Assignment objects
        """
        from repositories.models.class_model import Class

        query = (
            select(Assignment)
            .options(selectinload(Assignment.class_obj))
            .join(Class, Assignment.class_id == Class.id)
            .where(and_(
                Class.teacher_id == teacher_id,
                Assignment.is_active == True,
                Assignment.deadline >= func.now()
            ))
            .order_by(Assignment.deadline.asc())
        )

        if limit:
            query = query.limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_assignments_needing_review_by_teacher(
        self,
        teacher_id: int,
        limit: Optional[int] = None
    ) -> List[Assignment]:
        """
        Get assignments that need review for all classes taught by a teacher
        This is a placeholder - you'll need to implement this when you have
        a submissions table to check which assignments have ungraded submissions

        Args:
            teacher_id: ID of the teacher
            limit: Optional limit on number of assignments to return

        Returns:
            List of Assignment objects
        """
        print(f"[DEBUGGER:AssignmentRepository.get_assignments_needing_review_by_teacher:115] teacher_id={teacher_id}, limit={limit}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:AssignmentRepository.get_assignments_needing_review_by_teacher:116] self.db type: {type(self.db)}", file=sys.stderr, flush=True)
        from repositories.models.class_model import Class

        # TODO: Join with submissions table to filter assignments with pending reviews
        # For now, return all active assignments
        print(f"[DEBUGGER:AssignmentRepository.get_assignments_needing_review_by_teacher:121] Building query...", file=sys.stderr, flush=True)
        query = (
            select(Assignment)
            .options(selectinload(Assignment.class_obj))
            .join(Class, Assignment.class_id == Class.id)
            .where(and_(
                Class.teacher_id == teacher_id,
                Assignment.is_active == True
            ))
            .order_by(Assignment.deadline.asc())
        )

        if limit:
            query = query.limit(limit)

        print(f"[DEBUGGER:AssignmentRepository.get_assignments_needing_review_by_teacher:136] About to execute query", file=sys.stderr, flush=True)
        result = await self.db.execute(query)
        print(f"[DEBUGGER:AssignmentRepository.get_assignments_needing_review_by_teacher:138] Query executed successfully", file=sys.stderr, flush=True)
        return list(result.scalars().all())

    async def create_assignment(
        self,
        class_id: int,
        assignment_name: str,
        description: str,
        programming_language: ProgrammingLanguage,
        deadline: datetime,
        allow_resubmission: bool = True
    ) -> Assignment:
        """
        Create a new assignment

        Args:
            class_id: ID of the class
            assignment_name: Name of the assignment
            description: Assignment description
            programming_language: Programming language for the assignment
            deadline: Deadline for submission
            allow_resubmission: Whether to allow resubmissions

        Returns:
            Created Assignment object
        """
        new_assignment = Assignment(
            class_id=class_id,
            assignment_name=assignment_name,
            description=description,
            programming_language=programming_language,
            deadline=deadline,
            allow_resubmission=allow_resubmission,
            is_active=True
        )

        self.db.add(new_assignment)
        await self.db.commit()
        await self.db.refresh(new_assignment)

        return new_assignment

    async def update_assignment(
        self,
        assignment_id: int,
        **kwargs
    ) -> Optional[Assignment]:
        """
        Update an assignment

        Args:
            assignment_id: ID of the assignment to update
            **kwargs: Fields to update

        Returns:
            Updated Assignment object or None if not found
        """
        assignment = await self.get_assignment_by_id(assignment_id)

        if not assignment:
            return None

        for key, value in kwargs.items():
            if hasattr(assignment, key):
                setattr(assignment, key, value)

        await self.db.commit()
        await self.db.refresh(assignment)

        return assignment

    async def delete_assignment(self, assignment_id: int) -> bool:
        """
        Delete an assignment (hard delete)

        Args:
            assignment_id: ID of the assignment to delete

        Returns:
            True if deleted, False if not found
        """
        assignment = await self.get_assignment_by_id(assignment_id)

        if not assignment:
            return False

        await self.db.delete(assignment)
        await self.db.commit()

        return True

    async def get_pending_assignments_for_student(
        self,
        student_id: int,
        limit: Optional[int] = None
    ) -> List[Assignment]:
        """
        Get pending assignments for all classes a student is enrolled in
        Returns assignments that haven't passed their deadline yet

        Args:
            student_id: ID of the student
            limit: Optional limit on number of assignments to return

        Returns:
            List of Assignment objects
        """
        from repositories.models.class_model import Class
        from repositories.models.enrollment import Enrollment

        query = (
            select(Assignment)
            .options(selectinload(Assignment.class_obj))
            .join(Class, Assignment.class_id == Class.id)
            .join(Enrollment, Class.id == Enrollment.class_id)
            .where(and_(
                Enrollment.student_id == student_id,
                Assignment.is_active == True,
                Class.is_active == True,
                Assignment.deadline >= func.now()
            ))
            .order_by(Assignment.deadline.asc())
        )

        if limit:
            query = query.limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

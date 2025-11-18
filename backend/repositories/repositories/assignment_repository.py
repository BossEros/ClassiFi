"""
Assignment Repository
Part of the Data Access Layer
Handles database operations for assignments
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from repositories.models.assignment import Assignment, ProgrammingLanguage
from typing import List, Optional
from datetime import datetime


class AssignmentRepository:
    """Repository for assignment-related database operations"""

    def __init__(self, db: Session):
        self.db = db

    def get_assignment_by_id(self, assignment_id: int) -> Optional[Assignment]:
        """
        Get an assignment by ID

        Args:
            assignment_id: ID of the assignment

        Returns:
            Assignment object or None if not found
        """
        return self.db.query(Assignment).filter(Assignment.id == assignment_id).first()

    def get_assignments_by_class(
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
        query = self.db.query(Assignment).filter(Assignment.class_id == class_id)

        if active_only:
            query = query.filter(Assignment.is_active == True)

        return query.order_by(Assignment.deadline.asc()).all()

    def get_pending_assignments_by_teacher(
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
            self.db.query(Assignment)
            .join(Class, Assignment.class_id == Class.id)
            .filter(and_(
                Class.teacher_id == teacher_id,
                Assignment.is_active == True,
                Assignment.deadline >= datetime.now()
            ))
            .order_by(Assignment.deadline.asc())
        )

        if limit:
            query = query.limit(limit)

        return query.all()

    def get_assignments_needing_review_by_teacher(
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
        from repositories.models.class_model import Class

        # TODO: Join with submissions table to filter assignments with pending reviews
        # For now, return all active assignments
        query = (
            self.db.query(Assignment)
            .join(Class, Assignment.class_id == Class.id)
            .filter(and_(
                Class.teacher_id == teacher_id,
                Assignment.is_active == True
            ))
            .order_by(Assignment.deadline.asc())
        )

        if limit:
            query = query.limit(limit)

        return query.all()

    def create_assignment(
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
        self.db.commit()
        self.db.refresh(new_assignment)

        return new_assignment

    def update_assignment(
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
        assignment = self.get_assignment_by_id(assignment_id)

        if not assignment:
            return None

        for key, value in kwargs.items():
            if hasattr(assignment, key):
                setattr(assignment, key, value)

        self.db.commit()
        self.db.refresh(assignment)

        return assignment

    def delete_assignment(self, assignment_id: int) -> bool:
        """
        Delete an assignment (sets is_active to False)

        Args:
            assignment_id: ID of the assignment to delete

        Returns:
            True if deleted, False if not found
        """
        assignment = self.get_assignment_by_id(assignment_id)

        if not assignment:
            return False

        assignment.is_active = False
        self.db.commit()

        return True

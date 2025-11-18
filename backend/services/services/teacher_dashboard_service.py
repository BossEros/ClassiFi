"""
Teacher Dashboard Service
Part of the Services Layer
Handles business logic for teacher dashboard data
"""

from sqlalchemy.orm import Session
from repositories.repositories.class_repository import ClassRepository
from repositories.repositories.assignment_repository import AssignmentRepository
from typing import List, Dict, Any, Tuple


class TeacherDashboardService:
    """
    Business logic for teacher dashboard operations
    """

    def __init__(self, db: Session):
        self.db = db
        self.class_repo = ClassRepository(db)
        self.assignment_repo = AssignmentRepository(db)

    def get_dashboard_data(
        self,
        teacher_id: int,
        recent_classes_limit: int = 5,
        pending_tasks_limit: int = 10
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Get all data needed for teacher dashboard

        Args:
            teacher_id: ID of the teacher
            recent_classes_limit: Number of recent classes to fetch
            pending_tasks_limit: Number of pending tasks to fetch

        Returns:
            Tuple of (success, message, dashboard_data)
        """
        try:
            # Get recent classes
            recent_classes = self.class_repo.get_recent_classes_by_teacher(
                teacher_id=teacher_id,
                limit=recent_classes_limit
            )

            # Get pending assignments that need review
            pending_tasks = self.assignment_repo.get_assignments_needing_review_by_teacher(
                teacher_id=teacher_id,
                limit=pending_tasks_limit
            )

            # Format classes data
            classes_data = []
            for class_obj in recent_classes:
                student_count = self.class_repo.get_student_count(class_obj.id)
                classes_data.append({
                    "id": class_obj.id,
                    "name": class_obj.class_name,
                    "code": class_obj.class_code,
                    "description": class_obj.description,
                    "student_count": student_count,
                    "created_at": class_obj.created_at.isoformat() if class_obj.created_at else None
                })

            # Format assignments data
            tasks_data = []
            for assignment in pending_tasks:
                tasks_data.append({
                    "id": assignment.id,
                    "title": assignment.assignment_name,
                    "description": assignment.description,
                    "class_id": assignment.class_id,
                    "class_name": assignment.class_obj.class_name if assignment.class_obj else "Unknown",
                    "programming_language": assignment.programming_language.value,
                    "deadline": assignment.deadline.isoformat() if assignment.deadline else None,
                    "allow_resubmission": assignment.allow_resubmission,
                    "created_at": assignment.created_at.isoformat() if assignment.created_at else None
                })

            dashboard_data = {
                "recent_classes": classes_data,
                "pending_tasks": tasks_data
            }

            return True, "Dashboard data retrieved successfully", dashboard_data

        except Exception as e:
            return False, f"Failed to fetch dashboard data: {str(e)}", {}

    def get_recent_classes(
        self,
        teacher_id: int,
        limit: int = 5
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get recent classes for a teacher

        Args:
            teacher_id: ID of the teacher
            limit: Number of classes to fetch

        Returns:
            Tuple of (success, message, classes_data)
        """
        try:
            recent_classes = self.class_repo.get_recent_classes_by_teacher(
                teacher_id=teacher_id,
                limit=limit
            )

            classes_data = []
            for class_obj in recent_classes:
                student_count = self.class_repo.get_student_count(class_obj.id)
                classes_data.append({
                    "id": class_obj.id,
                    "name": class_obj.class_name,
                    "code": class_obj.class_code,
                    "description": class_obj.description,
                    "student_count": student_count,
                    "created_at": class_obj.created_at.isoformat() if class_obj.created_at else None
                })

            return True, "Classes retrieved successfully", classes_data

        except Exception as e:
            return False, f"Failed to fetch classes: {str(e)}", []

    def get_pending_tasks(
        self,
        teacher_id: int,
        limit: int = 10
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get pending tasks for a teacher

        Args:
            teacher_id: ID of the teacher
            limit: Number of tasks to fetch

        Returns:
            Tuple of (success, message, tasks_data)
        """
        try:
            pending_tasks = self.assignment_repo.get_assignments_needing_review_by_teacher(
                teacher_id=teacher_id,
                limit=limit
            )

            tasks_data = []
            for assignment in pending_tasks:
                tasks_data.append({
                    "id": assignment.id,
                    "title": assignment.assignment_name,
                    "description": assignment.description,
                    "class_id": assignment.class_id,
                    "class_name": assignment.class_obj.class_name if assignment.class_obj else "Unknown",
                    "programming_language": assignment.programming_language.value,
                    "deadline": assignment.deadline.isoformat() if assignment.deadline else None,
                    "allow_resubmission": assignment.allow_resubmission,
                    "created_at": assignment.created_at.isoformat() if assignment.created_at else None
                })

            return True, "Tasks retrieved successfully", tasks_data

        except Exception as e:
            return False, f"Failed to fetch tasks: {str(e)}", []

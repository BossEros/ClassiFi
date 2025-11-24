"""
Teacher Dashboard Service
Part of the Services Layer
Handles business logic for teacher dashboard data
"""

from sqlalchemy.ext.asyncio import AsyncSession
from repositories.repositories.class_repository import ClassRepository
from repositories.repositories.assignment_repository import AssignmentRepository
from typing import List, Dict, Any, Tuple
import sys
import traceback


class TeacherDashboardService:
    """
    Business logic for teacher dashboard operations
    """

    def __init__(self, db: AsyncSession):
        print(f"[DEBUGGER:TeacherDashboardService.__init__:23] Initializing service", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:TeacherDashboardService.__init__:24] db type: {type(db)}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:TeacherDashboardService.__init__:25] db class: {db.__class__.__name__}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:TeacherDashboardService.__init__:26] db module: {db.__class__.__module__}", file=sys.stderr, flush=True)
        self.db = db
        print(f"[DEBUGGER:TeacherDashboardService.__init__:28] Creating ClassRepository", file=sys.stderr, flush=True)
        self.class_repo = ClassRepository(db)
        print(f"[DEBUGGER:TeacherDashboardService.__init__:30] class_repo.db type: {type(self.class_repo.db)}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:TeacherDashboardService.__init__:31] Creating AssignmentRepository", file=sys.stderr, flush=True)
        self.assignment_repo = AssignmentRepository(db)
        print(f"[DEBUGGER:TeacherDashboardService.__init__:33] assignment_repo.db type: {type(self.assignment_repo.db)}", file=sys.stderr, flush=True)

    async def get_dashboard_data(
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
            print(f"[DEBUGGER:get_dashboard_data:51] Entered method - teacher_id={teacher_id}", file=sys.stderr, flush=True)
            print(f"[DEBUGGER:get_dashboard_data:52] self.db type: {type(self.db)}", file=sys.stderr, flush=True)
            print(f"[DEBUGGER:get_dashboard_data:53] self.class_repo.db type: {type(self.class_repo.db)}", file=sys.stderr, flush=True)
            print(f"[DEBUGGER:get_dashboard_data:54] About to call get_recent_classes_by_teacher", file=sys.stderr, flush=True)

            # Get recent classes
            recent_classes = await self.class_repo.get_recent_classes_by_teacher(
                teacher_id=teacher_id,
                limit=recent_classes_limit
            )

            print(f"[DEBUGGER:get_dashboard_data:61] Retrieved {len(recent_classes)} recent classes", file=sys.stderr, flush=True)
            print(f"[DEBUGGER:get_dashboard_data:62] About to call get_assignments_needing_review_by_teacher", file=sys.stderr, flush=True)

            # Get pending assignments that need review
            pending_tasks = await self.assignment_repo.get_assignments_needing_review_by_teacher(
                teacher_id=teacher_id,
                limit=pending_tasks_limit
            )

            print(f"[DEBUGGER:get_dashboard_data:69] Retrieved {len(pending_tasks)} pending tasks", file=sys.stderr, flush=True)

            # Format classes data
            classes_data = []
            for class_obj in recent_classes:
                student_count = await self.class_repo.get_student_count(class_obj.id)
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
            print(f"[DEBUGGER:get_dashboard_data:EXCEPTION] Exception caught: {str(e)}", file=sys.stderr, flush=True)
            print(f"[DEBUGGER:get_dashboard_data:EXCEPTION] Exception type: {type(e)}", file=sys.stderr, flush=True)
            print(f"[DEBUGGER:get_dashboard_data:EXCEPTION] Full traceback:", file=sys.stderr, flush=True)
            traceback.print_exc(file=sys.stderr)
            sys.stderr.flush()
            return False, f"Failed to fetch dashboard data: {str(e)}", {}

    async def get_recent_classes(
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
            recent_classes = await self.class_repo.get_recent_classes_by_teacher(
                teacher_id=teacher_id,
                limit=limit
            )

            classes_data = []
            for class_obj in recent_classes:
                student_count = await self.class_repo.get_student_count(class_obj.id)
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

    async def get_pending_tasks(
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
            pending_tasks = await self.assignment_repo.get_assignments_needing_review_by_teacher(
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

from sqlalchemy.ext.asyncio import AsyncSession
from repositories.repositories.class_repository import ClassRepository
from repositories.repositories.assignment_repository import AssignmentRepository
from repositories.repositories.enrollment_repository import EnrollmentRepository
from typing import List, Dict, Any, Tuple


class StudentDashboardService:
    """
    Business logic for student dashboard operations
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.class_repo = ClassRepository(db)
        self.assignment_repo = AssignmentRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)

    async def get_dashboard_data(
        self,
        student_id: int,
        enrolled_classes_limit: int = 12,
        pending_assignments_limit: int = 10
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Get all data needed for student dashboard

        Args:
            student_id: ID of the student
            enrolled_classes_limit: Number of enrolled classes to fetch
            pending_assignments_limit: Number of pending assignments to fetch

        Returns:
            Tuple of (success, message, dashboard_data)
        """
        try:
            # Get enrolled classes
            enrolled_classes = await self.class_repo.get_classes_by_student(
                student_id=student_id,
                active_only=True
            )

            # Limit the classes if needed
            if enrolled_classes_limit and len(enrolled_classes) > enrolled_classes_limit:
                enrolled_classes = enrolled_classes[:enrolled_classes_limit]

            # Get pending assignments
            pending_assignments = await self.assignment_repo.get_pending_assignments_for_student(
                student_id=student_id,
                limit=pending_assignments_limit
            )

            # Format classes data
            classes_data = []
            for class_obj in enrolled_classes:
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
            assignments_data = []
            for assignment in pending_assignments:
                assignments_data.append({
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
                "enrolled_classes": classes_data,
                "pending_assignments": assignments_data
            }

            return True, "Dashboard data retrieved successfully", dashboard_data

        except Exception as e:
            return False, f"Failed to fetch dashboard data: {str(e)}", {}

    async def join_class(
        self,
        student_id: int,
        class_code: str
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Join a class using a class code

        Args:
            student_id: ID of the student
            class_code: Unique class code to join

        Returns:
            Tuple of (success, message, class_data)
        """
        try:
            # Find class by code
            class_obj = await self.class_repo.get_class_by_code(class_code)

            if not class_obj:
                return False, "Invalid class code. Please check and try again.", {}

            if not class_obj.is_active:
                return False, "This class is no longer active.", {}

            # Check if already enrolled
            already_enrolled = await self.enrollment_repo.check_enrollment_exists(
                student_id=student_id,
                class_id=class_obj.id
            )

            if already_enrolled:
                return False, "You are already enrolled in this class.", {}

            # Create enrollment
            await self.enrollment_repo.create_enrollment(
                student_id=student_id,
                class_id=class_obj.id
            )

            # Get student count for response
            student_count = await self.class_repo.get_student_count(class_obj.id)

            class_data = {
                "id": class_obj.id,
                "name": class_obj.class_name,
                "code": class_obj.class_code,
                "description": class_obj.description,
                "student_count": student_count,
                "created_at": class_obj.created_at.isoformat() if class_obj.created_at else None
            }

            return True, f"Successfully joined {class_obj.class_name}!", class_data

        except Exception as e:
            return False, f"Failed to join class: {str(e)}", {}

    async def leave_class(
        self,
        student_id: int,
        class_id: int
    ) -> Tuple[bool, str]:
        """
        Leave a class

        Args:
            student_id: ID of the student
            class_id: ID of the class to leave

        Returns:
            Tuple of (success, message)
        """
        try:
            # Check if enrolled
            enrollment_exists = await self.enrollment_repo.check_enrollment_exists(
                student_id=student_id,
                class_id=class_id
            )

            if not enrollment_exists:
                return False, "You are not enrolled in this class."

            # Delete enrollment
            deleted = await self.enrollment_repo.delete_enrollment(
                student_id=student_id,
                class_id=class_id
            )

            if deleted:
                return True, "Successfully left the class."
            else:
                return False, "Failed to leave class. Please try again."

        except Exception as e:
            return False, f"Failed to leave class: {str(e)}"

    async def get_enrolled_classes(
        self,
        student_id: int,
        limit: int = None
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get enrolled classes for a student

        Args:
            student_id: ID of the student
            limit: Optional limit on number of classes

        Returns:
            Tuple of (success, message, classes_data)
        """
        try:
            enrolled_classes = await self.class_repo.get_classes_by_student(
                student_id=student_id,
                active_only=True
            )

            if limit and len(enrolled_classes) > limit:
                enrolled_classes = enrolled_classes[:limit]

            classes_data = []
            for class_obj in enrolled_classes:
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

    async def get_pending_assignments(
        self,
        student_id: int,
        limit: int = 10
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get pending assignments for a student

        Args:
            student_id: ID of the student
            limit: Number of assignments to fetch

        Returns:
            Tuple of (success, message, assignments_data)
        """
        try:
            pending_assignments = await self.assignment_repo.get_pending_assignments_for_student(
                student_id=student_id,
                limit=limit
            )

            assignments_data = []
            for assignment in pending_assignments:
                assignments_data.append({
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

            return True, "Assignments retrieved successfully", assignments_data

        except Exception as e:
            return False, f"Failed to fetch assignments: {str(e)}", []

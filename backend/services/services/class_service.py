"""
Class Service
Part of the Services Layer
Handles business logic for class operations
"""

import random
import string
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.repositories.class_repository import ClassRepository
from repositories.repositories.assignment_repository import AssignmentRepository
from typing import Tuple, Dict, Any, List, Optional


class ClassService:
    """
    Business logic for class operations
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.class_repo = ClassRepository(db)
        self.assignment_repo = AssignmentRepository(db)

    async def generate_unique_class_code(self, length: int = 6) -> str:
        """
        Generate a unique class code

        Args:
            length: Length of the code (default: 6)

        Returns:
            Unique class code
        """
        chars = string.ascii_uppercase + string.digits
        max_attempts = 100  # Prevent infinite loop

        for _ in range(max_attempts):
            code = ''.join(random.choice(chars) for _ in range(length))
            if not await self.class_repo.check_class_code_exists(code):
                return code

        # If we couldn't generate a unique code, try with longer length
        return await self.generate_unique_class_code(length + 1)

    async def create_class(
        self,
        teacher_id: int,
        class_name: str,
        description: str = None,
        class_code: str = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Create a new class

        Args:
            teacher_id: ID of the teacher
            class_name: Name of the class
            description: Optional description
            class_code: Optional class code (auto-generated if not provided)

        Returns:
            Tuple of (success, message, class_data)
        """
        try:
            # Generate class code if not provided
            if not class_code:
                class_code = await self.generate_unique_class_code()

            # Check if code already exists (shouldn't happen with generation, but safety check)
            if await self.class_repo.check_class_code_exists(class_code):
                # Regenerate if somehow we got a duplicate
                class_code = await self.generate_unique_class_code()

            # Create the class
            new_class = await self.class_repo.create_class(
                teacher_id=teacher_id,
                class_name=class_name,
                class_code=class_code,
                description=description
            )

            # Get student count
            student_count = await self.class_repo.get_student_count(new_class.id)

            # Format response
            class_data = {
                "id": new_class.id,
                "name": new_class.class_name,
                "code": new_class.class_code,
                "description": new_class.description,
                "student_count": student_count,
                "created_at": new_class.created_at.isoformat() if new_class.created_at else None
            }

            return True, "Class created successfully", class_data

        except Exception as e:
            return False, f"Failed to create class: {str(e)}", {}

    async def get_all_classes_by_teacher(
        self,
        teacher_id: int,
        active_only: bool = True
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get all classes for a teacher

        Args:
            teacher_id: ID of the teacher
            active_only: If True, only return active classes

        Returns:
            Tuple of (success, message, classes_data)
        """
        try:
            classes = await self.class_repo.get_classes_by_teacher(
                teacher_id=teacher_id,
                active_only=active_only
            )

            classes_data = []
            for class_obj in classes:
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

    async def get_class_by_id(
        self,
        class_id: int,
        teacher_id: Optional[int] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Get a class by ID with stats

        Args:
            class_id: ID of the class
            teacher_id: Optional teacher ID for authorization check

        Returns:
            Tuple of (success, message, class_data)
        """
        try:
            class_obj = await self.class_repo.get_class_by_id(class_id)

            if not class_obj:
                return False, "Class not found", {}

            if not class_obj.is_active:
                return False, "Class has been deleted", {}

            # Check authorization if teacher_id provided
            if teacher_id and class_obj.teacher_id != teacher_id:
                return False, "Unauthorized access to this class", {}

            student_count = await self.class_repo.get_student_count(class_id)

            class_data = {
                "id": class_obj.id,
                "name": class_obj.class_name,
                "code": class_obj.class_code,
                "description": class_obj.description,
                "student_count": student_count,
                "created_at": class_obj.created_at.isoformat() if class_obj.created_at else None
            }

            return True, "Class retrieved successfully", class_data

        except Exception as e:
            return False, f"Failed to fetch class: {str(e)}", {}

    async def get_class_assignments(
        self,
        class_id: int
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get all assignments for a class with check status

        Args:
            class_id: ID of the class

        Returns:
            Tuple of (success, message, assignments_data)
        """
        try:
            # Verify class exists
            class_obj = await self.class_repo.get_class_by_id(class_id)
            if not class_obj or not class_obj.is_active:
                return False, "Class not found", []

            assignments = await self.assignment_repo.get_assignments_by_class(class_id)

            assignments_data = []
            for assignment in assignments:
                # For now, isChecked is based on whether deadline has passed
                # This can be enhanced later to check actual submission reviews
                from datetime import datetime
                is_checked = assignment.deadline < datetime.now()

                assignments_data.append({
                    "id": assignment.id,
                    "title": assignment.assignment_name,
                    "description": assignment.description,
                    "programming_language": assignment.programming_language.value,
                    "deadline": assignment.deadline.isoformat() if assignment.deadline else None,
                    "allow_resubmission": assignment.allow_resubmission,
                    "is_checked": is_checked,
                    "created_at": assignment.created_at.isoformat() if assignment.created_at else None
                })

            return True, "Assignments retrieved successfully", assignments_data

        except Exception as e:
            return False, f"Failed to fetch assignments: {str(e)}", []

    async def get_class_students(
        self,
        class_id: int
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get all students enrolled in a class

        Args:
            class_id: ID of the class

        Returns:
            Tuple of (success, message, students_data)
        """
        try:
            # Verify class exists
            class_obj = await self.class_repo.get_class_by_id(class_id)
            if not class_obj or not class_obj.is_active:
                return False, "Class not found", []

            students = await self.class_repo.get_enrolled_students(class_id)

            students_data = []
            for student in students:
                students_data.append({
                    "id": student.id,
                    "username": student.username,
                    "email": student.email,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                    "full_name": student.full_name,
                    "enrolled_at": None  # Can be enhanced to include enrollment date
                })

            return True, "Students retrieved successfully", students_data

        except Exception as e:
            return False, f"Failed to fetch students: {str(e)}", []

    async def delete_class(
        self,
        class_id: int,
        teacher_id: int
    ) -> Tuple[bool, str]:
        """
        Delete a class (soft delete)

        Args:
            class_id: ID of the class to delete
            teacher_id: ID of the teacher (for authorization)

        Returns:
            Tuple of (success, message)
        """
        try:
            class_obj = await self.class_repo.get_class_by_id(class_id)

            if not class_obj:
                return False, "Class not found"

            if class_obj.teacher_id != teacher_id:
                return False, "Unauthorized to delete this class"

            if not class_obj.is_active:
                return False, "Class already deleted"

            deleted = await self.class_repo.delete_class(class_id)

            if deleted:
                return True, "Class deleted successfully"
            else:
                return False, "Failed to delete class"

        except Exception as e:
            return False, f"Failed to delete class: {str(e)}"

    async def update_class(
        self,
        class_id: int,
        teacher_id: int,
        class_name: Optional[str] = None,
        description: Optional[str] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Update a class

        Args:
            class_id: ID of the class to update
            teacher_id: ID of the teacher (for authorization)
            class_name: New name for the class (optional)
            description: New description for the class (optional)

        Returns:
            Tuple of (success, message, updated_class_data)
        """
        try:
            # Get the class
            class_obj = await self.class_repo.get_class_by_id(class_id)

            if not class_obj:
                return False, "Class not found", {}

            if not class_obj.is_active:
                return False, "Class has been deleted", {}

            # Check authorization
            if class_obj.teacher_id != teacher_id:
                return False, "Unauthorized to update this class", {}

            # Build update kwargs
            update_data = {}
            if class_name is not None:
                update_data['class_name'] = class_name.strip()
            if description is not None:
                update_data['description'] = description.strip() if description else None

            # Only update if there's something to update
            if not update_data:
                return False, "No fields to update", {}

            # Update the class
            updated_class = await self.class_repo.update_class(class_id, **update_data)

            if not updated_class:
                return False, "Failed to update class", {}

            # Get student count for response
            student_count = await self.class_repo.get_student_count(class_id)

            class_data = {
                "id": updated_class.id,
                "name": updated_class.class_name,
                "code": updated_class.class_code,
                "description": updated_class.description,
                "student_count": student_count,
                "created_at": updated_class.created_at.isoformat() if updated_class.created_at else None
            }

            return True, "Class updated successfully", class_data

        except Exception as e:
            return False, f"Failed to update class: {str(e)}", {}

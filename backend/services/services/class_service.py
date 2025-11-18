"""
Class Service
Part of the Services Layer
Handles business logic for class operations
"""

import random
import string
from sqlalchemy.orm import Session
from repositories.repositories.class_repository import ClassRepository
from typing import Tuple, Dict, Any, List


class ClassService:
    """
    Business logic for class operations
    """

    def __init__(self, db: Session):
        self.db = db
        self.class_repo = ClassRepository(db)

    def generate_unique_class_code(self, length: int = 6) -> str:
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
            if not self.class_repo.check_class_code_exists(code):
                return code

        # If we couldn't generate a unique code, try with longer length
        return self.generate_unique_class_code(length + 1)

    def create_class(
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
                class_code = self.generate_unique_class_code()

            # Check if code already exists (shouldn't happen with generation, but safety check)
            if self.class_repo.check_class_code_exists(class_code):
                # Regenerate if somehow we got a duplicate
                class_code = self.generate_unique_class_code()

            # Create the class
            new_class = self.class_repo.create_class(
                teacher_id=teacher_id,
                class_name=class_name,
                class_code=class_code,
                description=description
            )

            # Get student count
            student_count = self.class_repo.get_student_count(new_class.id)

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

    def get_all_classes_by_teacher(
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
            classes = self.class_repo.get_classes_by_teacher(
                teacher_id=teacher_id,
                active_only=active_only
            )

            classes_data = []
            for class_obj in classes:
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


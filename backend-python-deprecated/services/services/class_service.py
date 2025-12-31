import random
import string
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.repositories.class_repository import ClassRepository
from repositories.repositories.assignment_repository import AssignmentRepository
from repositories.models.assignment import ProgrammingLanguage
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
            await self.db.rollback()
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
                from datetime import datetime, timezone
                # Use timezone-aware UTC for comparison
                now = datetime.now(timezone.utc)
                is_checked = assignment.deadline < now

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
            await self.db.rollback()
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
            await self.db.rollback()
            return False, f"Failed to update class: {str(e)}", {}

    async def create_assignment(
        self,
        class_id: int,
        teacher_id: int,
        assignment_name: str,
        description: str,
        programming_language: str,
        deadline: datetime,
        allow_resubmission: bool = True
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Create a new assignment for a class

        Args:
            class_id: ID of the class
            teacher_id: ID of the teacher (for authorization)
            assignment_name: Name of the assignment
            description: Assignment description
            programming_language: Programming language (python or java)
            deadline: Assignment deadline
            allow_resubmission: Whether to allow resubmissions

        Returns:
            Tuple of (success, message, assignment_data)
        """
        try:
            # Verify class exists and is active
            class_obj = await self.class_repo.get_class_by_id(class_id)

            if not class_obj:
                return False, "Class not found", {}

            if not class_obj.is_active:
                return False, "Class has been deleted", {}

            # Check authorization - teacher must own the class
            if class_obj.teacher_id != teacher_id:
                return False, "Unauthorized to create assignments for this class", {}

            # Validate deadline is in the future (use timezone-aware UTC)
            from datetime import timezone as tz
            now = datetime.now(tz.utc)
            # Ensure deadline is timezone-aware
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=tz.utc)
            if deadline <= now:
                return False, "Deadline must be in the future", {}

            # Convert programming language string to enum
            try:
                prog_lang_enum = ProgrammingLanguage(programming_language.lower())
            except ValueError:
                return False, f"Invalid programming language. Must be 'python' or 'java'", {}

            # Create the assignment
            assignment = await self.assignment_repo.create_assignment(
                class_id=class_id,
                assignment_name=assignment_name.strip(),
                description=description.strip(),
                programming_language=prog_lang_enum,
                deadline=deadline,
                allow_resubmission=allow_resubmission
            )

            # Format response
            assignment_data = {
                "id": assignment.id,
                "class_id": assignment.class_id,
                "title": assignment.assignment_name,
                "description": assignment.description,
                "programming_language": assignment.programming_language.value,
                "deadline": assignment.deadline.isoformat() if assignment.deadline else None,
                "allow_resubmission": assignment.allow_resubmission,
                "is_active": assignment.is_active,
                "created_at": assignment.created_at.isoformat() if assignment.created_at else None
            }

            return True, "Assignment created successfully", assignment_data

        except Exception as e:
            await self.db.rollback()
            return False, f"Failed to create assignment: {str(e)}", {}

    async def update_assignment(
        self,
        assignment_id: int,
        teacher_id: int,
        assignment_name: Optional[str] = None,
        description: Optional[str] = None,
        programming_language: Optional[str] = None,
        deadline: Optional[datetime] = None,
        allow_resubmission: Optional[bool] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Update an assignment
        
        Args:
            assignment_id: ID of the assignment
            teacher_id: ID of the teacher (for authorization)
            assignment_name: New name
            description: New description
            programming_language: New programming language
            deadline: New deadline
            allow_resubmission: New allow_resubmission setting
            
        Returns:
            Tuple of (success, message, assignment_data)
        """
        try:
            # Get assignment
            assignment = await self.assignment_repo.get_assignment_by_id(assignment_id)
            
            if not assignment:
                return False, "Assignment not found", {}
                
            if not assignment.is_active:
                return False, "Assignment has been deleted", {}
                
            # Verify class and authorization
            class_obj = await self.class_repo.get_class_by_id(assignment.class_id)
            if not class_obj or class_obj.teacher_id != teacher_id:
                return False, "Unauthorized to update this assignment", {}
                
            # Validate deadline if provided (use timezone-aware UTC)
            if deadline:
                from datetime import timezone as tz
                now = datetime.now(tz.utc)
                # Ensure deadline is timezone-aware
                if deadline.tzinfo is None:
                    deadline = deadline.replace(tzinfo=tz.utc)
                if deadline <= now:
                    return False, "Deadline must be in the future", {}
                    
            # Convert programming language if provided
            prog_lang_enum = None
            if programming_language:
                try:
                    prog_lang_enum = ProgrammingLanguage(programming_language.lower())
                except ValueError:
                    return False, f"Invalid programming language. Must be 'python' or 'java'", {}
            
            # Prepare update data
            update_data = {}
            if assignment_name is not None:
                update_data['assignment_name'] = assignment_name.strip()
            if description is not None:
                update_data['description'] = description.strip()
            if prog_lang_enum is not None:
                update_data['programming_language'] = prog_lang_enum
            if deadline is not None:
                update_data['deadline'] = deadline
            if allow_resubmission is not None:
                update_data['allow_resubmission'] = allow_resubmission
                
            if not update_data:
                return False, "No fields to update", {}
                
            # Update assignment
            updated_assignment = await self.assignment_repo.update_assignment(
                assignment_id,
                **update_data
            )
            
            if not updated_assignment:
                return False, "Failed to update assignment", {}
                
            # Format response
            assignment_data = {
                "id": updated_assignment.id,
                "class_id": updated_assignment.class_id,
                "title": updated_assignment.assignment_name,
                "description": updated_assignment.description,
                "programming_language": updated_assignment.programming_language.value,
                "deadline": updated_assignment.deadline.isoformat() if updated_assignment.deadline else None,
                "allow_resubmission": updated_assignment.allow_resubmission,
                "is_active": updated_assignment.is_active,
                "created_at": updated_assignment.created_at.isoformat() if updated_assignment.created_at else None
            }
            
            return True, "Assignment updated successfully", assignment_data
            
        except Exception as e:
            await self.db.rollback()
            return False, f"Failed to update assignment: {str(e)}", {}

    async def delete_assignment(
        self,
        assignment_id: int,
        teacher_id: int
    ) -> Tuple[bool, str]:
        """
        Delete an assignment (hard delete)
        
        Args:
            assignment_id: ID of the assignment
            teacher_id: ID of the teacher (for authorization)
            
        Returns:
            Tuple of (success, message)
        """
        try:
            # Get assignment
            assignment = await self.assignment_repo.get_assignment_by_id(assignment_id)
            
            if not assignment:
                return False, "Assignment not found"
                
            # Verify class and authorization
            class_obj = await self.class_repo.get_class_by_id(assignment.class_id)
            if not class_obj or class_obj.teacher_id != teacher_id:
                return False, "Unauthorized to delete this assignment"
                
            # Delete assignment
            success = await self.assignment_repo.delete_assignment(assignment_id)
            
            if success:
                return True, "Assignment deleted successfully"
            else:
                return False, "Failed to delete assignment"
                
        except Exception as e:
            await self.db.rollback()
            return False, f"Failed to delete assignment: {str(e)}"

    async def remove_student(
        self,
        class_id: int,
        student_id: int,
        teacher_id: int
    ) -> Tuple[bool, str]:
        """
        Remove a student from a class

        Args:
            class_id: ID of the class
            student_id: ID of the student to remove
            teacher_id: ID of the teacher (for authorization)

        Returns:
            Tuple of (success, message)
        """
        try:
            # Verify class exists
            class_obj = await self.class_repo.get_class_by_id(class_id)

            if not class_obj:
                return False, "Class not found"

            # Check authorization - teacher must own the class
            if class_obj.teacher_id != teacher_id:
                return False, "Unauthorized to remove students from this class"

            # Remove student
            success = await self.class_repo.remove_student(class_id, student_id)

            if success:
                return True, "Student removed successfully"
            else:
                return False, "Student not found in this class"

        except Exception as e:
            await self.db.rollback()
            
    async def get_assignment_details(
        self,
        assignment_id: int,
        user_id: int
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Get assignment details by ID

        Args:
            assignment_id: ID of the assignment
            user_id: ID of the user requesting details

        Returns:
            Tuple of (success, message, assignment_data)
        """
        try:
            # Get assignment
            assignment = await self.assignment_repo.get_assignment_by_id(assignment_id)

            if not assignment:
                return False, "Assignment not found", {}

            if not assignment.is_active:
                return False, "Assignment has been deleted", {}

            # Verify class exists
            class_obj = await self.class_repo.get_class_by_id(assignment.class_id)
            if not class_obj:
                return False, "Class not found", {}

            # Check authorization
            # User must be either the teacher of the class or a student enrolled in the class
            is_teacher = class_obj.teacher_id == user_id
            is_student = await self.class_repo.is_student_enrolled(assignment.class_id, user_id)

            if not (is_teacher or is_student):
                return False, "Unauthorized to view this assignment", {}

            # Format response
            assignment_data = {
                "id": assignment.id,
                "class_id": assignment.class_id,
                "class_name": class_obj.class_name,
                "title": assignment.assignment_name,
                "description": assignment.description,
                "programming_language": assignment.programming_language.value,
                "deadline": assignment.deadline.isoformat() if assignment.deadline else None,
                "allow_resubmission": assignment.allow_resubmission,
                "is_active": assignment.is_active,
                "created_at": assignment.created_at.isoformat() if assignment.created_at else None
            }

            return True, "Assignment details retrieved successfully", assignment_data

        except Exception as e:
            return False, f"Failed to fetch assignment details: {str(e)}", {}

"""
Submission Service
Part of the Services Layer
Handles business logic for assignment submission operations
"""

import os
import uuid
from pathlib import Path
from datetime import datetime
from typing import Tuple, Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.repositories.submission_repository import SubmissionRepository
from repositories.repositories.assignment_repository import AssignmentRepository
from repositories.repositories.enrollment_repository import EnrollmentRepository
from fastapi import UploadFile


class SubmissionService:
    """
    Business logic for submission operations
    """

    # File storage configuration
    UPLOAD_DIR = Path("uploads/submissions")
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes
    ALLOWED_EXTENSIONS = {
        "python": [".py", ".ipynb"],
        "java": [".java", ".jar"]
    }

    def __init__(self, db: AsyncSession):
        self.db = db
        self.submission_repo = SubmissionRepository(db)
        self.assignment_repo = AssignmentRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)

        # Ensure upload directory exists
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    def _validate_file_extension(
        self,
        filename: str,
        programming_language: str
    ) -> Tuple[bool, str]:
        """
        Validate file extension matches assignment programming language

        Args:
            filename: Name of the uploaded file
            programming_language: Expected programming language

        Returns:
            Tuple of (is_valid, error_message)
        """
        file_ext = Path(filename).suffix.lower()
        allowed = self.ALLOWED_EXTENSIONS.get(programming_language.lower(), [])

        if file_ext not in allowed:
            allowed_str = ", ".join(allowed)
            return False, f"Invalid file type. Expected {allowed_str} for {programming_language}"

        return True, ""

    async def _save_file(
        self,
        file: UploadFile,
        assignment_id: int,
        student_id: int
    ) -> Tuple[str, str, int]:
        """
        Save uploaded file to disk

        Args:
            file: Uploaded file
            assignment_id: ID of the assignment
            student_id: ID of the student

        Returns:
            Tuple of (file_name, file_path, file_size)
        """
        # Generate unique filename
        file_ext = Path(file.filename).suffix
        unique_filename = f"{student_id}_{assignment_id}_{uuid.uuid4()}{file_ext}"

        # Create assignment-specific directory
        assignment_dir = self.UPLOAD_DIR / str(assignment_id)
        assignment_dir.mkdir(parents=True, exist_ok=True)

        # Full file path
        file_path = assignment_dir / unique_filename

        # Write file to disk
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        file_size = len(content)

        return file.filename, str(file_path), file_size

    async def submit_assignment(
        self,
        assignment_id: int,
        student_id: int,
        file: UploadFile
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Submit an assignment

        Args:
            assignment_id: ID of the assignment
            student_id: ID of the student
            file: Uploaded file

        Returns:
            Tuple of (success, message, submission_data)
        """
        try:
            # 1. Validate assignment exists
            assignment = await self.assignment_repo.get_assignment_by_id(assignment_id)
            if not assignment:
                return False, "Assignment not found", {}

            # 2. Check if assignment is active
            if not assignment.is_active:
                return False, "This assignment is no longer active", {}

            # 3. Check if student is enrolled in the class
            is_enrolled = await self.enrollment_repo.check_enrollment_exists(
                student_id, assignment.class_id
            )
            if not is_enrolled:
                return False, "You are not enrolled in this class", {}

            # 4. Check deadline
            if assignment.deadline < datetime.now():
                return False, "Assignment deadline has passed", {}

            # 5. Check if resubmission is allowed
            existing_submission = await self.submission_repo.check_submission_exists(
                assignment_id, student_id
            )
            if existing_submission and not assignment.allow_resubmission:
                return False, "Resubmission is not allowed for this assignment", {}

            # 6. Validate file size
            content = await file.read()
            file_size = len(content)
            await file.seek(0)  # Reset file pointer for later use

            if file_size > self.MAX_FILE_SIZE:
                max_mb = self.MAX_FILE_SIZE / (1024 * 1024)
                return False, f"File size exceeds maximum allowed ({max_mb}MB)", {}

            if file_size == 0:
                return False, "File is empty", {}

            # 7. Validate file extension
            is_valid, error_msg = self._validate_file_extension(
                file.filename, assignment.programming_language
            )
            if not is_valid:
                return False, error_msg, {}

            # 8. Save file
            file_name, file_path, file_size = await self._save_file(
                file, assignment_id, student_id
            )

            # 9. Create submission record
            submission = await self.submission_repo.create_submission(
                assignment_id=assignment_id,
                student_id=student_id,
                file_name=file_name,
                file_path=file_path,
                file_size=file_size
            )

            # 10. Format response
            submission_data = {
                "id": submission.id,
                "assignment_id": submission.assignment_id,
                "student_id": submission.student_id,
                "file_name": submission.file_name,
                "file_size": submission.file_size,
                "submission_number": submission.submission_number,
                "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
                "is_latest": submission.is_latest
            }

            return True, "Assignment submitted successfully", submission_data

        except Exception as e:
            return False, f"Failed to submit assignment: {str(e)}", {}

    async def get_submission_history(
        self,
        assignment_id: int,
        student_id: int
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get submission history for a student-assignment pair

        Args:
            assignment_id: ID of the assignment
            student_id: ID of the student

        Returns:
            Tuple of (success, message, submissions_list)
        """
        try:
            submissions = await self.submission_repo.get_submission_history(
                assignment_id, student_id
            )

            submissions_data = [
                {
                    "id": sub.id,
                    "assignment_id": sub.assignment_id,
                    "student_id": sub.student_id,
                    "file_name": sub.file_name,
                    "file_size": sub.file_size,
                    "submission_number": sub.submission_number,
                    "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
                    "is_latest": sub.is_latest
                }
                for sub in submissions
            ]

            return True, "Submission history retrieved successfully", submissions_data

        except Exception as e:
            return False, f"Failed to retrieve submission history: {str(e)}", []

    async def get_assignment_submissions(
        self,
        assignment_id: int,
        latest_only: bool = True
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get all submissions for an assignment (typically for teachers)

        Args:
            assignment_id: ID of the assignment
            latest_only: If True, only return latest submission per student

        Returns:
            Tuple of (success, message, submissions_list)
        """
        try:
            # Verify assignment exists
            assignment = await self.assignment_repo.get_assignment_by_id(assignment_id)
            if not assignment:
                return False, "Assignment not found", []

            submissions = await self.submission_repo.get_submissions_by_assignment(
                assignment_id, latest_only
            )

            submissions_data = [
                {
                    "id": sub.id,
                    "assignment_id": sub.assignment_id,
                    "student_id": sub.student_id,
                    "student_name": f"{sub.student.first_name} {sub.student.last_name}" if sub.student else None,
                    "file_name": sub.file_name,
                    "file_size": sub.file_size,
                    "submission_number": sub.submission_number,
                    "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
                    "is_latest": sub.is_latest
                }
                for sub in submissions
            ]

            return True, "Submissions retrieved successfully", submissions_data

        except Exception as e:
            return False, f"Failed to retrieve submissions: {str(e)}", []

    async def get_student_submissions(
        self,
        student_id: int,
        latest_only: bool = True
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Get all submissions by a student

        Args:
            student_id: ID of the student
            latest_only: If True, only return latest submission per assignment

        Returns:
            Tuple of (success, message, submissions_list)
        """
        try:
            submissions = await self.submission_repo.get_submissions_by_student(
                student_id, latest_only
            )

            submissions_data = [
                {
                    "id": sub.id,
                    "assignment_id": sub.assignment_id,
                    "assignment_name": sub.assignment.assignment_name if sub.assignment else None,
                    "student_id": sub.student_id,
                    "file_name": sub.file_name,
                    "file_size": sub.file_size,
                    "submission_number": sub.submission_number,
                    "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
                    "is_latest": sub.is_latest
                }
                for sub in submissions
            ]

            return True, "Submissions retrieved successfully", submissions_data

        except Exception as e:
            return False, f"Failed to retrieve submissions: {str(e)}", []

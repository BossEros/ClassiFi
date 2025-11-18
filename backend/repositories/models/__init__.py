"""
Data Models Package
Part of the Data Access Layer
Exports all SQLAlchemy models
"""

from repositories.models.user import User, UserRole
from repositories.models.class_model import Class
from repositories.models.assignment import Assignment, ProgrammingLanguage
from repositories.models.enrollment import Enrollment
from repositories.models.submission import Submission
from repositories.models.similarity_report import SimilarityReport
from repositories.models.similarity_result import SimilarityResult

__all__ = [
    "User",
    "UserRole",
    "Class",
    "Assignment",
    "ProgrammingLanguage",
    "Enrollment",
    "Submission",
    "SimilarityReport",
    "SimilarityResult"
]

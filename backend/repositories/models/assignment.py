from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, TIMESTAMP, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from repositories.database import Base
from enum import Enum


class ProgrammingLanguage(str, Enum):
    """Enum for supported programming languages"""
    python = "python"
    java = "java"


class Assignment(Base):
    """
    SQLAlchemy model for assignments table
    Represents an assignment for a class
    """
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    programming_language = Column(
        SQLEnum(ProgrammingLanguage, name="programming_language", create_type=False),
        nullable=False
    )
    deadline = Column(TIMESTAMP(timezone=True), nullable=False)
    allow_resubmission = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    class_obj = relationship("Class", back_populates="assignments", lazy="selectin")
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan", lazy="selectin")
    similarity_reports = relationship("SimilarityReport", back_populates="assignment", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"<Assignment(id={self.id}, name='{self.assignment_name}', class_id={self.class_id})>"

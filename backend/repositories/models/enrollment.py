"""
Enrollment Model
Part of the Data Access Layer
Represents student enrollment in classes
"""

from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from repositories.database import Base


class Enrollment(Base):
    """
    SQLAlchemy model for enrollments table
    Links students to classes (many-to-many relationship)
    """
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    enrolled_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    student = relationship("User", back_populates="enrollments", lazy="selectin")
    class_obj = relationship("Class", back_populates="enrollments", lazy="selectin")

    # Table arguments for constraints and indexes
    __table_args__ = (
        UniqueConstraint('student_id', 'class_id', name='uq_student_class'),
        Index('idx_enrollments_student', 'student_id'),
        Index('idx_enrollments_class', 'class_id'),
    )

    def __repr__(self):
        return f"<Enrollment(id={self.id}, student_id={self.student_id}, class_id={self.class_id})>"


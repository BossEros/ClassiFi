from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, TIMESTAMP, UniqueConstraint, Index, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from repositories.database import Base


class Submission(Base):
    """
    SQLAlchemy model for submissions table
    Stores student code submissions for assignments
    """
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=False)
    submission_number = Column(Integer, nullable=False, default=1)
    submitted_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    is_latest = Column(Boolean, nullable=False, default=True)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions", lazy="selectin")
    student = relationship("User", back_populates="submissions", lazy="selectin")

    # Table arguments for constraints and indexes
    __table_args__ = (
        UniqueConstraint('assignment_id', 'student_id', 'submission_number', 
                        name='uq_assignment_student_submission'),
        CheckConstraint('file_size > 0 AND file_size <= 10485760', name='check_file_size'),
        CheckConstraint('submission_number > 0', name='check_submission_number'),
        Index('idx_submissions_assignment', 'assignment_id'),
        Index('idx_submissions_student', 'student_id'),
        Index('idx_submissions_latest', 'assignment_id', 'student_id', 
              postgresql_where=(Column('is_latest') == True)),
        Index('idx_submissions_date', 'submitted_at'),
    )

    def __repr__(self):
        return f"<Submission(id={self.id}, assignment_id={self.assignment_id}, student_id={self.student_id}, submission_number={self.submission_number})>"


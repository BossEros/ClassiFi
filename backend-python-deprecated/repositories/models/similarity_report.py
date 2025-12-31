from sqlalchemy import Column, Integer, Text, ForeignKey, TIMESTAMP, CheckConstraint, Index, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from repositories.database import Base


class SimilarityReport(Base):
    """
    SQLAlchemy model for similarity_reports table
    Stores class-wide similarity analysis reports (DOLOS-style overview)
    """
    __tablename__ = "similarity_reports"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    total_submissions = Column(Integer, nullable=False)
    total_comparisons = Column(Integer, nullable=False)
    flagged_pairs = Column(Integer, nullable=False, default=0)
    average_similarity = Column(DECIMAL(5, 2), nullable=True)
    highest_similarity = Column(DECIMAL(5, 2), nullable=True)
    generated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    report_file_path = Column(Text, nullable=True)

    # Relationships
    assignment = relationship("Assignment", back_populates="similarity_reports", lazy="selectin")
    teacher = relationship("User", foreign_keys=[teacher_id], lazy="selectin")
    similarity_results = relationship("SimilarityResult", back_populates="report", cascade="all, delete-orphan", lazy="selectin")

    # Table arguments for constraints and indexes
    __table_args__ = (
        CheckConstraint('average_similarity >= 0 AND average_similarity <= 100', 
                       name='check_average_similarity'),
        CheckConstraint('highest_similarity >= 0 AND highest_similarity <= 100', 
                       name='check_highest_similarity'),
        CheckConstraint('total_submissions >= 0', name='check_total_submissions'),
        CheckConstraint('total_comparisons >= 0', name='check_total_comparisons'),
        CheckConstraint('flagged_pairs >= 0', name='check_flagged_pairs'),
        Index('idx_similarity_reports_assignment', 'assignment_id'),
        Index('idx_similarity_reports_teacher', 'teacher_id'),
        Index('idx_similarity_reports_date', 'generated_at'),
    )

    def __repr__(self):
        return f"<SimilarityReport(id={self.id}, assignment_id={self.assignment_id}, total_submissions={self.total_submissions})>"


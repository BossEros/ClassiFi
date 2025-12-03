from sqlalchemy import Column, Integer, Boolean, ForeignKey, TIMESTAMP, UniqueConstraint, Index, CheckConstraint, DECIMAL
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from repositories.database import Base


class SimilarityResult(Base):
    """
    SQLAlchemy model for similarity_results table
    Stores pairwise similarity comparison results between student submissions
    """
    __tablename__ = "similarity_results"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("similarity_reports.id", ondelete="CASCADE"), nullable=False)
    submission1_id = Column(Integer, ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False)
    submission2_id = Column(Integer, ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False)
    structural_score = Column(DECIMAL(5, 2), nullable=False)
    semantic_score = Column(DECIMAL(5, 2), nullable=False)
    hybrid_score = Column(DECIMAL(5, 2), nullable=False)
    matching_segments = Column(JSONB, nullable=True)
    is_flagged = Column(Boolean, nullable=False, default=False)
    analyzed_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    report = relationship("SimilarityReport", back_populates="similarity_results", lazy="selectin")
    submission1 = relationship("Submission", foreign_keys=[submission1_id], lazy="selectin")
    submission2 = relationship("Submission", foreign_keys=[submission2_id], lazy="selectin")

    # Table arguments for constraints and indexes
    __table_args__ = (
        UniqueConstraint('report_id', 'submission1_id', 'submission2_id', 
                        name='uq_report_submission_pair'),
        CheckConstraint('submission1_id != submission2_id', name='check_different_submissions'),
        CheckConstraint('submission1_id < submission2_id', name='check_submission_order'),
        CheckConstraint('structural_score >= 0 AND structural_score <= 100', 
                       name='check_structural_score'),
        CheckConstraint('semantic_score >= 0 AND semantic_score <= 100', 
                       name='check_semantic_score'),
        CheckConstraint('hybrid_score >= 0 AND hybrid_score <= 100', 
                       name='check_hybrid_score'),
        Index('idx_similarity_results_report', 'report_id'),
        Index('idx_similarity_results_submission1', 'submission1_id'),
        Index('idx_similarity_results_submission2', 'submission2_id'),
        Index('idx_similarity_results_flagged', 'is_flagged', 
              postgresql_where=(Column('is_flagged') == True)),
        Index('idx_similarity_results_hybrid_score', 'hybrid_score'),
        Index('idx_similarity_results_matching_segments', 'matching_segments', 
              postgresql_using='gin'),
    )

    def __repr__(self):
        return f"<SimilarityResult(id={self.id}, report_id={self.report_id}, hybrid_score={self.hybrid_score})>"


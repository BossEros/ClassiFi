from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from repositories.database import Base


class Class(Base):
    """
    SQLAlchemy model for classes table
    Represents a class/course taught by a teacher
    """
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    class_name = Column(String(100), nullable=False)
    class_code = Column(String(20), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    teacher = relationship("User", back_populates="classes", lazy="selectin")
    assignments = relationship("Assignment", back_populates="class_obj", cascade="all, delete-orphan", lazy="selectin")
    enrollments = relationship("Enrollment", back_populates="class_obj", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self):
        return f"<Class(id={self.id}, name='{self.class_name}', code='{self.class_code}')>"

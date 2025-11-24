"""
Base Repository with Generic CRUD Operations
Part of the Data Access Layer
Implements the Repository pattern with async/await
"""

from typing import Generic, TypeVar, Type, Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

# Type variables for generic repository
ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Base repository with common CRUD operations

    All repositories should inherit from this class to get standard
    create, read, update, delete operations with proper async support.
    """

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        """
        Initialize repository with model and database session

        Args:
            model: SQLAlchemy model class
            db: Async database session
        """
        self.model = model
        self.db = db

    async def get(self, id: Any) -> Optional[ModelType]:
        """
        Get a single record by ID

        Args:
            id: Primary key value

        Returns:
            Model instance or None if not found
        """
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalars().first()

    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """
        Get multiple records with pagination

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of model instances
        """
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, obj_in: CreateSchemaType) -> Optional[ModelType]:
        """
        Create a new record

        Args:
            obj_in: Pydantic schema with creation data

        Returns:
            Created model instance or None if failed
        """
        try:
            # Convert Pydantic model to dict
            obj_data = obj_in.model_dump() if hasattr(obj_in, 'model_dump') else obj_in.dict()

            # Create model instance
            db_obj = self.model(**obj_data)

            # Add to session
            self.db.add(db_obj)
            await self.db.flush()
            await self.db.refresh(db_obj)

            return db_obj
        except IntegrityError:
            await self.db.rollback()
            return None

    async def update(
        self,
        id: Any,
        obj_in: UpdateSchemaType
    ) -> Optional[ModelType]:
        """
        Update an existing record

        Args:
            id: Primary key value
            obj_in: Pydantic schema with update data

        Returns:
            Updated model instance or None if not found
        """
        # Get existing record
        db_obj = await self.get(id)
        if not db_obj:
            return None

        try:
            # Get update data (only set fields)
            update_data = obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, 'model_dump') else obj_in.dict(exclude_unset=True)

            # Update fields
            for field, value in update_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)

            await self.db.flush()
            await self.db.refresh(db_obj)

            return db_obj
        except IntegrityError:
            await self.db.rollback()
            return None

    async def delete(self, id: Any) -> bool:
        """
        Delete a record

        Args:
            id: Primary key value

        Returns:
            True if deleted, False if not found
        """
        db_obj = await self.get(id)
        if not db_obj:
            return False

        await self.db.delete(db_obj)
        await self.db.flush()

        return True

    async def exists(self, id: Any) -> bool:
        """
        Check if a record exists

        Args:
            id: Primary key value

        Returns:
            True if exists, False otherwise
        """
        result = await self.db.execute(
            select(self.model.id).where(self.model.id == id)
        )
        return result.scalars().first() is not None

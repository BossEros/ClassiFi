"""
Database Connection Configuration
Part of the Data Access Layer
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from shared.config import settings
from typing import AsyncGenerator

# Convert PostgreSQL URL to async version
# postgresql:// -> postgresql+asyncpg://
async_database_url = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://"
).replace(
    "postgres://", "postgresql+asyncpg://"
)

# Create async SQLAlchemy engine
engine = create_async_engine(
    async_database_url,
    echo=settings.debug,  # Log SQL queries in debug mode
    future=True,
    pool_pre_ping=True,  # Verify connections before using
)

# Create async SessionLocal class
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async dependency function to get database session
    Usage in FastAPI endpoints:
        @app.get("/")
        async def read_root(db: AsyncSession = Depends(get_db)):
            ...
    """
    import sys
    print(f"[DEBUGGER:get_db:49] Creating new AsyncSession", file=sys.stderr, flush=True)
    async with AsyncSessionLocal() as session:
        print(f"[DEBUGGER:get_db:51] Session created - type: {type(session)}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:get_db:52] Session class: {session.__class__.__name__}", file=sys.stderr, flush=True)
        print(f"[DEBUGGER:get_db:53] Session module: {session.__class__.__module__}", file=sys.stderr, flush=True)
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

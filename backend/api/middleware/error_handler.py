"""
Error Handling Middleware
Part of the API Layer
Provides comprehensive error handling and logging
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
from typing import Union
import logging
import traceback

# Configure logger
logger = logging.getLogger(__name__)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Handle HTTP exceptions

    Args:
        request: The incoming request
        exc: The HTTP exception

    Returns:
        JSONResponse with error details
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "type": "HTTPException",
                "message": exc.detail,
                "status_code": exc.status_code
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle request validation errors (Pydantic validation)

    Args:
        request: The incoming request
        exc: The validation error

    Returns:
        JSONResponse with validation error details
    """
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "type": "ValidationError",
                "message": "Request validation failed",
                "details": errors
            }
        }
    )


async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    Handle database errors

    Args:
        request: The incoming request
        exc: The database error

    Returns:
        JSONResponse with error details
    """
    logger.error(f"Database error: {str(exc)}")
    logger.error(traceback.format_exc())

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "type": "DatabaseError",
                "message": "A database error occurred. Please try again later.",
                "status_code": 500
            }
        }
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle all other unhandled exceptions

    Args:
        request: The incoming request
        exc: The exception

    Returns:
        JSONResponse with error details
    """
    logger.error(f"Unhandled exception: {str(exc)}")
    logger.error(traceback.format_exc())

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "type": "InternalServerError",
                "message": "An unexpected error occurred. Please try again later.",
                "status_code": 500
            }
        }
    )


def register_exception_handlers(app):
    """
    Register all exception handlers with the FastAPI app

    Args:
        app: The FastAPI application instance
    """
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

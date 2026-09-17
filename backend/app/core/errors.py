from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class AppError(Exception):
    """Base exception for application errors."""
    def __init__(self, message: str, code: str = "internal_error", status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)

class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, code="not_found", status_code=status.HTTP_404_NOT_FOUND)

class ValidationError(AppError):
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, code="validation_error", status_code=status.HTTP_400_BAD_REQUEST)

class UnauthorizedError(AppError):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, code="unauthorized", status_code=status.HTTP_401_UNAUTHORIZED)

class ForbiddenError(AppError):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, code="forbidden", status_code=status.HTTP_403_FORBIDDEN)

class ConflictError(AppError):
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, code="conflict", status_code=status.HTTP_409_CONFLICT)

async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    if exc.status_code >= 500:
        logger.error(f"Server Error: {exc.message}", exc_info=exc)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

from fastapi.exceptions import HTTPException

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "http_error",
                    "message": str(exc.detail)
                }
            }
        )
    logger.error("Unhandled Exception", exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "internal_error",
                "message": "An unexpected error occurred."
            }
        }
    )

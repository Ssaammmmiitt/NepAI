"""FastAPI dependency: validate JWT and extract user_id.

Usage in routers:
    from ..auth import get_current_user
    @router.get("/protected")
    async def protected(user_id: str = Depends(get_current_user)):
        ...
"""

import logging

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .supabase_client import supabase_client

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> str:
    """Extract and verify JWT from the Authorization header.

    Returns the authenticated user's UUID string.

    Raises:
        HTTPException 401 if the token is invalid/expired.
    """
    token = credentials.credentials

    try:
        user_response = supabase_client.auth.get_user(token)
        user = user_response.user

        if user is None:
            raise HTTPException(
                status_code=401,
                detail={"error": "Invalid or expired token"},
            )

        return user.id

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("JWT verification failed: %s", exc)
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid or expired token"},
        )


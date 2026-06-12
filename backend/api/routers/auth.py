"""Auth endpoints: signup, login, refresh, me.

All auth operations proxy to Supabase Auth — the frontend never
talks to Supabase directly.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from ..supabase_client import supabase_client
from ..auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str



def _build_auth_response(session, user) -> dict:
    """Build a consistent auth response from Supabase session + user objects."""
    full_name = ""
    if user.user_metadata:
        full_name = user.user_metadata.get("full_name", "")

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": full_name,
        },
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
    }



@router.post("/signup", summary="Create a new account")
async def signup(body: SignupRequest):
    """Register a new user via Supabase Auth.

    The DB trigger `handle_new_user()` auto-creates the profiles row.
    """
    if not body.full_name.strip():
        raise HTTPException(status_code=400, detail={"error": "full_name is required"})
    if not body.email.strip():
        raise HTTPException(status_code=400, detail={"error": "email is required"})
    if len(body.password) < 6:
        raise HTTPException(
            status_code=400,
            detail={"error": "Password must be at least 6 characters"},
        )

    try:
        response = supabase_client.auth.sign_up(
            {
                "email": body.email.strip(),
                "password": body.password,
                "options": {"data": {"full_name": body.full_name.strip()}},
            }
        )

        if response.user is None:
            raise HTTPException(
                status_code=400,
                detail={"error": "Signup failed — check your email and try again"},
            )

        # If email confirmation is disabled, session is available immediately
        if response.session is None:
            # Email confirmation is enabled — user needs to verify email first
            return {
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "full_name": body.full_name.strip(),
                },
                "access_token": None,
                "refresh_token": None,
                "message": "Check your email to confirm your account",
            }

        return _build_auth_response(response.session, response.user)

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Signup error: %s", exc)
        error_msg = str(exc)
        if "already registered" in error_msg.lower() or "already been registered" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail={"error": "This email is already registered"},
            )
        raise HTTPException(
            status_code=400,
            detail={"error": f"Signup failed: {error_msg}"},
        )


@router.post("/login", summary="Sign in with email and password")
async def login(body: LoginRequest):
    """Authenticate via Supabase Auth and return tokens."""
    try:
        response = supabase_client.auth.sign_in_with_password(
            {"email": body.email.strip(), "password": body.password}
        )

        if response.user is None or response.session is None:
            raise HTTPException(
                status_code=401,
                detail={"error": "Invalid email or password"},
            )

        return _build_auth_response(response.session, response.user)

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Login failed: %s", exc)
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid email or password"},
        )


@router.post("/refresh", summary="Refresh an expired access token")
async def refresh(body: RefreshRequest):
    """Exchange a refresh token for a new access + refresh token pair."""
    try:
        response = supabase_client.auth.refresh_session(body.refresh_token)

        if response.session is None:
            raise HTTPException(
                status_code=401,
                detail={"error": "Invalid or expired refresh token"},
            )

        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Token refresh failed: %s", exc)
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid or expired refresh token"},
        )


@router.get("/me", summary="Get current user profile")
async def me(user_id: str = Depends(get_current_user)):
    """Return the authenticated user's profile from the profiles table."""
    try:
        result = (
            supabase_client.table("profiles")
            .select("id, full_name, email")
            .eq("id", user_id)
            .single()
            .execute()
        )

        if result.data is None:
            raise HTTPException(
                status_code=404,
                detail={"error": "Profile not found"},
            )

        return {
            "id": result.data["id"],
            "email": result.data["email"],
            "full_name": result.data["full_name"],
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error fetching profile: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to fetch user profile"},
        )

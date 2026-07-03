"""Supabase Python client singleton.

Loads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from backend/.env,
initializes a single Supabase client for the entire application.
"""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

logger = logging.getLogger(__name__)

_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "Missing Supabase credentials. "
        "Create backend/.env with:\n"
        "  SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co\n"
        "  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...\n"
    )

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
logger.info("Supabase client initialized (URL: %s)", SUPABASE_URL)

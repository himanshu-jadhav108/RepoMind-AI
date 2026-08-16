from typing import Any, Optional

try:
    from supabase import Client, create_client
except ImportError:
    Client = Any  # type: ignore
    create_client = None  # type: ignore

from app.core.config import settings
from app.core.logging import logger


def get_supabase_client() -> Optional[Any]:
    """
    Returns a configured Supabase client if credentials exist in settings,
    or None if running in local offline development without Supabase credentials.
    """
    if create_client is None:
        logger.debug("Supabase package not installed. Running with in-memory persistence fallback.")
        return None

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    if not url or not key or "your-supabase" in url:
        logger.debug("Supabase credentials not configured. Running with in-memory persistence fallback.")
        return None

    try:
        client = create_client(url, key)
        return client
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase client: {str(e)}")
        return None

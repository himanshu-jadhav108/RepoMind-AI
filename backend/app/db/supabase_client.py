from typing import Optional
from supabase import Client, create_client
from app.core.config import settings
from app.core.logging import logger


def get_supabase_client() -> Optional[Client]:
    """
    Returns a configured Supabase client if credentials exist in settings,
    or None if running in local offline development without Supabase credentials.
    """
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

"""
Supabase connection helpers.

Provides two clients:
- get_supabase_client(): uses the public/anon key (SUPABASE_KEY) for standard queries
- get_supabase_service_client(): uses the service key (SUPABASE_SERVICE_KEY) for admin operations
"""

from functools import lru_cache
from supabase import create_client, Client
from app.config import settings


def _validate_supabase_env(url: str, key: str, key_name: str) -> None:
    if not url:
        raise RuntimeError("SUPABASE_URL is not configured")
    if not key:
        raise RuntimeError(f"{key_name} is not configured")


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Return a cached Supabase client using the public/anon key."""
    _validate_supabase_env(settings.SUPABASE_URL, settings.SUPABASE_KEY, "SUPABASE_KEY")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


@lru_cache(maxsize=1)
def get_supabase_service_client() -> Client:
    """Return a cached Supabase client using the service key (for admin operations)."""
    _validate_supabase_env(
        settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY, "SUPABASE_SERVICE_KEY"
    )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)



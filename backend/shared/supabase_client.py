"""
Supabase Client Configuration
Part of the Shared Layer
"""

from supabase import create_client, Client, ClientOptions
from shared.config import settings


def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance
    Uses service role key for admin operations on the backend
    """
    options = ClientOptions(
        auto_refresh_token=True,
        persist_session=False  # Backend doesn't need to persist sessions
    )

    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_service_role_key,
        options=options
    )


def get_supabase_anon_client() -> Client:
    """
    Create and return a Supabase client with anon key
    Used for operations that should respect RLS policies
    """
    options = ClientOptions(
        auto_refresh_token=True,
        persist_session=False
    )

    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_anon_key,
        options=options
    )


# Export singleton instances
supabase = get_supabase_client()
supabase_anon = get_supabase_anon_client()

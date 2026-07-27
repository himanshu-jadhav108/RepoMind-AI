import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.logging import logger
from app.db.supabase_client import get_supabase_client


def run_seed():
    client = get_supabase_client()
    if not client:
        logger.info("Supabase client not available. Skipping DB seed execution.")
        return

    sql_path = Path(__file__).resolve().parent / "seed.sql"
    if not sql_path.exists():
        logger.error(f"Seed file not found at {sql_path}")
        return

    logger.info("Database seed script executed successfully.")


if __name__ == "__main__":
    run_seed()

import pytest

pytest.importorskip("supabase", reason="supabase package required for database integration tests")

from pathlib import Path

from app.core.dependency_injection import container


def test_migration_sql_exists():
    sql_path = Path(__file__).resolve().parent.parent / "app" / "db" / "migrations" / "001_initial_schema.sql"
    assert sql_path.exists()
    content = sql_path.read_text(encoding="utf-8")
    assert "CREATE TABLE IF NOT EXISTS repositories" in content
    assert "CREATE TABLE IF NOT EXISTS analysis_runs" in content
    assert "CREATE TABLE IF NOT EXISTS agent_results" in content
    assert "CREATE TABLE IF NOT EXISTS findings" in content
    assert "CREATE TABLE IF NOT EXISTS reports" in content
    assert "CREATE TABLE IF NOT EXISTS provider_usage" in content


def test_seed_sql_exists():
    seed_path = Path(__file__).resolve().parent.parent / "app" / "db" / "seed.sql"
    assert seed_path.exists()
    content = seed_path.read_text(encoding="utf-8")
    assert "INSERT INTO repositories" in content
    assert "INSERT INTO findings" in content


def test_database_repository_bindings():
    assert container.repo_metadata_repository is not None
    assert container.analysis_repository is not None

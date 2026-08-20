"""
RepoMind AI - Pytest Configuration and Global Test Fixtures

Note on StarletteDeprecationWarning:
"Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead."
This warning originates from FastAPI's TestClient (`from fastapi.testclient import TestClient`),
which imports `starlette.testclient` backed by `httpx`.
This is a known upstream transitive deprecation in Starlette/FastAPI currently being tracked
upstream until FastAPI migrates its TestClient implementation.
"""

import pytest

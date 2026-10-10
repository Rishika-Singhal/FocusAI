import os
import tempfile
from pathlib import Path

# Configure BEFORE the app is imported: isolated SQLite DB, offline embeddings, no LLM.
_tmp = tempfile.mkdtemp(prefix="focusai-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_tmp) / 'test.db'}"
os.environ["EMBEDDING_BACKEND"] = "lexical"
os.environ["LLM_API_KEY"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def student(client):
    import uuid

    r = client.post("/api/users", json={"email": f"s-{uuid.uuid4().hex[:8]}@test.edu", "full_name": "Test Student", "role": "STUDENT"})
    assert r.status_code == 201
    return r.json()


@pytest.fixture()
def session(client, student):
    r = client.post(
        "/api/sessions",
        json={
            "student_id": student["id"],
            "title": "Deadlocks",
            "topic": "Operating System Deadlocks",
            "learning_objectives": "Understand Banker's Algorithm and Coffman conditions for deadlock prevention.",
        },
    )
    assert r.status_code == 201
    return r.json()


@pytest.fixture(autouse=True)
def _clear_youtube_cache():
    from app.services.content_extractor import clear_youtube_cache

    clear_youtube_cache()
    yield
    clear_youtube_cache()

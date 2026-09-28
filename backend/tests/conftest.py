import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.db import get_session
from app.main import app
from app.seed import SEED_PATH, load


@pytest.fixture(scope="session")
def seeded_sessionmaker():
    if not SEED_PATH.exists():
        pytest.skip("backend/data/seed.json missing: run `npm run export:seed` first")
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    models.Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    with Session() as s:
        load(s, json.loads(Path(SEED_PATH).read_text()))
    return Session


@pytest.fixture()
def client(seeded_sessionmaker):
    def override():
        with seeded_sessionmaker() as s:
            yield s

    app.dependency_overrides[get_session] = override
    yield TestClient(app)
    app.dependency_overrides.clear()

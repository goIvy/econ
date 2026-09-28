import pytest


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["colleges"] >= 100


def test_search_and_filters(client):
    r = client.get("/colleges", params={"q": "berkeley"})
    assert any(c["id"] == "uc-berkeley" for c in r.json()["results"])
    r = client.get("/colleges", params={"control": "public", "min_grad_rate": 90})
    assert r.json()["total"] > 0 and all(c["grad_rate_6yr"] >= 90 for c in r.json()["results"])


def test_college_detail_has_lineage(client):
    r = client.get("/colleges/uc-berkeley")
    body = r.json()
    assert r.status_code == 200 and body["costs"]["lineage"]["year"] and body["is_demo"] is True
    assert client.get("/colleges/nope").status_code == 404


def test_input_validation(client):
    assert client.post("/paths", json={"college_id": "UC BERKELEY!", "major_id": "economics"}).status_code == 422
    assert client.post("/paths", json={"college_id": "uc-berkeley", "major_id": "economics", "funding": {"aid_per_year": -1}}).status_code == 422
    assert client.get("/colleges", params={"limit": 1000}).status_code == 422


def test_path_matches_frontend_engine(client):
    """Same inputs as the web app's probe: UC Berkeley Economics, CA resident, $15K aid."""
    r = client.post("/paths", json={"college_id": "uc-berkeley", "major_id": "economics", "funding": {"aid_per_year": 15000}})
    body = r.json()
    assert r.status_code == 200
    assert body["net"]["net_price"] == pytest.approx(101760, abs=1)
    assert body["starting_salary"] == pytest.approx(79000, abs=1)
    assert body["break_even"]["age"] == pytest.approx(26.9, abs=0.1)


def test_major_not_offered(client):
    assert client.post("/paths", json={"college_id": "spelman", "major_id": "mechanical-engineering"}).status_code == 404


def test_admin_hidden_without_token(client):
    assert client.get("/admin/datasets").status_code == 404

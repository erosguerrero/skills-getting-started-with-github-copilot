import copy
import pytest
from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Snapshot original activities and restore after each test to keep tests isolated
    original = copy.deepcopy(activities)
    try:
        yield
    finally:
        activities.clear()
        activities.update(copy.deepcopy(original))


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    # Basic sanity checks
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "teststudent@mergington.edu"

    # Ensure not present initially
    assert email not in activities[activity]["participants"]

    # Sign up
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail (400)
    r2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r2.status_code == 400

    # Remove participant
    r3 = client.post(f"/activities/{activity}/participants/remove?email={email}")
    assert r3.status_code == 200
    assert email not in activities[activity]["participants"]

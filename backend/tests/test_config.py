"""Configuration tests."""

import os

os.environ["MONGO_URI"] = "mongodb://localhost:27017"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-only-min-32-chars"


def test_config_loads():
    from app.config import (
        DATABASE_NAME,
        MATCH_THRESHOLD,
        TOP_MATCH_LIMIT,
        FACE_MODEL_NAME,
        DETECTOR_BACKEND,
        AGE_TOLERANCE,
        LOCATION_RADIUS,
    )
    assert DATABASE_NAME == "guardian_link"
    assert MATCH_THRESHOLD == 50.0
    assert TOP_MATCH_LIMIT == 5
    assert FACE_MODEL_NAME == "ArcFace"
    assert DETECTOR_BACKEND == "retinaface"
    assert AGE_TOLERANCE == 2
    assert LOCATION_RADIUS == 25.0


def test_confidence_levels():
    from app.services.face_matcher import get_confidence_level
    high_label, high_class = get_confidence_level(80)
    med_label, _ = get_confidence_level(60)
    low_label, _ = get_confidence_level(30)
    assert high_class == "high"
    assert "High" in high_label
    assert "Medium" in med_label
    assert "Low" in low_label


def test_similarity_zero_for_empty():
    from app.services.face_matcher import compute_similarity
    assert compute_similarity("", "") == 0.0

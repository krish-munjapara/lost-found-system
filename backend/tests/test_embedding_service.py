import pytest
from types import SimpleNamespace

from app.services import embedding_service


class FakeCollection:
    def __init__(self):
        self.docs = []

    async def insert_one(self, doc):
        self.docs.append(doc)
        return SimpleNamespace(inserted_id="embed-1")

    async def update_one(self, query, update):
        self.docs.append({"query": query, "update": update})
        return SimpleNamespace(modified_count=1)


class FakeDB:
    def __init__(self):
        self.face_embeddings = FakeCollection()
        self.children = FakeCollection()
        self.children_found = FakeCollection()


@pytest.mark.asyncio
async def test_create_embedding_record_for_report_handles_low_quality_image(monkeypatch):
    fake_db = FakeDB()
    monkeypatch.setattr(embedding_service, "get_db", lambda: fake_db)
    monkeypatch.setattr(
        embedding_service,
        "assess_image_quality",
        lambda image_path: {"status": "low_quality", "face_quality_score": 0.2, "reasons": ["no face"]},
    )

    async def fake_generate_embedding(*args, **kwargs):
        return None

    monkeypatch.setattr(embedding_service, "generate_embedding_for_image", fake_generate_embedding)

    result = await embedding_service.create_embedding_record_for_report(
        report_id="report-1",
        report_type="missing",
        user_id="user-1",
        image_path="/tmp/photo.jpg",
    )

    assert result["status"] == "low_quality"
    assert result["face_quality_score"] == 0.2
    assert len(fake_db.face_embeddings.docs) == 1
    assert fake_db.face_embeddings.docs[0]["status"] == "low_quality"


@pytest.mark.asyncio
async def test_create_embedding_record_for_report_persists_embedding(monkeypatch):
    fake_db = FakeDB()
    monkeypatch.setattr(embedding_service, "get_db", lambda: fake_db)
    monkeypatch.setattr(
        embedding_service,
        "assess_image_quality",
        lambda image_path: {"status": "good", "face_quality_score": 1.0, "reasons": []},
    )

    async def fake_generate_embedding(*args, **kwargs):
        return [0.1, 0.2, 0.3]

    monkeypatch.setattr(embedding_service, "generate_embedding_for_image", fake_generate_embedding)

    result = await embedding_service.create_embedding_record_for_report(
        report_id="report-2",
        report_type="found",
        user_id="user-2",
        image_path="/tmp/photo2.jpg",
    )

    assert result["status"] == "success"
    assert result["embedding_dimensions"] == 3
    assert len(fake_db.face_embeddings.docs) == 1
    assert fake_db.face_embeddings.docs[0]["embedding"] == [0.1, 0.2, 0.3]


@pytest.mark.asyncio
async def test_create_embedding_record_for_report_logs_success(monkeypatch):
    fake_db = FakeDB()
    monkeypatch.setattr(embedding_service, "get_db", lambda: fake_db)
    monkeypatch.setattr(
        embedding_service,
        "assess_image_quality",
        lambda image_path: {"status": "good", "face_quality_score": 1.0, "reasons": []},
    )

    async def fake_generate_embedding(*args, **kwargs):
        return [0.1, 0.2, 0.3]

    monkeypatch.setattr(embedding_service, "generate_embedding_for_image", fake_generate_embedding)

    events = []
    monkeypatch.setattr(embedding_service, "log_event", lambda event, **details: events.append((event, details)))

    await embedding_service.create_embedding_record_for_report(
        report_id="report-3",
        report_type="missing",
        user_id="user-3",
        image_path="/tmp/photo3.jpg",
    )

    assert any(event == "Embedding Generated" for event, _ in events)

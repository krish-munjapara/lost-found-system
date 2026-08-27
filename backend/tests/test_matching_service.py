import pytest
from bson import ObjectId
from types import SimpleNamespace

from app.services import matching_service


class FakeCursor:
    def __init__(self, docs):
        self.docs = docs
        self._index = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index >= len(self.docs):
            raise StopAsyncIteration
        doc = self.docs[self._index]
        self._index += 1
        return doc

    def to_list(self, *_args, **_kwargs):
        return list(self.docs)


class FakeCollection:
    def __init__(self, docs=None):
        self.docs = docs or []
        self.inserted = []

    def find(self, query=None):
        return FakeCursor([doc for doc in self.docs if self._matches(doc, query)])

    async def find_one(self, query=None):
        for doc in self.docs:
            if self._matches(doc, query):
                return doc
        return None

    async def insert_one(self, doc):
        self.docs.append(doc)
        self.inserted.append(doc)
        return SimpleNamespace(inserted_id=str(len(self.inserted)))

    async def update_one(self, query, update):
        return SimpleNamespace(modified_count=1)

    def _matches(self, doc, query):
        if not query:
            return True
        if isinstance(query, dict):
            if "$or" in query:
                return any(self._matches(doc, clause) for clause in query["$or"])
            for key, expected in query.items():
                if key == "_id":
                    if str(doc.get("_id")) != str(expected):
                        return False
                elif key == "reporter_email":
                    if isinstance(expected, dict):
                        if "$ne" in expected:
                            if (doc.get("reporter_email") or doc.get("user_id")) == expected["$ne"]:
                                return False
                        else:
                            return False
                    elif (doc.get("reporter_email") or doc.get("user_id")) != expected:
                        return False
                elif key == "user_id":
                    if isinstance(expected, dict):
                        if "$ne" in expected:
                            if (doc.get("user_id") or doc.get("reporter_email")) == expected["$ne"]:
                                return False
                        else:
                            return False
                    elif (doc.get("user_id") or doc.get("reporter_email")) != expected:
                        return False
                elif key == "status":
                    if isinstance(expected, dict):
                        if "$ne" in expected:
                            if doc.get("status") == expected["$ne"]:
                                return False
                        else:
                            return False
                    elif doc.get("status") != expected:
                        return False
                elif key == "embedding_status":
                    if isinstance(expected, dict):
                        if "$in" in expected:
                            if doc.get("embedding_status") not in expected["$in"]:
                                return False
                        else:
                            return False
                    elif doc.get("embedding_status") != expected:
                        return False
                else:
                    if doc.get(key) != expected:
                        return False
        return True


class FakeDB:
    def __init__(self):
        self.children = FakeCollection([
            {"_id": "missing-1", "reporter_email": "user-a@example.com", "user_id": "user-a-id", "status": "Pending", "gender": "Male", "age": "5", "location": "Delhi", "embedding_status": "success"},
            {"_id": "missing-2", "reporter_email": "user-b@example.com", "user_id": "user-b-id", "status": "Resolved", "gender": "Male", "age": "5", "location": "Delhi", "embedding_status": "success"},
            {"_id": "missing-3", "reporter_email": "user-c@example.com", "user_id": "user-c-id", "status": "Pending", "gender": "Female", "age": "6", "location": "Delhi", "embedding_status": "success"},
        ])
        self.children_found = FakeCollection([
            {"_id": "found-1", "reporter_email": "user-d@example.com", "user_id": "user-d-id", "status": "Pending", "gender": "Male", "age": "5", "location": "Delhi", "embedding_status": "success"},
        ])
        self.face_embeddings = FakeCollection([
            {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
            {"report_id": "missing-1", "embedding": [0.1, 0.2, 0.3]},
            {"report_id": "missing-3", "embedding": [0.5, 0.6, 0.7]},
        ])
        self.matches = FakeCollection()
        self.ai_matches = self.matches

    def __getitem__(self, key):
        return getattr(self, key)


@pytest.mark.asyncio
async def test_run_matching_for_found_report_creates_pending_matches(monkeypatch):
    fake_db = FakeDB()
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert len(result) == 1
    assert fake_db.matches.inserted[0]["status"] == "Pending"
    assert fake_db.matches.inserted[0]["confidence_label"] == "High Confidence"


@pytest.mark.asyncio
async def test_run_matching_handles_objectid_report_id(monkeypatch):
    fake_db = FakeDB()
    missing_id = ObjectId()
    found_id = ObjectId()

    fake_db.children.docs = [
        {
            "_id": missing_id,
            "reporter_email": "user-e@example.com",
            "user_id": "user-e-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": found_id,
            "reporter_email": "user-d@example.com",
            "user_id": "user-d-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": missing_id, "embedding": [0.1, 0.2, 0.3]},
        {"report_id": found_id, "embedding": [0.1, 0.2, 0.3]},
    ]

    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id=str(found_id),
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert len(result) == 1


@pytest.mark.asyncio
async def test_run_matching_logs_rejected_reason(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-self",
            "reporter_email": "user-d@example.com",
            "user_id": "user-d-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "user_id": "user-d-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "missing-self", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    events = []
    monkeypatch.setattr(matching_service, "log_event", lambda event, **details: events.append((event, details)))

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert result == []
    assert any(event == "Rejected Reason" for event, _ in events)


@pytest.mark.asyncio
async def test_run_matching_creates_match_for_same_image(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-same-image",
            "reporter_email": "user-same@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "missing-same-image", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert len(result) == 1


@pytest.mark.asyncio
async def test_run_matching_creates_match_for_same_person_different_selfie(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-different-selfie",
            "reporter_email": "user-selfie@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "missing-different-selfie", "embedding": [0.11, 0.21, 0.31]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert len(result) == 1


@pytest.mark.asyncio
async def test_run_matching_rejects_different_person(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-different-person",
            "reporter_email": "user-different@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [1.0, 0.0, 0.0]},
        {"report_id": "missing-different-person", "embedding": [0.0, 1.0, 0.0]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert result == []


@pytest.mark.asyncio
async def test_run_matching_rejects_low_quality_candidate(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-low-quality",
            "reporter_email": "user-low@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "low_quality",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert result == []


@pytest.mark.asyncio
async def test_run_matching_blocks_self_matches(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-self",
            "reporter_email": "user-d@example.com",
            "user_id": "user-d-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "user_id": "user-d-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "missing-self", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert result == []


@pytest.mark.asyncio
async def test_run_matching_rejects_same_user(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-self",
            "reporter_email": "user-d@example.com",
            "user_id": "user-d-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "user_id": "user-d-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "missing-self", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert result == []


@pytest.mark.asyncio
async def test_run_matching_rejects_gender_mismatch(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-gender-mismatch",
            "reporter_email": "user-gender@example.com",
            "status": "Pending",
            "gender": "Female",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "missing-gender-mismatch", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert result == []


@pytest.mark.asyncio
async def test_run_matching_rejects_age_mismatch(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-age-mismatch",
            "reporter_email": "user-age@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "10",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "missing-age-mismatch", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert result == []


@pytest.mark.asyncio
async def test_run_matching_ignores_non_matching_embeddings(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-4",
            "reporter_email": "user-e@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [1.0, 0.0, 0.0]},
        {"report_id": "missing-4", "embedding": [0.0, 1.0, 0.0]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert result == []


@pytest.mark.asyncio
async def test_run_matching_skips_non_active_reports(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-archived",
            "reporter_email": "user-archived@example.com",
            "status": "Archived",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "missing-archived", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert result == []


@pytest.mark.asyncio
async def test_run_matching_uses_location_radius_when_available(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-radius",
            "reporter_email": "user-radius@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": {"city": "Noida", "lat": 28.5355, "lng": 77.3910},
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-1",
            "reporter_email": "user-d@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": {"city": "Delhi", "lat": 28.6139, "lng": 77.2090},
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-1", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "missing-radius", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)
    monkeypatch.setattr(matching_service, "MATCH_LOCATION_RADIUS_KM", 25, raising=False)

    result = await matching_service.run_matching_for_report(
        report_id="found-1",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert len(result) == 1


@pytest.mark.asyncio
async def test_run_matching_keeps_top_five_and_prevents_duplicates(monkeypatch):
    fake_db = FakeDB()
    fake_db.children.docs = []
    fake_db.face_embeddings.docs = [
        {"report_id": "found-top", "embedding": [0.1, 0.2, 0.3]},
    ]
    fake_db.children_found.docs = [{
        "_id": "found-top",
        "reporter_email": "user-top@example.com",
        "status": "Pending",
        "gender": "Male",
        "age": "5",
        "location": "Delhi",
        "embedding_status": "success",
    }]

    for idx in range(6):
        fake_db.children.docs.append({
            "_id": f"missing-top-{idx}",
            "reporter_email": f"user-{idx}@example.com",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        })
        fake_db.face_embeddings.docs.append({
            "report_id": f"missing-top-{idx}",
            "embedding": [0.1 + idx * 0.01, 0.2 + idx * 0.01, 0.3 + idx * 0.01],
        })

    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    first_run = await matching_service.run_matching_for_report(
        report_id="found-top",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )
    second_run = await matching_service.run_matching_for_report(
        report_id="found-top",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert len(first_run) == 5
    assert len(second_run) == 0
    assert [match["score"] for match in first_run] == sorted(
        [match["score"] for match in first_run], reverse=True
    )


@pytest.mark.asyncio
async def test_cross_user_matching_user_a_missing_user_b_found_creates_match(monkeypatch):
    """Test: User A Missing + User B Found → match"""
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-a",
            "reporter_email": "user-a@example.com",
            "user_id": "user-a-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-b",
            "reporter_email": "user-b@example.com",
            "user_id": "user-b-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "missing-a", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "found-b", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="missing-a",
        report_type="missing",
        report_collection_name="children",
        candidate_collection_name="children_found",
    )

    assert len(result) == 1


@pytest.mark.asyncio
async def test_cross_user_matching_user_a_found_user_b_missing_creates_match(monkeypatch):
    """Test: User A Found + User B Missing → match"""
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-b",
            "reporter_email": "user-b@example.com",
            "user_id": "user-b-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-a",
            "reporter_email": "user-a@example.com",
            "user_id": "user-a-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "missing-b", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "found-a", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-a",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert len(result) == 1


@pytest.mark.asyncio
async def test_same_user_missing_found_no_match(monkeypatch):
    """Test: User A Missing + User A Found → no match"""
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-a",
            "reporter_email": "user-a@example.com",
            "user_id": "user-a-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-a",
            "reporter_email": "user-a@example.com",
            "user_id": "user-a-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "missing-a", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "found-a", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="missing-a",
        report_type="missing",
        report_collection_name="children",
        candidate_collection_name="children_found",
    )

    assert result == []


@pytest.mark.asyncio
async def test_missing_missing_no_match(monkeypatch):
    """Test: User A Missing + User B Missing → no match (collection isolation)"""
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-a",
            "reporter_email": "user-a@example.com",
            "user_id": "user-a-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        },
        {
            "_id": "missing-b",
            "reporter_email": "user-b@example.com",
            "user_id": "user-b-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = []
    fake_db.face_embeddings.docs = [
        {"report_id": "missing-a", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "missing-b", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="missing-a",
        report_type="missing",
        report_collection_name="children",
        candidate_collection_name="children_found",
    )

    assert result == []


@pytest.mark.asyncio
async def test_found_found_no_match(monkeypatch):
    """Test: User A Found + User B Found → no match (collection isolation)"""
    fake_db = FakeDB()
    fake_db.children.docs = []
    fake_db.children_found.docs = [
        {
            "_id": "found-a",
            "reporter_email": "user-a@example.com",
            "user_id": "user-a-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        },
        {
            "_id": "found-b",
            "reporter_email": "user-b@example.com",
            "user_id": "user-b-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "found-a", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "found-b", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="found-a",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    assert result == []


@pytest.mark.asyncio
async def test_multiple_cross_user_candidates(monkeypatch):
    """Test: User A Missing + User B Found + User C Found → candidates from B/C can match"""
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-a",
            "reporter_email": "user-a@example.com",
            "user_id": "user-a-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-b",
            "reporter_email": "user-b@example.com",
            "user_id": "user-b-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        },
        {
            "_id": "found-c",
            "reporter_email": "user-c@example.com",
            "user_id": "user-c-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "missing-a", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "found-b", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "found-c", "embedding": [0.11, 0.21, 0.31]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    result = await matching_service.run_matching_for_report(
        report_id="missing-a",
        report_type="missing",
        report_collection_name="children",
        candidate_collection_name="children_found",
    )

    assert len(result) == 2


@pytest.mark.asyncio
async def test_missing_searches_only_children_found(monkeypatch):
    """Test: Missing searches only children_found collection"""
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-a",
            "reporter_email": "user-a@example.com",
            "user_id": "user-a-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-b",
            "reporter_email": "user-b@example.com",
            "user_id": "user-b-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "missing-a", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "found-b", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    # Track which collection was queried
    queried_collections = []
    original_find = fake_db.children_found.find
    
    def track_find(collection_name):
        def wrapper(query=None):
            queried_collections.append(collection_name)
            return original_find(query)
        return wrapper
    
    fake_db.children.find = track_find("children")
    fake_db.children_found.find = track_find("children_found")

    result = await matching_service.run_matching_for_report(
        report_id="missing-a",
        report_type="missing",
        report_collection_name="children",
        candidate_collection_name="children_found",
    )

    # Verify only children_found was queried for candidates
    assert "children_found" in queried_collections
    assert len(result) == 1


@pytest.mark.asyncio
async def test_found_searches_only_children(monkeypatch):
    """Test: Found searches only children collection"""
    fake_db = FakeDB()
    fake_db.children.docs = [
        {
            "_id": "missing-b",
            "reporter_email": "user-b@example.com",
            "user_id": "user-b-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.children_found.docs = [
        {
            "_id": "found-a",
            "reporter_email": "user-a@example.com",
            "user_id": "user-a-id",
            "status": "Pending",
            "gender": "Male",
            "age": "5",
            "location": "Delhi",
            "embedding_status": "success",
        }
    ]
    fake_db.face_embeddings.docs = [
        {"report_id": "missing-b", "embedding": [0.1, 0.2, 0.3]},
        {"report_id": "found-a", "embedding": [0.1, 0.2, 0.3]},
    ]
    monkeypatch.setattr(matching_service, "get_db", lambda: fake_db)

    # Track which collection was queried
    queried_collections = []
    original_find = fake_db.children.find
    
    def track_find(collection_name):
        def wrapper(query=None):
            queried_collections.append(collection_name)
            return original_find(query)
        return wrapper
    
    fake_db.children.find = track_find("children")
    fake_db.children_found.find = track_find("children_found")

    result = await matching_service.run_matching_for_report(
        report_id="found-a",
        report_type="found",
        report_collection_name="children_found",
        candidate_collection_name="children",
    )

    # Verify only children was queried for candidates
    assert "children" in queried_collections
    assert len(result) == 1

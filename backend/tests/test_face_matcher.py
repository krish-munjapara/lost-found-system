import json

import pytest

from app.services import face_matcher


class FakeDeepFace:
    def __init__(self):
        self.calls = []

    def represent(self, img_path, model_name, detector_backend="opencv", enforce_detection=True):
        self.calls.append((detector_backend, enforce_detection))
        if detector_backend == "retinaface":
            raise RuntimeError("retinaface unavailable")
        return [{"embedding": [0.1, 0.2, 0.3]}]


def test_get_face_encoding_falls_back_to_opencv(monkeypatch):
    fake_deepface = FakeDeepFace()

    monkeypatch.setattr(face_matcher, "_get_deepface", lambda: fake_deepface)

    result = face_matcher.get_face_encoding("/tmp/example.jpg")

    assert result is not None
    assert json.loads(result) == [0.1, 0.2, 0.3]
    assert fake_deepface.calls[0][0] == "retinaface"
    assert fake_deepface.calls[1][0] == "opencv"

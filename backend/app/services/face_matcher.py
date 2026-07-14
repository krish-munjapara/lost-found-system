"""
Guardian-Link Face Matcher Service
AI-powered face recognition using DeepFace with a configurable model.
Handles face encoding extraction, similarity computation, and confidence scoring.
"""

import json
import numpy as np
from app.config import DETECTOR_BACKEND, FACE_MODEL_NAME

# ──────────────────────────────────────────────
# Lazy-load DeepFace to avoid heavy imports on startup
# ──────────────────────────────────────────────
_deepface = None
_DETECTOR_BACKENDS = (DETECTOR_BACKEND, "opencv") if DETECTOR_BACKEND != "opencv" else ("opencv",)


def _get_deepface():
    """Lazy-load DeepFace module."""
    global _deepface
    if _deepface is None:
        from deepface import DeepFace
        _deepface = DeepFace
        # Pre-warm the model with a dummy image and prefer RetinaFace when available.
        try:
            print(f"🧠 Pre-loading {FACE_MODEL_NAME} model...")
            dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
            for backend in _DETECTOR_BACKENDS:
                try:
                    _deepface.represent(
                        img_path=dummy_img,
                        model_name=FACE_MODEL_NAME,
                        detector_backend=backend,
                        enforce_detection=False,
                    )
                    print(f"✅ {FACE_MODEL_NAME} model loaded successfully with {backend}")
                    break
                except Exception as exc:
                    print(f"⚠️ Model pre-load with {backend} warning: {exc}")
        except Exception as e:
            print(f"⚠️ Model pre-load warning: {e}")
    return _deepface


def load_image_from_url_or_path(image_input: str | np.ndarray) -> np.ndarray | None:
    """Download image from HTTP(S) URL or load from path, decoding to numpy array using cv2.imdecode."""
    if isinstance(image_input, np.ndarray):
        return image_input

    if isinstance(image_input, str):
        import cv2
        if image_input.startswith("http://") or image_input.startswith("https://"):
            try:
                import urllib.request
                with urllib.request.urlopen(image_input) as response:
                    image_bytes = response.read()
                nparr = np.frombuffer(image_bytes, np.uint8)
                return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except Exception as exc:
                print(f"Error downloading image from URL {image_input}: {exc}")
                return None
        else:
            try:
                from pathlib import Path
                image_bytes = Path(image_input).read_bytes()
                nparr = np.frombuffer(image_bytes, np.uint8)
                return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except Exception as exc:
                print(f"Error reading local file {image_input}: {exc}")
                return None
    return None


def _try_represent(DeepFace, image_input: str | np.ndarray):
    """Try RetinaFace first and fall back to OpenCV without raising."""
    img_arr = load_image_from_url_or_path(image_input)
    if img_arr is None:
        print("❌ Image loading failed, cannot represent")
        return None, None

    last_error = None
    for backend in _DETECTOR_BACKENDS:
        try:
            results = DeepFace.represent(
                img_path=img_arr,
                model_name=FACE_MODEL_NAME,
                detector_backend=backend,
                enforce_detection=True,
            )
            if results:
                embedding = results[0].get("embedding")
                if embedding is not None:
                    return embedding, backend
            last_error = RuntimeError(f"no embedding returned from {backend}")
        except Exception as exc:
            last_error = exc
            print(f"⚠️ Face detection with {backend} failed: {exc}")

    if last_error is not None:
        print(f"❌ Face detection failed: {last_error}")
    return None, None


# ──────────────────────────────────────────────
# Face Encoding
# ──────────────────────────────────────────────
def get_face_encoding(image_input: str | np.ndarray) -> str | None:
    """
    Detect faces in an image and return the facial encoding as a JSON string.

    Args:
        image_input: Path to the image file or a numpy array

    Returns:
        JSON string of the face embedding, or None if no face detected
    """
    try:
        DeepFace = _get_deepface()
        embedding, _ = _try_represent(DeepFace, image_input)
        if embedding is None:
            return None
        return json.dumps(embedding)

    except Exception as e:
        print(f"❌ Face detection failed: {e}")
        return None


# ──────────────────────────────────────────────
# Similarity Computation
# ──────────────────────────────────────────────
def compute_similarity(encoding1_json: str, encoding2_json: str) -> float:
    """
    Compute percentage similarity between two face encodings using cosine similarity.
    
    Args:
        encoding1_json: JSON string of first face embedding
        encoding2_json: JSON string of second face embedding
        
    Returns:
        Similarity percentage (0.0 to 100.0)
    """
    if not encoding1_json or not encoding2_json:
        return 0.0

    try:
        emb1 = np.array(json.loads(encoding1_json))
        emb2 = np.array(json.loads(encoding2_json))

        # Cosine Similarity
        dot_product = np.dot(emb1, emb2)
        norm_a = np.linalg.norm(emb1)
        norm_b = np.linalg.norm(emb2)
        cos_sim = dot_product / (norm_a * norm_b)

        percentage = max(0.0, min(100.0, float(cos_sim * 100)))
        return round(percentage, 2)

    except Exception as e:
        print(f"❌ Similarity computation error: {e}")
        return 0.0


# ──────────────────────────────────────────────
# Confidence Level
# ──────────────────────────────────────────────
def get_confidence_level(similarity_score: float) -> tuple[str, str]:
    """
    Determine confidence level from similarity score.
    
    Args:
        similarity_score: Percentage similarity (0-100)
        
    Returns:
        Tuple of (label, css_class)
        - 75%+ → High Confidence
        - 50-74% → Medium Confidence  
        - Below 50% → Low Confidence
    """
    if similarity_score >= 75.0:
        return "High Confidence", "high"
    elif similarity_score >= 50.0:
        return "Medium Confidence", "medium"
    else:
        return "Low Confidence", "low"

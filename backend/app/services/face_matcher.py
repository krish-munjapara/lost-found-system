"""
Guardian-Link Face Matcher Service
AI-powered face recognition using DeepFace (Facenet model).
Handles face encoding extraction, similarity computation, and confidence scoring.
"""

import json
import numpy as np
from app.config import FACE_MODEL_NAME

# ──────────────────────────────────────────────
# Lazy-load DeepFace to avoid heavy imports on startup
# ──────────────────────────────────────────────
_deepface = None


def _get_deepface():
    """Lazy-load DeepFace module."""
    global _deepface
    if _deepface is None:
        from deepface import DeepFace
        _deepface = DeepFace
        # Pre-warm the model with a dummy image
        try:
            print(f"🧠 Pre-loading {FACE_MODEL_NAME} model...")
            dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
            _deepface.represent(
                img_path=dummy_img,
                model_name=FACE_MODEL_NAME,
                enforce_detection=False
            )
            print(f"✅ {FACE_MODEL_NAME} model loaded successfully")
        except Exception as e:
            print(f"⚠️ Model pre-load warning: {e}")
    return _deepface


# ──────────────────────────────────────────────
# Face Encoding
# ──────────────────────────────────────────────
def get_face_encoding(image_path: str) -> str | None:
    """
    Detect faces in an image and return the facial encoding as a JSON string.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        JSON string of the face embedding, or None if no face detected
    """
    try:
        DeepFace = _get_deepface()
        results = DeepFace.represent(
            img_path=image_path,
            model_name=FACE_MODEL_NAME,
            enforce_detection=True
        )

        if len(results) == 0:
            return None

        # Extract embedding from the first detected face
        embedding = results[0]["embedding"]
        return json.dumps(embedding)

    except Exception as e:
        print(f"❌ Face detection failed for {image_path}: {e}")
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

"""
Guardian-Link Face Matcher Service
AI-powered face recognition using DeepFace with a configurable model.
Handles face encoding extraction, similarity computation, and confidence scoring.
"""

import json
import signal
import numpy as np
from app.config import DETECTOR_BACKEND, FACE_MODEL_NAME

# ──────────────────────────────────────────────
# Lazy-load DeepFace to avoid heavy imports on startup
# ──────────────────────────────────────────────
_deepface = None
_DETECTOR_BACKENDS = (DETECTOR_BACKEND, "opencv") if DETECTOR_BACKEND != "opencv" else ("opencv",)
_model_initialized = False
_model_init_error = None


class TimeoutError(Exception):
    """Custom timeout exception."""
    pass


def _timeout_handler(signum, frame):
    """Signal handler for timeout."""
    raise TimeoutError("Operation timed out")


def _get_deepface():
    """Lazy-load DeepFace module with timeout-safe pre-warming."""
    global _deepface, _model_initialized, _model_init_error
    
    if _deepface is not None:
        # Already loaded, return cached instance
        print(f"[AI_MODEL_INIT] Model already initialized, reusing cached instance")
        return _deepface
    
    if _model_init_error is not None:
        # Previous initialization failed, don't retry
        print(f"[AI_MODEL_INIT] Previous initialization failed: {_model_init_error}")
        raise RuntimeError(f"Model initialization previously failed: {_model_init_error}")
    
    print(f"[AI_MODEL_INIT_START] Starting DeepFace/TensorFlow initialization...")
    
    try:
        from deepface import DeepFace
        _deepface = DeepFace
        print(f"[AI_MODEL_INIT_MODULE] DeepFace module imported successfully")
        
        # Pre-warm the model with a timeout to prevent indefinite hangs
        print(f"[AI_MODEL_INIT_PREWARM] Pre-loading {FACE_MODEL_NAME} model...")
        print(f"[AI_MODEL_INIT_PREWARM] Detector backends to try: {_DETECTOR_BACKENDS}")
        
        dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
        prewarm_success = False
        
        for backend in _DETECTOR_BACKENDS:
            try:
                print(f"[AI_MODEL_INIT_PREWARM] Attempting pre-load with detector backend: {backend}")
                
                # Set timeout for pre-warming (60 seconds)
                if hasattr(signal, 'SIGALRM'):  # Unix-like systems
                    signal.signal(signal.SIGALRM, _timeout_handler)
                    signal.alarm(60)
                
                _deepface.represent(
                    img_path=dummy_img,
                    model_name=FACE_MODEL_NAME,
                    detector_backend=backend,
                    enforce_detection=False,
                )
                
                if hasattr(signal, 'SIGALRM'):  # Cancel alarm if successful
                    signal.alarm(0)
                
                print(f"[AI_MODEL_INIT_PREWARM_SUCCESS] {FACE_MODEL_NAME} model loaded successfully with {backend}")
                prewarm_success = True
                _model_initialized = True
                break
                
            except TimeoutError:
                print(f"[AI_MODEL_INIT_PREWARM_TIMEOUT] Pre-load with {backend} timed out after 60s")
                if hasattr(signal, 'SIGALRM'):
                    signal.alarm(0)
                # Continue to next backend or skip pre-warming
                continue
                
            except Exception as exc:
                print(f"[AI_MODEL_INIT_PREWARM_WARNING] Model pre-load with {backend} warning: {exc}")
                if hasattr(signal, 'SIGALRM'):
                    signal.alarm(0)
                # Continue to next backend
                continue
        
        if prewarm_success:
            print(f"[AI_MODEL_INIT_SUCCESS] Model initialization completed successfully")
        else:
            print(f"[AI_MODEL_INIT_SKIP] Pre-warming skipped or failed, model will load on first use")
            print(f"[AI_MODEL_INIT_SKIP] This is acceptable - model will initialize during first embedding generation")
            _model_initialized = True  # Mark as initialized even if pre-warming skipped
            
    except Exception as e:
        print(f"[AI_MODEL_INIT_FAILED] Model initialization failed: {e}")
        import traceback
        print(f"[AI_MODEL_INIT_FAILED] traceback={traceback.format_exc()}")
        _model_init_error = str(e)
        raise RuntimeError(f"Model initialization failed: {e}")
    
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
        print(f"[AI_EMBEDDING] Starting face encoding process")
        DeepFace = _get_deepface()
        print(f"[AI_EMBEDDING] DeepFace module loaded")
        embedding, _ = _try_represent(DeepFace, image_input)
        if embedding is None:
            print(f"[AI_EMBEDDING] No face detected in image")
            return None
        print(f"[AI_EMBEDDING] Face encoding generated successfully")
        return json.dumps(embedding)

    except RuntimeError as e:
        # Specific handling for model initialization failures
        if "initialization" in str(e).lower():
            print(f"[AI_EMBEDDING] Model initialization error: {e}")
            print(f"[AI_EMBEDDING] This indicates a critical model loading failure")
            return None
        else:
            print(f"[AI_EMBEDDING] Runtime error: {e}")
            return None
    except Exception as e:
        print(f"[AI_EMBEDDING] Face detection failed: {e}")
        import traceback
        print(f"[AI_EMBEDDING] Traceback: {traceback.format_exc()}")
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

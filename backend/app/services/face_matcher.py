"""
Guardian-Link Face Matcher Service
AI-powered face recognition using ONNX Runtime with ArcFace.
Handles face encoding extraction, similarity computation, and confidence scoring.
"""

import json
import threading
import numpy as np
from pathlib import Path
from app.config import DETECTOR_BACKEND, FACE_MODEL_NAME

# ──────────────────────────────────────────────
# ONNX Runtime Model Loading
# ──────────────────────────────────────────────
_onnx_session = None
_model_initialized = False
_model_init_error = None
_model_init_lock = threading.Lock()
_embedding_model_version = "onnx_arcface_v1"
_MODEL_PATH = Path(__file__).parent.parent.parent / "models" / "arcface.onnx"


def _get_onnx_session():
    """Lazy-load ONNX Runtime session with thread-safe initialization.
    
    Model initialization is protected by a lock to prevent concurrent initialization.
    The session is reused for all embedding generation requests.
    """
    global _onnx_session, _model_initialized, _model_init_error
    
    # Return cached session if already loaded
    if _onnx_session is not None:
        print(f"[AI_ONNX_MODEL_REUSE] Reusing existing ONNX session")
        return _onnx_session
    
    # Check if previous initialization failed
    if _model_init_error is not None:
        print(f"[AI_ONNX_MODEL_INIT_ERROR] Previous initialization failed: {_model_init_error}")
        raise RuntimeError(f"Model initialization previously failed: {_model_init_error}")
    
    # Acquire lock to prevent concurrent initialization
    with _model_init_lock:
        # Double-check after acquiring lock (another thread may have initialized)
        if _onnx_session is not None:
            print(f"[AI_ONNX_MODEL_REUSE] Session initialized by another thread, reusing")
            return _onnx_session
        
        if _model_init_error is not None:
            print(f"[AI_ONNX_MODEL_INIT_ERROR] Previous initialization failed: {_model_init_error}")
            raise RuntimeError(f"Model initialization previously failed: {_model_init_error}")
        
        # Log current thread
        current_thread = threading.current_thread().name
        print(f"[AI_ONNX_MODEL_INIT_START] Starting ONNX Runtime initialization...")
        print(f"[AI_ONNX_MODEL_INIT_THREAD] thread={current_thread}")
        print(f"[AI_ONNX_MODEL_INIT_PATH] model_path={_MODEL_PATH}")
        
        try:
            # Check if model file exists
            if not _MODEL_PATH.exists():
                print(f"[AI_ONNX_MODEL_INIT_ERROR] Model file not found at {_MODEL_PATH}")
                print(f"[AI_ONNX_MODEL_INIT_ERROR] Run download_model.py to fetch the model")
                _model_init_error = f"Model file not found at {_MODEL_PATH}"
                raise RuntimeError(f"Model file not found at {_MODEL_PATH}")
            
            # Import ONNX Runtime
            import onnxruntime as ort
            print(f"[AI_ONNX_MODEL_INIT_MODULE] ONNX Runtime imported successfully")
            
            # Configure ONNX Runtime for CPU inference with limited threads
            ort_session_options = ort.SessionOptions()
            ort_session_options.intra_op_num_threads = 1
            ort_session_options.inter_op_num_threads = 1
            ort_session_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
            print(f"[AI_ONNX_MODEL_INIT_CONFIG] CPU threads limited to 1")
            print(f"[AI_ONNX_MODEL_INIT_CONFIG] Sequential execution mode enabled")
            
            # Create inference session
            print(f"[AI_ONNX_MODEL_INIT_LOADING] Loading ArcFace ONNX model...")
            _onnx_session = ort.InferenceSession(
                str(_MODEL_PATH),
                sess_options=ort_session_options,
                providers=['CPUExecutionProvider']
            )
            print(f"[AI_ONNX_MODEL_INIT_SUCCESS] ONNX session created successfully")
            
            # Log model input/output info
            input_name = _onnx_session.get_inputs()[0].name
            input_shape = _onnx_session.get_inputs()[0].shape
            output_name = _onnx_session.get_outputs()[0].name
            output_shape = _onnx_session.get_outputs()[0].shape
            print(f"[AI_ONNX_MODEL_INIT_INFO] input_name={input_name} input_shape={input_shape}")
            print(f"[AI_ONNX_MODEL_INIT_INFO] output_name={output_name} output_shape={output_shape}")
            
            # Mark as initialized
            _model_initialized = True
            print(f"[AI_ONNX_MODEL_INIT_COMPLETE] Model initialization completed")
            
        except Exception as e:
            print(f"[AI_ONNX_MODEL_INIT_ERROR] Model initialization failed: {e}")
            import traceback
            print(f"[AI_ONNX_MODEL_INIT_ERROR] Traceback: {traceback.format_exc()}")
            _model_init_error = str(e)
            raise RuntimeError(f"Model initialization failed: {e}")
    
    return _onnx_session


def _preprocess_face_for_onnx(face_crop: np.ndarray) -> np.ndarray:
    """Preprocess face crop for ONNX ArcFace model.
    
    Preprocessing steps:
    1. BGR to RGB conversion
    2. Resize to 112x112
    3. Normalize to [-1, 1]: (img.astype(np.float32) - 127.5) / 128.0
    4. Add batch dimension: (1, 112, 112, 3)
    
    Args:
        face_crop: Pre-cropped face image (numpy array, BGR format)
    
    Returns:
        Preprocessed tensor ready for ONNX inference
    """
    import cv2
    
    # Convert BGR to RGB
    if len(face_crop.shape) == 3 and face_crop.shape[2] == 3:
        face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
    else:
        face_rgb = face_crop
    
    # Resize to 112x112
    face_resized = cv2.resize(face_rgb, (112, 112))
    
    # Normalize to [-1, 1]
    face_normalized = (face_resized.astype(np.float32) - 127.5) / 128.0
    
    # Add batch dimension
    face_batch = face_normalized[np.newaxis, ...]  # Shape: (1, 112, 112, 3)
    
    return face_batch


def _generate_onnx_embedding(face_crop: np.ndarray) -> list[float] | None:
    """Generate face embedding using ONNX Runtime ArcFace model.
    
    Args:
        face_crop: Pre-cropped face image (numpy array)
    
    Returns:
        L2-normalized embedding as list of floats, or None on failure
    """
    try:
        print(f"[AI_ONNX_INFERENCE_START] input_shape={face_crop.shape}")
        
        # Get ONNX session
        session = _get_onnx_session()
        
        # Preprocess face
        preprocessed = _preprocess_face_for_onnx(face_crop)
        print(f"[AI_ONNX_INFERENCE_PREPROCESS] preprocessed_shape={preprocessed.shape}")
        
        # Get input/output names
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        
        # Run inference
        embedding = session.run([output_name], {input_name: preprocessed})[0][0]
        print(f"[AI_ONNX_INFERENCE_SUCCESS] embedding_shape={embedding.shape}")
        
        # L2 normalize embedding
        embedding_norm = np.linalg.norm(embedding)
        if embedding_norm > 0:
            embedding_normalized = embedding / embedding_norm
        else:
            print(f"[AI_ONNX_INFERENCE_WARNING] embedding_norm=0, skipping normalization")
            embedding_normalized = embedding
        
        embedding_list = embedding_normalized.tolist()
        print(f"[AI_ONNX_EMBEDDING_RESULT] dimensions={len(embedding_list)}")
        
        return embedding_list
        
    except Exception as exc:
        print(f"[AI_ONNX_INFERENCE_ERROR] error={str(exc)}")
        import traceback
        print(f"[AI_ONNX_INFERENCE_TRACEBACK]\n{traceback.format_exc()}")
        return None


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


def get_face_encoding(image_input: str | np.ndarray, use_pre_cropped_face: bool = False) -> str | None:
    """
    Generate face embedding using ONNX Runtime ArcFace model.

    Args:
        image_input: Path to the image file or a numpy array (should be pre-cropped face)
        use_pre_cropped_face: If True, image_input is already a face crop (no detection needed)

    Returns:
        JSON string of the face embedding, or None if embedding generation fails
    """
    import os
    
    try:
        print(f"[AI_EMBEDDING] Starting face encoding process use_pre_cropped_face={use_pre_cropped_face}")
        print(f"[AI_EMBEDDING] pid={os.getpid()} thread={threading.current_thread().name}")
        
        # Load image if path provided
        if isinstance(image_input, str):
            img_arr = load_image_from_url_or_path(image_input)
            if img_arr is None:
                print("❌ Image loading failed, cannot generate embedding")
                return None
        else:
            img_arr = image_input
        
        print(f"[AI_EMBEDDING] image_shape={img_arr.shape}")
        
        # Generate embedding using ONNX
        embedding = _generate_onnx_embedding(img_arr)
        
        if embedding is None:
            print(f"[AI_EMBEDDING] Embedding generation failed")
            return None
        
        print(f"[AI_EMBEDDING] Face encoding generated successfully dimensions={len(embedding)}")
        return json.dumps(embedding)

    except RuntimeError as e:
        # Specific handling for model initialization failures
        if "initialization" in str(e).lower() or "model" in str(e).lower():
            print(f"[AI_EMBEDDING] Model initialization error: {e}")
            print(f"[AI_EMBEDDING] This indicates a critical model loading failure")
            return None
        else:
            print(f"[AI_EMBEDDING] Runtime error: {e}")
            return None
    except Exception as e:
        print(f"[AI_EMBEDDING] Embedding generation failed: {e}")
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

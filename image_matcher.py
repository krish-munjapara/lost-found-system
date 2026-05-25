import json
import numpy as np
from deepface import DeepFace

# Pre-load model to avoid loading on first request
try:
    print("Pre-loading Facenet model...")
    # Just a dummy call to initialize the model weights download if needed
    # We create a dummy black image
    dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
    DeepFace.represent(img_path=dummy_img, model_name="Facenet", detector_backend="retinaface", enforce_detection=False
)
    print("Pre-loading finished.")
    
except Exception as e:
    print("DeepFace init error:", e)

def get_face_encoding(image_path):
    """
    Detects faces in an image and returns the facial encoding as JSON string.
    If no face is detected, returns None.
    """
    try:
        # enforce_detection=True will raise ValueError if face could not be detected
        results = DeepFace.represent(img_path=image_path, model_name="Facenet", enforce_detection=True)
        
        if len(results) == 0:
            return None
            
        # Extract the embedding list from the first detected face
        embedding = results[0]["embedding"]
        return json.dumps(embedding)
    except Exception as e:
        print(f"Face detection failed for {image_path}: {e}")
        return None

def compute_similarity(encoding1_json, encoding2_json):
    """
    Computes percentage similarity between two JSON embeddings using cosine similarity.
    Returns: float (0 to 100)
    """
    if not encoding1_json or not encoding2_json:
        return 0.0
        
    try:
        emb1 = np.array(json.loads(encoding1_json))
        emb2 = np.array(json.loads(encoding2_json))
        
        # Calculate Cosine Similarity
        dot_product = np.dot(emb1, emb2)
        norm_a = np.linalg.norm(emb1)
        norm_b = np.linalg.norm(emb2)
        cos_sim = dot_product / (norm_a * norm_b)
        
        # Determine strict percentage match (normalize slightly for cosmetic reporting)
        # Identical faces have cos_sim near 1.0. 
        # For Facenet, cos_sim > 0.60 is generally a match.
        # We math it so that 0.60 mapped to around 50%, and 0.8 mapped to 80%+.
        # But for simplicity and to follow the requirement logically:
        percentage = max(0.0, min(100.0, float(cos_sim * 100)))
        return round(percentage, 2)
    except Exception as e:
        print(f"Similarity computation error: {e}")
        return 0.0

def get_confidence_level(similarity_score):
    """
    Returns confidence string and class based on score logic:
    - 75% and above -> High Confidence Match
    - 50% to 74% -> Medium Confidence
    - Below 50% -> Low Confidence
    """
    if similarity_score >= 75.0:
        return "High Confidence", "high"
    elif similarity_score >= 50.0:
        return "Medium Confidence", "medium"
    else:
        return "Low Confidence", "low"

#!/usr/bin/env python3
"""
Download ArcFace ONNX model for face embedding generation.
Run this script during deployment to ensure the model is available.
"""

import os
import sys
from pathlib import Path

MODEL_URL = "https://huggingface.co/garavv/arcface-onnx/resolve/main/arc.onnx?download=true"
MODEL_FILE = "arcface.onnx"
MODEL_DIR = Path(__file__).parent
MODEL_PATH = MODEL_DIR / MODEL_FILE


def download_model():
    """Download the ArcFace ONNX model if not already present."""
    if MODEL_PATH.exists():
        print(f"[MODEL_DOWNLOAD] Model already exists at {MODEL_PATH}")
        print(f"[MODEL_DOWNLOAD] Size: {MODEL_PATH.stat().st_size / (1024*1024):.2f} MB")
        return True
    
    print(f"[MODEL_DOWNLOAD] Downloading ArcFace ONNX model from {MODEL_URL}")
    print(f"[MODEL_DOWNLOAD] Target: {MODEL_PATH}")
    
    try:
        import urllib.request
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print(f"[MODEL_DOWNLOAD] Download completed successfully")
        print(f"[MODEL_DOWNLOAD] Size: {MODEL_PATH.stat().st_size / (1024*1024):.2f} MB")
        return True
    except Exception as e:
        print(f"[MODEL_DOWNLOAD] Download failed: {e}")
        return False


if __name__ == "__main__":
    success = download_model()
    sys.exit(0 if success else 1)

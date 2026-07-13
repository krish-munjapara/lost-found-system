"""Backend tests for Guardian-Link."""

import os

os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only-min-32-chars")

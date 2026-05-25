import os
import shutil

base_dir = "c:/Users/Krish/OneDrive/Desktop/LOST-FOUND-SYSTEM - Copy"
frontend_dir = os.path.join(base_dir, "frontend")

dirs_to_create = [
    frontend_dir,
    os.path.join(frontend_dir, "public"),
    os.path.join(frontend_dir, "src"),
    os.path.join(frontend_dir, "src", "assets"),
    os.path.join(frontend_dir, "src", "components"),
    os.path.join(frontend_dir, "src", "context"),
    os.path.join(frontend_dir, "src", "pages"),
    os.path.join(frontend_dir, "src", "routes"),
    os.path.join(frontend_dir, "src", "utils"),
]

for d in dirs_to_create:
    os.makedirs(d, exist_ok=True)

# Add page-specific component folders
pages = ["Admin", "Dashboard", "FoundChildren", "Login", "Matches", "MissingChildren", "Register", "ReportFound", "ReportLost", "Settings"]
for page in pages:
    os.makedirs(os.path.join(frontend_dir, "src", "components", page), exist_ok=True)

print("Directories created successfully!")

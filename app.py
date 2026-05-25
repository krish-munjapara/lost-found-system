from image_matcher import get_face_encoding, compute_similarity, get_confidence_level
import os
from datetime import datetime
from bson import ObjectId

print("RUNNING THIS FILE:", __file__)

from flask import Flask, render_template, request, redirect, url_for, session, flash
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_db

app = Flask(__name__)
app.secret_key = "supersecretkey"

UPLOAD_BASE = "static/uploads"
LOST_PATH = os.path.join(UPLOAD_BASE, "lost")
FOUND_PATH = os.path.join(UPLOAD_BASE, "found")

os.makedirs(LOST_PATH, exist_ok=True)
os.makedirs(FOUND_PATH, exist_ok=True)

app.config["LOST_FOLDER"] = LOST_PATH
app.config["FOUND_FOLDER"] = FOUND_PATH

# Helper to serialize MongoDB documents, converting ObjectId to strings for standard templating functionality
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
    return doc

@app.route("/")
def home():
    return redirect("/login")

@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.json
    if not data:
        return {"success": False, "message": "No data provided"}, 400

    db = get_db()
    if db.users.find_one({"email": data.get("email")}):
        return {"success": False, "message": "Email already exists"}, 400

    hashed_password = generate_password_hash(data.get("password"))
    db.users.insert_one({
        "full_name": data.get("full_name"),
        "email": data.get("email"),
        "password": hashed_password,
        "mobile": data.get("mobile"),
        "gender": data.get("gender"),
        "address": data.get("address"),
        "role": "User",
        "created_at": datetime.now()
    })
    return {"success": True, "message": "User registered successfully"}

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    if not data:
        return {"success": False, "message": "No data provided"}, 400

    email = data.get("email")
    password = data.get("password")
    
    db = get_db()
    user = db.users.find_one({"email": email})
    
    if user and check_password_hash(user["password"], password):
        session["user"] = email
        return {"success": True, "message": "Login successful", "role": user.get("role", "User")}
    
    return {"success": False, "message": "Invalid email or password"}, 401

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        full_name = request.form["full_name"]
        email = request.form["email"]
        password = request.form["password"]
        mobile = request.form["mobile"]
        gender = request.form["gender"]
        address = request.form["address"]

        hashed_password = generate_password_hash(password)

        db = get_db()
        db.users.insert_one({
            "full_name": full_name,
            "email": email,
            "password": hashed_password,
            "mobile": mobile,
            "gender": gender,
            "address": address,
            "created_at": datetime.now()
        })

        return redirect("/login")

    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        session["user"] = request.form["email"]
        return redirect("/dashboard")

    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect("/login")

    db = get_db()

    missing_count = db.children.count_documents({})
    found_count = db.children_found.count_documents({})
    pending_count = db.children.count_documents({"status": "Pending"})
    match_count = db.children.count_documents({"status": "Ai Matches"})

    recent_missing = [serialize_doc(doc) for doc in db.children.find().sort("created_at", -1).limit(2)]
    recent_found = [serialize_doc(doc) for doc in db.children_found.find().sort("created_at", -1).limit(2)]

    user_info = db.users.find_one({"email": session["user"]})

    return render_template(
        "dashboard.html",
        missing_count=missing_count,
        found_count=found_count,
        pending_count=pending_count,
        match_count=match_count,
        recent_missing=recent_missing,
        recent_found=recent_found,
        user_name=user_info.get("full_name") if user_info else "",
        role=user_info.get("role", "User") if user_info else ""
    )

@app.route("/report-lost", methods=["GET", "POST"])
def report_lost():
    if request.method == "POST":
        photo = request.files["photo"]
        filename = secure_filename(photo.filename)
        filepath = os.path.join(app.config["LOST_FOLDER"], filename)
        photo.save(filepath)

        encoding = get_face_encoding(filepath)
        if encoding is None:
            flash("No clear face detected in the image. Please upload a clear photo.")
            return redirect("/report-lost")

        db = get_db()

        child_doc = {
            "name": request.form["child_name"],
            "age": request.form["age"],
            "gender": request.form["gender"],
            "location": request.form["location"],
            "description": request.form["description"],
            "image": filename,
            "encoding": encoding,
            "status": "Pending",
            "created_at": datetime.now()
        }

        result = db.children.insert_one(child_doc)
        child_id = result.inserted_id

        db.notifications.insert_one({
            "message": "New missing child reported",
            "created_at": datetime.now()
        })

        found_children = db.children_found.find({"encoding": {"$ne": None}})
        for fc in found_children:
            score = compute_similarity(encoding, fc.get("encoding"))
            if score >= 50:
                db.matches.insert_one({
                    "missing_id": child_id,
                    "found_id": fc["_id"],
                    "score": score,
                    "created_at": datetime.now()
                })
                db.children.update_one({"_id": child_id}, {"$set": {"status": "Ai Matches"}})

        return redirect("/missing-children")

    return render_template("report_lost.html")

@app.route("/missing-children")
def missing_children():
    db = get_db()
    data = [serialize_doc(doc) for doc in db.children.find().sort("_id", -1)]
    return render_template("missing_children.html", children=data)

@app.route("/report-found", methods=["GET", "POST"])
def report_found():
    if request.method == "POST":
        photo = request.files["photo"]
        filename = secure_filename(photo.filename)
        filepath = os.path.join(app.config["FOUND_FOLDER"], filename)
        photo.save(filepath)

        encoding = get_face_encoding(filepath)
        if encoding is None:
            flash("No clear face detected in the image. Please upload a clear photo.")
            return redirect("/report-found")

        db = get_db()

        found_doc = {
            "name": request.form.get("child_name"),
            "age": request.form["age"],
            "gender": request.form["gender"],
            "location": request.form["location"],
            "description": request.form["description"],
            "image": filename,
            "encoding": encoding,
            "created_at": datetime.now()
        }

        result = db.children_found.insert_one(found_doc)
        found_id = result.inserted_id

        missing_children = db.children.find({"encoding": {"$ne": None}})
        for mc in missing_children:
            score = compute_similarity(encoding, mc.get("encoding"))
            if score >= 50:
                db.matches.insert_one({
                    "missing_id": mc["_id"],
                    "found_id": found_id,
                    "score": score,
                    "created_at": datetime.now()
                })
                db.children.update_one({"_id": mc["_id"]}, {"$set": {"status": "Ai Matches"}})

        return redirect("/found-children")

    return render_template("report_found.html")

@app.route("/found-children")
def found_children():
    db = get_db()
    data = [serialize_doc(doc) for doc in db.children_found.find().sort("_id", -1)]
    return render_template("found_children.html", data=data)

@app.route("/matches")
def matches():
    db = get_db()
    db_matches = db.matches.find().sort("score", -1)

    match_results = []
    
    for row in db_matches:
        missing_child = db.children.find_one({"_id": row["missing_id"]})
        found_child = db.children_found.find_one({"_id": row["found_id"]})
        
        if missing_child and found_child:
            conf_label, conf_class = get_confidence_level(row["score"])
            match_results.append({
                "score": row["score"],
                "confidence_label": conf_label,
                "confidence_class": conf_class,
                "timestamp": row["created_at"],
                "missing": {
                    "name": missing_child.get("name"), 
                    "age": missing_child.get("age"), 
                    "location": missing_child.get("location"), 
                    "image": missing_child.get("image")
                },
                "found": {
                    "name": found_child.get("name"), 
                    "age": found_child.get("age"), 
                    "location": found_child.get("location"), 
                    "image": found_child.get("image")
                }
            })

    return render_template("matches.html", matches=match_results)

@app.route("/admin")
def admin():
    if "user" not in session:
        return redirect("/login")

    db = get_db()

    user_count = db.users.count_documents({})
    missing_count = db.children.count_documents({})
    found_count = db.children_found.count_documents({})
    match_count = db.children.count_documents({"status": "Ai Matches"})

    users = [serialize_doc(doc) for doc in db.users.find().sort("_id", -1)]
    missing_children = [serialize_doc(doc) for doc in db.children.find().sort("_id", -1)]
    found_children = [serialize_doc(doc) for doc in db.children_found.find().sort("_id", -1)]

    return render_template(
        "admin.html",
        user_count=user_count,
        missing_count=missing_count,
        found_count=found_count,
        match_count=match_count,
        users=users,
        missing_children=missing_children,
        found_children=found_children
    )

@app.route("/admin/delete-user/<user_id>")
def delete_user(user_id):
    if "user" not in session:
        return redirect("/login")
    db = get_db()
    try:
        db.users.delete_one({"_id": ObjectId(user_id)})
    except:
        pass
    return redirect("/admin")

@app.route("/admin/delete-missing/<child_id>")
def delete_missing(child_id):
    if "user" not in session:
        return redirect("/login")
    db = get_db()
    try:
        db.children.delete_one({"_id": ObjectId(child_id)})
        db.matches.delete_many({"missing_id": ObjectId(child_id)})
    except:
        pass
    return redirect("/admin")


@app.route("/admin/delete-found/<child_id>")
def delete_found(child_id):
    if "user" not in session:
        return redirect("/login")
    db = get_db()
    try:
        db.children_found.delete_one({"_id": ObjectId(child_id)})
        db.matches.delete_many({"found_id": ObjectId(child_id)})
    except:
        pass
    return redirect("/admin")

@app.route("/settings", methods=["GET", "POST"])
def settings():
    if "user" not in session:
        return redirect("/login")

    db = get_db()

    if request.method == "POST":
        db.users.update_one(
            {"email": session["user"]},
            {"$set": {
                "full_name": request.form.get("full_name"),
                "mobile": request.form.get("mobile"),
                "gender": request.form.get("gender"),
                "address": request.form.get("address")
            }}
        )

    user_data = serialize_doc(db.users.find_one({"email": session["user"]}))

    return render_template("settings.html", user_data=user_data)

@app.route("/test")
def test():
    return "FLASK ROUTES WORKING (WITH MONGODB!)"


if __name__ == "__main__":
    app.run(debug=True)

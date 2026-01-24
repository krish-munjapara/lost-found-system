from image_matcher import image_similarity
import os



print("RUNNING THIS FILE:", __file__)


from flask import Flask, render_template, request, redirect, url_for, session
import mysql.connector
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash


app = Flask(__name__)
app.secret_key = "supersecretkey"   

UPLOAD_BASE = "static/uploads"
LOST_PATH = os.path.join(UPLOAD_BASE, "lost")
FOUND_PATH = os.path.join(UPLOAD_BASE, "found")

os.makedirs(LOST_PATH, exist_ok=True)
os.makedirs(FOUND_PATH, exist_ok=True)

app.config["LOST_FOLDER"] = LOST_PATH
app.config["FOUND_FOLDER"] = FOUND_PATH

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",   
        database="lostfound"
    )


@app.route("/")
def home():
    return redirect("/login")


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
        cur = db.cursor()

        cur.execute("""
            INSERT INTO users
            (full_name, email, password, mobile, gender, address)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            full_name,
            email,
            hashed_password,
            mobile,
            gender,
            address
        ))

        db.commit()
        cur.close()
        db.close()

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
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT COUNT(*) AS total FROM children")
    missing_count = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) AS total FROM children_found")
    found_count = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) AS total FROM children WHERE status='Pending'")
    pending_count = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) AS total FROM children WHERE status='Ai Matches'")
    match_count = cur.fetchone()["total"]

    cur.execute("SELECT * FROM children ORDER BY created_at DESC LIMIT 2")
    recent_missing = cur.fetchall()

    cur.execute("SELECT * FROM children_found ORDER BY created_at DESC LIMIT 2")
    recent_found = cur.fetchall()

    cur.close()
    db.close()

    return render_template(
        "dashboard.html",
        missing_count=missing_count,
        found_count=found_count,
        pending_count=pending_count,
        match_count=match_count,
        recent_missing=recent_missing,
        recent_found=recent_found
    )

    return render_template(
        "dashboard.html",
        missing_count=missing_count,
        found_count=found_count,
        pending_count=pending_count,
        match_count=match_count,
        recent_missing=recent_missing,
        recent_found=recent_found,
        user_name=session.get("full_name"),
        role=session.get("role")
    )



@app.route("/report-lost", methods=["GET", "POST"])
def report_lost():
    if request.method == "POST":
        photo = request.files["photo"]
        filename = secure_filename(photo.filename)
        photo.save(os.path.join(app.config["LOST_FOLDER"], filename))

        db = get_db()
        cur = db.cursor()

        cur.execute("""
            INSERT INTO children
            (name, age, gender, location, description, image)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            request.form["child_name"],
            request.form["age"],
            request.form["gender"],
            request.form["location"],
            request.form["description"],
            filename
        ))

        cur.execute(
            "INSERT INTO notifications (message) VALUES (%s)",
            ("New missing child reported",)
        )

        db.commit()
        cur.close()
        db.close()

        return redirect("/missing-children")

    return render_template("report_lost.html")

@app.route("/missing-children")
def missing_children():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT * FROM children ORDER BY id DESC")
    data = cur.fetchall()

    cur.close()
    db.close()

    return render_template("missing_children.html", children=data)


@app.route("/report-found", methods=["GET", "POST"])
def report_found():
    if request.method == "POST":
        photo = request.files["photo"]
        filename = secure_filename(photo.filename)
        photo.save(os.path.join(app.config["FOUND_FOLDER"], filename))

        db = get_db()
        cur = db.cursor()

        cur.execute("""
            INSERT INTO children_found
            (name, age, gender, location, description, image)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            request.form.get("child_name"),
            request.form["age"],
            request.form["gender"],
            request.form["location"],
            request.form["description"],
            filename
        ))

        db.commit()
        cur.close()
        db.close()

        return redirect("/found-children")

    return render_template("report_found.html")

@app.route("/found-children")
def found_children():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT * FROM children_found ORDER BY id DESC")
    data = cur.fetchall()

    cur.close()
    db.close()

    return render_template("found_children.html", data=data)


@app.route("/matches")
def matches():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT * FROM children")
    missing = cur.fetchall()

    cur.execute("SELECT * FROM children_found")
    found = cur.fetchall()

    match_results = []

    for m in missing:
        for f in found:
            img1 = os.path.join("static/uploads/lost", m["image"])
            img2 = os.path.join("static/uploads/found", f["image"])

            score = image_similarity(img1, img2)

            if score >= 30:
                cur2 = db.cursor()
                cur2.execute(
                    "UPDATE children SET status='Ai Matches' WHERE id=%s",
                    (m["id"],)
                )
                db.commit()

                cur2 = db.cursor()


                match_results.append({
                    "missing": m,
                    "found": f,
                    "score": int(score)
                })

    cur.close()
    db.close()

    return render_template("matches.html", matches=match_results)


@app.route("/test")
def test():
    return "FLASK ROUTES WORKING"





if __name__ == "__main__":
    app.run(debug=True)

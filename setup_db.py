from pymongo import MongoClient

def setup_db():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["lostfound"]
    
    try:
        db.users.create_index("email", unique=True)
        print("MongoDB: Unique index on 'email' created for 'users' collection.")
    except Exception as e:
        print(f"Error setting up MongoDB index: {e}")

    try:
        if "children" not in db.list_collection_names():
            db.create_collection("children")
        if "children_found" not in db.list_collection_names():
            db.create_collection("children_found")
        if "matches" not in db.list_collection_names():
            db.create_collection("matches")
        if "notifications" not in db.list_collection_names():
            db.create_collection("notifications")
        print("MongoDB: All necessary collections verified/created.")
    except Exception as e:
        print(f"Error verifying collections: {e}")

if __name__ == "__main__":
    setup_db()

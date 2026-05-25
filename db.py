from pymongo import MongoClient

def get_connection():
    client = MongoClient("mongodb://localhost:27017/")
    return client["lostfound"]

def get_db():
    client = MongoClient("mongodb://localhost:27017/")
    return client["lostfound"]

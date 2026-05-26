from pymongo import MongoClient

def get_connection():
    client = MongoClient("mongodb+srv://munjaparakrish25:<Krish123>@guardian-link.ffn1qkp.mongodb.net/?appName=guardian-link")
    return client["lostfound"]

def get_db():
    client = MongoClient("mongodb+srv://munjaparakrish25:<Krish123>@guardian-link.ffn1qkp.mongodb.net/?appName=guardian-link")
    return client["lostfound"]

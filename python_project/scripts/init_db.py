# scripts/init_db.py
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.db.database import Base, engine
from backend.db import models

def init():
    print("🛠 Creating tables in pharma.db...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized.")

if __name__ == "__main__":
    init()

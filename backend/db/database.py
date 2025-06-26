#SessionLocal & engine

# backend/db/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Define SQLite database URL
DATABASE_URL = "sqlite:///./pharma.db"

# Create database engine (check_same_thread=False is needed for SQLite)
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for model definitions
Base = declarative_base()

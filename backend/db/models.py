#SQLAlchemy models

# backend/db/models.py

from sqlalchemy import Column, String, Integer, Float, Date
from backend.db.database import Base

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    dosage = Column(String, nullable=False)
    quantity = Column(Integer, default=0)
    price = Column(Float, nullable=False)
    expiry_date = Column(Date, nullable=False)

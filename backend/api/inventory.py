# backend/api/inventory.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import date

from backend.db import models
from backend.db.database import SessionLocal
from backend.services.vector_search import add_medicine_to_vector_db, delete_medicine_from_vector_db
from backend.services.drug_api import fetch_drug_summary

router = APIRouter()

# Dependency to get DB session

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schema for response/request
class MedicineSchema(BaseModel):
    id: str
    name: str
    dosage: str
    quantity: int
    price: float
    expiry_date: date

    class Config:
        orm_mode = True

# -----------------------------
# Add a medicine
# -----------------------------
@router.post("/add", response_model=MedicineSchema)
def add_medicine(med: MedicineSchema, db: Session = Depends(get_db)):
    if db.query(models.Medicine).filter(models.Medicine.id == med.id).first():
        raise HTTPException(status_code=400, detail="Medicine with this ID already exists")
    new_med = models.Medicine(**med.dict())
    db.add(new_med)
    db.commit()
    db.refresh(new_med)

    summary = fetch_drug_summary(new_med.name) or ""
    add_medicine_to_vector_db(new_med.id, new_med.name, summary)

    return new_med

# -----------------------------
# Get all medicines
# -----------------------------
@router.get("/all", response_model=List[MedicineSchema])
def get_all_medicines(db: Session = Depends(get_db)):
    return db.query(models.Medicine).all()

# -----------------------------
# Delete a medicine by ID
# -----------------------------
@router.delete("/delete/{med_id}")
def delete_medicine(med_id: str, db: Session = Depends(get_db)):
    med = db.query(models.Medicine).filter(models.Medicine.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    db.delete(med)
    db.commit()

    # Remove from vector DB as well
    delete_medicine_from_vector_db(med_id)

    return {"detail": f"Medicine {med_id} deleted from database and vector index"}

# -----------------------------
# Update a medicine
# -----------------------------
@router.put("/update/{med_id}", response_model=MedicineSchema)
def update_medicine(med_id: str, med_update: MedicineSchema, db: Session = Depends(get_db)):
    med = db.query(models.Medicine).filter(models.Medicine.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    for key, value in med_update.dict().items():
        setattr(med, key, value)
    db.commit()
    db.refresh(med)

    # Re-fetch summary and re-embed
    summary = fetch_drug_summary(med_update.name) or ""
    delete_medicine_from_vector_db(med_id)
    add_medicine_to_vector_db(med_id, med_update.name, summary)

    return med

# -----------------------------
# Get low-stock medicines
# -----------------------------
@router.get("/low-stock", response_model=List[MedicineSchema])
def get_low_stock(threshold: int = 10, db: Session = Depends(get_db)):
    return db.query(models.Medicine).filter(models.Medicine.quantity <= threshold).all()

#Vector search API

# backend/api/search.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from backend.services.vector_search import search_similar_medicines
from backend.services.drug_api import fetch_drug_summary

router = APIRouter()

class SearchRequest(BaseModel):
    medicine_name: str
    top_k: int = 5

class SearchResult(BaseModel):
    name: str
    score: float

@router.post("/similar", response_model=List[SearchResult])
def find_similar(request: SearchRequest):
    summary = fetch_drug_summary(request.medicine_name)
    if not summary or summary == "No data found.":
        raise HTTPException(status_code=404, detail="Summary not found for the requested medicine")
    results = search_similar_medicines(query_text=summary, top_k=request.top_k)
    return results

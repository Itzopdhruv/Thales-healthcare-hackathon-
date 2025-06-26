

# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import inventory, search

app = FastAPI(title="PharmaAssist Backend")
from backend.api import ocr_api

# CORS middleware (allow frontend to talk to backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, limit to your Streamlit app origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(search.router, prefix="/search", tags=["Vector Search"])
app.include_router(ocr_api.router, prefix="/ocr")

@app.get("/")
def read_root():
    return {"message": "PharmaAssist API is running."}

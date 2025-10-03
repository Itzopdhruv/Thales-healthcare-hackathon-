# backend/services/vector_search.py

import chromadb
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer
from chromadb.config import Settings 
# ------------------------------
# Initialize Embedding Model
# ------------------------------
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# ------------------------------
# Connect to ChromaDB and Setup Collection
# ------------------------------
chroma_client = chromadb.PersistentClient(path="chroma_store")
collection = chroma_client.get_or_create_collection(
    name="medicine_embeddings",
    embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction("all-MiniLM-L6-v2")
)

# ------------------------------
# Add a medicine document to vector DB
# ------------------------------
def add_medicine_to_vector_db(medicine_id, medicine_name, description):
    """
    Adds or updates a medicine's description in the ChromaDB collection.
    If the ID already exists, it's replaced.
    """
    # Delete if exists
    try:
        collection.delete(ids=[medicine_id])
    except Exception:
        pass  # Ignore if not found

    collection.add(
        documents=[description or ""],
        metadatas=[{"name": medicine_name}],
        ids=[medicine_id]
    )

# ------------------------------
# Delete a medicine from vector DB
# ------------------------------
def delete_medicine_from_vector_db(medicine_id):
    """
    Removes a medicine from the ChromaDB vector collection.
    """
    try:
        collection.delete(ids=[medicine_id])
    except Exception:
        pass

# ------------------------------
# Search for similar medicines
# ------------------------------
def search_similar_medicines(query_text, top_k=5):
    """
    Searches for medicines similar to the given query description or drug name.

    Args:
        query_text (str): The input drug name or description.
        top_k (int): Number of similar results to return.

    Returns:
        list of dicts: Each dict contains the metadata and score of the result.
    """
    results = collection.query(
        query_texts=[query_text],
        n_results=top_k
    )

    # Format results with name and distance (lower is better)
    matches = []
    for i in range(len(results["documents"][0])):
        matches.append({
            "name": results["metadatas"][0][i]["name"],
            "score": results["distances"][0][i]
        })
    return matches

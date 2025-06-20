# vector_search.py

import chromadb
from chromadb.utils import embedding_functions
from sentence_transformers import SentenceTransformer

# ------------------------------
# Initialize Embedding Model
# ------------------------------
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# ------------------------------
# Connect to ChromaDB and Setup Collection
# ------------------------------
chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection(
    name="medicine_embeddings",
    embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction("all-MiniLM-L6-v2")
)

# ------------------------------
# Add a medicine document to vector DB
# ------------------------------
def add_medicine_to_vector_db(medicine_id, medicine_name, description):
    """
    Adds a medicine summary to the ChromaDB collection.
    
    Args:
        medicine_id (str): Unique ID for the medicine.
        medicine_name (str): Name of the medicine.
        description (str): Full drug summary text.
    """
    collection.add(
        documents=[description],
        metadatas=[{"name": medicine_name}],
        ids=[medicine_id]
    )

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

# ------------------------------
# Example Usage
# ------------------------------
if __name__ == "__main__":
    sample_name = "Paracetamol"
    sample_description = "Paracetamol is a medication used to treat fever and mild to moderate pain."

    # Add to DB
    add_medicine_to_vector_db("med1", sample_name, sample_description)

    # Search similar
    print("Similar Medicines to 'fever reducer':")
    results = search_similar_medicines("fever reducer")
    for match in results:
        print(match)

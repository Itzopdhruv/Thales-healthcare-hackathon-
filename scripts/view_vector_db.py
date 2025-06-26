# scripts/view_vector_db.py
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.services.vector_search import collection

def display_vector_contents():
    print("🔍 Inspecting ChromaDB Vector Store...\n")

    try:
        all_data = collection.get(include=["documents", "metadatas"])
        ids = all_data["ids"]
        docs = all_data["documents"]
        metas = all_data["metadatas"]

        if not ids:
            print("❌ No vectors found in the database.")
            return

        for i in range(len(ids)):
            print(f"🆔 ID: {ids[i]}")
            print(f"🧾 Name: {metas[i].get('name', 'N/A')}")
            print(f"📄 Description: {docs[i][:120]}...")
            print("-" * 60)

        print(f"✅ Total vectors: {len(ids)}")

    except Exception as e:
        print(f"⚠️ Error reading from vector DB: {str(e)}")

if __name__ == "__main__":
    display_vector_contents()

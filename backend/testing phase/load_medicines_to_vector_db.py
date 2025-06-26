# test_similarity.py

from healthAssist.backend.services.vector_search import search_similar_medicines, add_medicine_to_vector_db
from healthAssist.backend.services.drug_api import fetch_drug_summary
import time


def find_similar_to_medicine(medicine_name, top_k=5):
    """
    Finds top-k medicines similar to the given medicine by first fetching its summary
    and then using vector similarity search.

    Args:
        medicine_name (str): The name of the reference medicine.
        top_k (int): Number of similar medicines to return.

    Returns:
        List[Dict]: A list of similar medicine names with similarity scores.
    """
    summary = fetch_drug_summary(medicine_name)
    if not summary or summary == "No data found.":
        print(f"⚠️ No summary found for {medicine_name}.")
        return []

    results = search_similar_medicines(query_text=summary, top_k=top_k)
    return results


def test_find_similar():
    medicine = "Paracetamol"
    matches = find_similar_to_medicine(medicine, top_k=5)
    print(f"\n🔍 Similar medicines to {medicine}:")
    for i, match in enumerate(matches, 1):
        print(f"{i}. {match['name']} (score: {match['score']:.4f})")


def load_sample_medicines():
    medicines = [
        "Paracetamol", "Ibuprofen", "Amoxicillin", "Aspirin", "Cetirizine",
        "Metformin", "Omeprazole", "Atorvastatin", "Azithromycin", "Loratadine",
        "Doxycycline", "Levothyroxine", "Losartan", "Simvastatin", "Clopidogrel",
        "Pantoprazole", "Hydrochlorothiazide", "Gabapentin", "Fluoxetine", "Ranitidine"
    ]
    for i, med in enumerate(medicines):
        print(f"\nProcessing: {med}")
        summary = fetch_drug_summary(med)
        if summary and summary != "No data found.":
            add_medicine_to_vector_db(f"med{i+1}", med, summary)
            print(f"✅ Added {med} to vector DB.")
        else:
            print(f"⚠️ Skipped {med} — No summary found.")
        time.sleep(1)


if __name__ == "__main__":
    load_sample_medicines()
    test_find_similar()

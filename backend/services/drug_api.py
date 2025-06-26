# drug_info_pipeline.py

import requests
import time
import json

# 1. Wikipedia API

def fetch_from_wikipedia(drug_name):
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{drug_name.replace(' ', '_')}"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
            return data.get("extract")
    except Exception as e:
        print(f"Wikipedia error: {e}")
    return None

# 2. PubChem PUG REST API

def fetch_from_pubchem(drug_name):
    try:
        cid_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{drug_name}/cids/JSON"
        cid_res = requests.get(cid_url, timeout=10).json()
        cid = cid_res["IdentifierList"]["CID"][0]

        description_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON"
        desc_res = requests.get(description_url, timeout=10).json()

        sections = desc_res["Record"].get("Section", [])
        for section in sections:
            if section.get("TOCHeading") == "Description":
                for info in section.get("Information", []):
                    return info.get("Value", {}).get("StringWithMarkup", [{}])[0].get("String")
    except Exception as e:
        print(f"PubChem error: {e}")
    return None

# 3. OpenFDA Drug Labeling API

def fetch_from_openfda(drug_name):
    try:
        url = f"https://api.fda.gov/drug/label.json?search=openfda.brand_name:{drug_name.lower()}&limit=1"
        res = requests.get(url, timeout=10).json()
        results = res.get("results", [])
        if results:
            return results[0].get("description", [None])[0]
    except Exception as e:
        print(f"OpenFDA error: {e}")
    return None

# Fallback orchestrator

def fetch_drug_summary(drug_name):
    summary = fetch_from_wikipedia(drug_name)
    if not summary:
        summary = fetch_from_pubchem(drug_name)
    if not summary:
        summary = fetch_from_openfda(drug_name)
    return summary or "No data found."

# Example usage
if __name__ == "__main__":
    drugs = ["Paracetamol", "Ibuprofen", "Amoxicillin", "Aspirin"]
    for drug in drugs:
        print(f"\nFetching info for: {drug}")
        summary = fetch_drug_summary(drug)
        print(summary[:500] + ("..." if len(summary) > 500 else ""))
        time.sleep(1)

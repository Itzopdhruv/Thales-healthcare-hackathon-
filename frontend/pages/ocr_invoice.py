# frontend/pages/ocr_invoice.py

import streamlit as st
import requests
import pandas as pd
from datetime import datetime

API_OCR = "http://localhost:8000/ocr"
API_INVENTORY = "http://localhost:8000/inventory"
API_SEARCH = "http://localhost:8000/search"

# ----------------------------
# OCR + Invoice Page
# ----------------------------
def render_ocr_invoice_page():
    st.title("📷 OCR Prescription & Invoice Generator")

    # ----------------------------
    # Upload Image
    # ----------------------------
    image = st.file_uploader("Upload Prescription Image", type=["png", "jpg", "jpeg"])
    if image:
        with st.spinner("🔍 Extracting data using OCR..."):
            res = requests.post(f"{API_OCR}/extract", files={"file": image})
            if res.status_code != 200:
                st.error("OCR failed.")
                return
            data = res.json()

        # ----------------------------
        # Editable Extracted Fields
        # ----------------------------
        st.subheader("🧾 Extracted Prescription Details (Editable)")
        patient = st.text_input("Patient's Name", data.get("Patient's Name"))
        doctor = st.text_input("Doctor's Name", data.get("Doctor's Name"))
        clinic = st.text_input("Clinic Name", data.get("Clinic Name"))
        date = st.date_input("Date", datetime.today())

        # Medicines
        st.markdown("### 💊 Medicines Prescribed:")
        meds = data.get("Medicines Prescribed") or []
        med_inputs = []
        for i, med in enumerate(meds):
            col1, col2 = st.columns([4,1])
            med_name = col1.text_input(f"Medicine {i+1}", value=med)
            col2.markdown("\n")
            med_inputs.append(med_name)

        if st.button("Check Availability"):
            check_availability(med_inputs)

# ----------------------------
# Check Availability & Suggest Alternatives
# ----------------------------
def check_availability(meds):
    st.subheader("✅ Medicine Availability")
    inventory = requests.get(f"{API_INVENTORY}/all").json()
    inventory_dict = {med["name"].lower(): med for med in inventory}

    available = []
    unavailable = []

    for med in meds:
        inv_entry = inventory_dict.get(med.lower())
        if inv_entry and inv_entry.get("quantity", 0) > 0:
            available.append(med)
        else:
            unavailable.append(med)

    st.success("Availability checked successfully.")

    st.markdown("#### ✅ Available Medicines")
    if available:
        st.info(", ".join(available))
    else:
        st.warning("No medicines are available from the prescription.")

    st.markdown("#### ❌ Unavailable Medicines")
    if unavailable:
        st.write(", ".join(unavailable))
    else:
        st.info("No unavailable medicines.")

    # ----------------------------
    # Suggest Alternatives
    # ----------------------------
    if unavailable:
        st.markdown("### 🔁 Alternative Medicines")
        for med in unavailable:
            try:
                res = requests.post(f"{API_SEARCH}/similar", json={"medicine_name": med, "top_k": 5})
                if res.status_code != 200:
                    continue
                alternatives = res.json()
                with st.expander(f"Alternatives for {med}"):
                    for alt in alternatives:
                        st.write(f"💊 {alt['name']} (Score: {alt['score']:.2f})")
            except:
                st.error(f"Error searching alternatives for {med}")

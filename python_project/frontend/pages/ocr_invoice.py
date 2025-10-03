import streamlit as st
import requests
from fpdf import FPDF
from datetime import datetime
import tempfile

API_OCR = "http://localhost:8000/ocr/extract"
API_SELL = "http://localhost:8000/inventory/sell"
API_SEARCH = "http://localhost:8000/search"
API_INVENTORY = "http://localhost:8000/inventory/all"

def render_ocr_invoice_page():
    st.title("💊 OCR + Invoice Generator")

    mode = st.radio("Choose Mode", ["Manual Entry", "OCR via Prescription"])

    meds = []
    patient = doctor = clinic = ""
    date = datetime.today()

    if mode == "Manual Entry":
        st.subheader("📝 Patient and Prescription Details")
        patient = st.text_input("Patient Name")
        doctor = st.text_input("Doctor Name")
        clinic = st.text_input("Clinic Name")
        date = st.date_input("Date", value=datetime.today())

        st.subheader("💊 Add Medicines")
        num_meds = st.number_input("Number of Medicines", min_value=1, max_value=10, step=1)
        for i in range(num_meds):
            name = st.text_input(f"Medicine {i+1} Name", key=f"name_{i}")
            quantity = st.number_input(f"Quantity for {name or f'Medicine {i+1}'}", min_value=1, key=f"qty_{i}")
            if name:
                meds.append({"name": name, "quantity": quantity})

    elif mode == "OCR via Prescription":
        st.subheader("📤 Upload Prescription Image")
        image = st.file_uploader("Upload Image", type=["png", "jpg", "jpeg"])

        if image:
            with st.spinner("Extracting text..."):
                res = requests.post(API_OCR, files={"file": image})
                if res.status_code == 200:
                    data = res.json()
                    patient = st.text_input("Patient Name", value=data.get("Patient's Name", ""))
                    doctor = st.text_input("Doctor Name", value=data.get("Doctor's Name", ""))
                    clinic = st.text_input("Clinic Name", value=data.get("Clinic Name", ""))
                    date = st.date_input("Date", value=datetime.today())

                    extracted = data.get("Medicines Prescribed", [])
                    st.markdown("### 📋 Extracted Medicines")
                    for i, extracted_name in enumerate(extracted):
                        name = st.text_input(f"Medicine {i+1} Name", value=extracted_name, key=f"ocr_name_{i}")
                        quantity = st.number_input(f"Quantity for {name}", min_value=1, key=f"ocr_qty_{i}")
                        if name:
                            meds.append({"name": name, "quantity": quantity})

        st.markdown("### ➕ Add Extra Medicines (Optional)")
        num_extra = st.number_input("Extra medicines to add", min_value=0, max_value=5, step=1, key="extra_ocr_count")
        for j in range(num_extra):
            extra_name = st.text_input(f"Extra Medicine {j+1} Name", key=f"extra_ocr_name_{j}")
            extra_qty = st.number_input(f"Quantity for {extra_name or f'Med {j+1}'}", min_value=1, key=f"extra_ocr_qty_{j}")
            if extra_name:
                meds.append({"name": extra_name, "quantity": extra_qty})

    st.divider()
    st.subheader("🔍 Check Availability and Alternatives")

    final_meds = []
    if meds:
        try:
            inv = requests.get(API_INVENTORY).json()
            inventory_names = {m["name"].lower(): m for m in inv}
        except:
            st.error("❌ Could not connect to inventory API.")
            return

        for med in meds:
            name = med["name"].strip()
            qty = med["quantity"]
            found = inventory_names.get(name.lower())

            if found and found["quantity"] >= qty:
                st.success(f"✅ {name} is available (Qty: {found['quantity']})")
                final_meds.append({"name": name, "quantity": qty})
            else:
                if found:
                    st.warning(f"⚠️ {name} in stock: {found['quantity']} < requested {qty}")
                else:
                    st.warning(f"❌ {name} not in inventory")

                alt_res = requests.post(f"{API_SEARCH}/similar", json={"medicine_name": name, "top_k": 10})
                if alt_res.status_code == 200:
                    try:
                        alts = alt_res.json()
                        options = []
                        used_names = set()

                        for alt in alts:
                            alt_name = alt["name"]
                            if alt_name.lower() in used_names:
                                continue
                            used_names.add(alt_name.lower())

                            match = inventory_names.get(alt_name.lower())
                            if match and match["quantity"] > 0:
                                options.append((alt_name, match["quantity"]))
                            if len(options) >= 5:
                                break

                        if options:
                            st.success("✅ Found top vector alternatives:")
                            for alt_name, qty_available in options:
                                st.markdown(f"- {alt_name} (In stock: {qty_available})")

                            alt_only = [opt[0] for opt in options]
                            selected_alt = st.selectbox(f"Select alternative for {name}", alt_only, key=f"alt_select_{name}")
                            max_qty = dict(options)[selected_alt]
                            alt_qty = st.number_input(f"Quantity for {selected_alt}", min_value=1, max_value=max_qty, key=f"alt_qty_{name}")
                            final_meds.append({"name": selected_alt, "quantity": alt_qty})
                        else:
                            st.error(f"⚠️ No in-stock vector alternatives found for {name}")
                    except Exception as e:
                        st.error(f"❌ Error parsing alternatives: {e}")
                else:
                    st.error(f"❌ Vector search failed: {alt_res.status_code}")
                    st.text(alt_res.text)

    if final_meds and st.button("🧾 Generate Invoice and Update Stock"):
        payload = {"medicines": final_meds}
        with st.spinner("Processing..."):
            res = requests.post(API_SELL, json=payload)

        if res.status_code == 200:
            invoice_data = res.json()["invoice"]
            st.success("✅ Inventory updated and invoice ready!")

            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            pdf.cell(200, 10, txt="Pharmacy Invoice", ln=1, align="C")
            pdf.ln(10)
            pdf.cell(200, 10, txt=f"Patient: {patient}", ln=1)
            pdf.cell(200, 10, txt=f"Doctor: {doctor}", ln=1)
            pdf.cell(200, 10, txt=f"Clinic: {clinic}", ln=1)
            pdf.cell(200, 10, txt=f"Date: {date}", ln=1)
            pdf.ln(10)

            pdf.set_font("Arial", "B", size=12)
            pdf.cell(70, 10, "Medicine", border=1)
            pdf.cell(30, 10, "Qty", border=1)
            pdf.cell(40, 10, "Unit Price", border=1)
            pdf.cell(40, 10, "Subtotal", border=1)
            pdf.ln()

            total = 0
            pdf.set_font("Arial", size=12)
            for item in invoice_data["items"]:
                pdf.cell(70, 10, item["name"], border=1)
                pdf.cell(30, 10, str(item["quantity"]), border=1)
                pdf.cell(40, 10, f"Rs. {item['unit_price']:.2f}", border=1)
                pdf.cell(40, 10, f"Rs. {item['subtotal']:.2f}", border=1)
                pdf.ln()
                total += item["subtotal"]

            pdf.set_font("Arial", "B", size=12)
            pdf.cell(140, 10, "Total", border=1)
            pdf.cell(40, 10, f"Rs. {total:.2f}", border=1)
            pdf.ln()

            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
            pdf.output(tmp.name)
            with open(tmp.name, "rb") as f:
                st.download_button("📥 Download Invoice PDF", f, file_name="invoice.pdf", mime="application/pdf")
        else:
            st.error("❌ Failed to generate invoice or update stock.")

# frontend/pages/inventory.py

import streamlit as st
import pandas as pd
import requests
import plotly.express as px
from datetime import datetime

API_BASE = "http://localhost:8000/inventory"

def render_inventory_page():
    st.title("🧾 Medicine Inventory Management")

    # ------------------------------
    # Load data safely
    # ------------------------------
    try:
        response = requests.get(f"{API_BASE}/all")
        if response.status_code == 200:
            meds = response.json()
            df = pd.DataFrame(meds)
        else:
            st.error("Failed to fetch inventory from the API.")
            df = pd.DataFrame()
    except Exception as e:
        st.error(f"Connection error: {e}")
        df = pd.DataFrame()

    if df.empty:
        st.warning("Inventory is empty. Add some medicines below.")
    else:
        # ------------------------------
        # Analytics Section
        # ------------------------------
        total_meds = len(df)
        low_stock = df[df["quantity"] <= 10]
        total_low_stock = len(low_stock)

        col1, col2 = st.columns(2)
        col1.metric("Total Medicines", total_meds)
        col2.metric("Low Stock Medicines", total_low_stock)

        if total_low_stock > 0:
            with st.expander("⚠️ Medicines Below Threshold"):
                st.dataframe(low_stock)

        st.divider()

        # ------------------------------
        # Searchable Table
        # ------------------------------
        st.subheader("🔍 Search Medicines")
        search = st.text_input("Search by any field")
        if search:
            df = df[df.apply(lambda row: search.lower() in str(row).lower(), axis=1)]
        st.dataframe(df)

        st.divider()

        # ------------------------------
        # Stock Insights Chart
        # ------------------------------
        st.subheader("📦 Stock Level Visualization")
        fig = px.bar(df, x="name", y="quantity", color="quantity",
                     color_continuous_scale="Viridis", title="Stock Levels by Medicine")
        st.plotly_chart(fig, use_container_width=True)

        st.divider()

    # ------------------------------
    # Add New Medicine
    # ------------------------------
    st.subheader("➕ Add New Medicine")
    with st.form("add_form"):
        new_id = st.text_input("ID")
        name = st.text_input("Name")
        dosage = st.text_input("Dosage")
        quantity = st.number_input("Quantity", min_value=0)
        price = st.number_input("Price (₹)", min_value=0.0)
        expiry = st.date_input("Expiry Date", value=datetime.today())
        submitted = st.form_submit_button("Add Medicine")
        if submitted:
            payload = {
                "id": new_id,
                "name": name,
                "dosage": dosage,
                "quantity": quantity,
                "price": price,
                "expiry_date": expiry.strftime("%Y-%m-%d")
            }
            res = requests.post(f"{API_BASE}/add", json=payload)
            if res.status_code == 200:
                st.success("Medicine added successfully ✅")
                st.rerun()
            else:
                st.error(res.json().get("detail"))

    st.divider()

    if not df.empty:
        # ------------------------------
        # Delete Medicine
        # ------------------------------
        st.subheader("🗑 Delete a Medicine")
        del_id = st.selectbox("Select ID to delete", df["id"])
        if st.button("Delete Selected"):
            res = requests.delete(f"{API_BASE}/delete/{del_id}")
            if res.status_code == 200:
                st.success("Deleted successfully ✅")
                st.rerun()
            else:
                st.error("Error deleting medicine")

        st.divider()

        # ------------------------------
        # Update Medicine
        # ------------------------------
        st.subheader("✏️ Update Medicine")
        upd_id = st.selectbox("Select ID to update", df["id"], key="upd")
        med_data = df[df["id"] == upd_id].iloc[0]

        with st.form("update_form"):
            upd_name = st.text_input("Name", med_data["name"])
            upd_dosage = st.text_input("Dosage", med_data["dosage"])
            upd_quantity = st.number_input("Quantity", value=med_data["quantity"])
            upd_price = st.number_input("Price", value=med_data["price"])
            upd_expiry = st.date_input("Expiry Date", value=datetime.strptime(med_data["expiry_date"], "%Y-%m-%d"))
            updated = st.form_submit_button("Update Medicine")
            if updated:
                payload = {
                    "id": upd_id,
                    "name": upd_name,
                    "dosage": upd_dosage,
                    "quantity": upd_quantity,
                    "price": upd_price,
                    "expiry_date": upd_expiry.strftime("%Y-%m-%d")
                }
                res = requests.put(f"{API_BASE}/update/{upd_id}", json=payload)
                if res.status_code == 200:
                    st.success("Updated successfully ✅")
                    st.rerun()
                else:
                    st.error("Update failed")

# frontend/app.py

import streamlit as st

st.set_page_config(
    page_title="PharmaAssist Dashboard",
    layout="wide",
    page_icon="💊"
)

# Sidebar Navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio(
    "Go to",
    [
        "Dashboard",
        "OCR & Invoice Generator",
        "Medicine Management",
        "Chatbot (Coming Soon)",
        "AI SQL Agent (Coming Soon)"
    ]
)

# Route Pages
if page == "Dashboard":
    st.title("📊 Inventory Insights")
    st.info("Select 'Medicine Management' to view or update stock.")

elif page == "OCR & Invoice Generator":
    from pages.ocr_invoice import render_ocr_invoice_page
    render_ocr_invoice_page()

elif page == "Medicine Management":
    from pages.inventory import render_inventory_page
    render_inventory_page()

elif page == "Chatbot (Coming Soon)":
    st.title("🤖 Health Advice Chatbot")
    st.warning("This module is under development.")

elif page == "AI SQL Agent (Coming Soon)":
    st.title("🧠 AI SQL Query Assistant")
    st.warning("This module is under development.")

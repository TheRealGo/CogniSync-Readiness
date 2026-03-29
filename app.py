import streamlit as st

from db import init_db
from views import flanker_page, home, pvt_page, results

init_db()

st.set_page_config(page_title="CogniSync-Readiness", page_icon="\U0001f9e0", layout="centered")

# --- hide sidebar during running tasks ---
_running = st.session_state.get("pvt_phase") == "running" or st.session_state.get("flanker_phase") == "running"
if _running:
    st.markdown(
        "<style>[data-testid='stSidebar']{display:none}</style>",
        unsafe_allow_html=True,
    )

page = st.sidebar.radio("\u30da\u30fc\u30b8\u9078\u629e", ["\U0001f3e0 \u30db\u30fc\u30e0", "\u23f1 PVT", "\U0001f3af Flanker Task", "\U0001f4ca \u7d50\u679c\u5c65\u6b74"], label_visibility="collapsed")

if page == "\U0001f3e0 \u30db\u30fc\u30e0":
    home.render()
elif page == "\u23f1 PVT":
    pvt_page.render()
elif page == "\U0001f3af Flanker Task":
    flanker_page.render()
elif page == "\U0001f4ca \u7d50\u679c\u5c65\u6b74":
    results.render()

import statistics

import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from plotly.subplots import make_subplots

from components.flanker import flanker_component
from components.pvt import pvt_component
from db import (
    get_flanker_trials,
    get_pvt_trials,
    get_sessions,
    init_db,
    save_flanker_session,
    save_pvt_session,
)

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


# ===== Home =====
if page == "\U0001f3e0 \u30db\u30fc\u30e0":
    st.title("CogniSync-Readiness")
    st.markdown(
        """
**CogniSync-Readiness** \u306f\u3001\u79d1\u5b66\u7684\u306b\u5b9f\u8a3c\u3055\u308c\u305f2\u3064\u306e\u30bf\u30b9\u30af\u3092\u7528\u3044\u3066\u3001
\u3042\u306a\u305f\u306e\u8a8d\u77e5\u7684\u6e96\u5099\u72b6\u614b\u3092\u6e2c\u5b9a\u30fb\u8a18\u9332\u3059\u308b\u30c4\u30fc\u30eb\u3067\u3059\u3002

### \u30c6\u30b9\u30c8
| \u30bf\u30b9\u30af | \u6e2c\u5b9a\u5bfe\u8c61 |
|---|---|
| **PVT** (\u7cbe\u795e\u904b\u52d5\u899a\u9192\u691c\u67fb) | \u57fa\u790e\u7684\u306a\u899a\u9192\u5ea6\u3068\u6ce8\u610f\u306e\u6301\u7d9a\u6027 |
| **Flanker Task** (\u30d5\u30e9\u30f3\u30ab\u30fc\u8ab2\u984c) | \u6ce8\u610f\u5236\u5fa1\u3068\u6291\u5236\u6a5f\u80fd |

\u30c6\u30b9\u30c8\u524d\u306b\u4e3b\u89b3\u7684\u30b3\u30f3\u30c7\u30a3\u30b7\u30e7\u30f3\u3092\u5165\u529b\u3057\u3001\u5ba2\u89b3\u7684\u30c7\u30fc\u30bf\u3068\u6bd4\u8f03\u3059\u308b\u3053\u3068\u3067\u3001
\u81ea\u5df1\u8a8d\u77e5\u306e\u6b63\u78ba\u3055\u3092\u30ad\u30e3\u30ea\u30d6\u30ec\u30fc\u30b7\u30e7\u30f3\u3067\u304d\u307e\u3059\u3002

\u2190 \u30b5\u30a4\u30c9\u30d0\u30fc\u304b\u3089\u30c6\u30b9\u30c8\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002
"""
    )


# ===== PVT =====
elif page == "\u23f1 PVT":
    if "pvt_phase" not in st.session_state:
        st.session_state.pvt_phase = "setup"

    if st.session_state.pvt_phase == "setup":
        st.title("PVT - \u7cbe\u795e\u904b\u52d5\u899a\u9192\u691c\u67fb")
        st.markdown(
            "\u753b\u9762\u4e2d\u592e\u306b\u30ab\u30a6\u30f3\u30bf\u30fc\u304c\u8868\u793a\u3055\u308c\u305f\u3089\u3001\u3067\u304d\u308b\u3060\u3051\u901f\u304f **\u30b9\u30da\u30fc\u30b9\u30ad\u30fc** \u3092\u62bc\u3057\u3066\u304f\u3060\u3055\u3044\u3002\n"
            "\u30ab\u30a6\u30f3\u30bf\u30fc\u304c\u8868\u793a\u3055\u308c\u308b\u524d\u306b\u62bc\u3059\u3068\u30d5\u30a9\u30eb\u30b9\u30b9\u30bf\u30fc\u30c8 (FS) \u306b\u306a\u308a\u307e\u3059\u3002"
        )
        score = st.slider("\u73fe\u5728\u306e\u4e3b\u89b3\u7684\u30b3\u30f3\u30c7\u30a3\u30b7\u30e7\u30f3", 1, 10, 5, help="1=\u975e\u5e38\u306b\u60aa\u3044, 10=\u975e\u5e38\u306b\u826f\u3044")
        num = st.number_input("\u8a66\u884c\u56de\u6570", min_value=5, max_value=30, value=10)
        if st.button("\u30c6\u30b9\u30c8\u958b\u59cb", type="primary"):
            st.session_state.pvt_score = score
            st.session_state.pvt_num = num
            st.session_state.pvt_phase = "running"
            st.rerun()

    elif st.session_state.pvt_phase == "running":
        st.info("\u30c6\u30b9\u30c8\u4e2d\u306f\u4ed6\u306e\u64cd\u4f5c\u3092\u3057\u306a\u3044\u3067\u304f\u3060\u3055\u3044\u3002")
        result = pvt_component(num_trials=st.session_state.pvt_num, key="pvt_task")
        if result is not None:
            save_pvt_session(st.session_state.pvt_score, result)
            st.session_state.pvt_result = result
            st.session_state.pvt_phase = "result"
            st.rerun()

    elif st.session_state.pvt_phase == "result":
        st.title("PVT \u7d50\u679c")
        trials = st.session_state.pvt_result
        valid = [t for t in trials if not t.get("is_false_start")]
        fs_count = sum(1 for t in trials if t.get("is_false_start"))
        rts = [t["reaction_time_ms"] for t in valid if t.get("reaction_time_ms") is not None]

        if rts:
            mean_rt = statistics.mean(rts)
            minor = sum(1 for r in rts if r > 355)
            major = sum(1 for r in rts if r > 500)
            sorted_rts = sorted(rts, reverse=True)
            n_slow = max(1, len(sorted_rts) // 10)
            slowest10 = statistics.mean(sorted_rts[:n_slow])

            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Mean RT", f"{mean_rt:.0f} ms")
            c2.metric("Minor Lapse", str(minor))
            c3.metric("Major Lapse", str(major))
            c4.metric("False Start", str(fs_count))
            st.metric("Slowest 10% \u5e73\u5747", f"{slowest10:.0f} ms")

            df = pd.DataFrame(valid)
            fig = go.Figure()
            fig.add_trace(go.Scatter(y=df["reaction_time_ms"], mode="lines+markers", name="RT"))
            fig.add_hline(y=355, line_dash="dash", line_color="#ffd700", annotation_text="Minor Lapse (355ms)")
            fig.add_hline(y=500, line_dash="dash", line_color="#ff4b4b", annotation_text="Major Lapse (500ms)")
            fig.update_layout(
                xaxis_title="\u8a66\u884c", yaxis_title="RT (ms)",
                height=350, margin=dict(t=20, b=40),
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.warning("\u6709\u52b9\u306a\u8a66\u884c\u304c\u3042\u308a\u307e\u305b\u3093\u3002")

        if st.button("\u65b0\u3057\u3044\u30c6\u30b9\u30c8"):
            st.session_state.pvt_phase = "setup"
            st.rerun()


# ===== Flanker =====
elif page == "\U0001f3af Flanker Task":
    if "flanker_phase" not in st.session_state:
        st.session_state.flanker_phase = "setup"

    if st.session_state.flanker_phase == "setup":
        st.title("Flanker Task - \u30d5\u30e9\u30f3\u30ab\u30fc\u8ab2\u984c")
        st.markdown(
            "5\u3064\u306e\u77e2\u5370\u304c\u8868\u793a\u3055\u308c\u307e\u3059\u3002**\u771f\u3093\u4e2d\u306e\u77e2\u5370**\u306e\u5411\u304d\u3060\u3051\u3092\u5224\u65ad\u3057\u3066\u304f\u3060\u3055\u3044\u3002\n\n"
            "- \u5de6\u5411\u304d \u25c0 : **F** \u30ad\u30fc\n"
            "- \u53f3\u5411\u304d \u25b6 : **J** \u30ad\u30fc"
        )
        score = st.slider(
            "\u73fe\u5728\u306e\u4e3b\u89b3\u7684\u30b3\u30f3\u30c7\u30a3\u30b7\u30e7\u30f3", 1, 10, 5,
            help="1=\u975e\u5e38\u306b\u60aa\u3044, 10=\u975e\u5e38\u306b\u826f\u3044", key="fl_score",
        )
        num = st.number_input("\u8a66\u884c\u56de\u6570", min_value=10, max_value=80, value=40, step=2, key="fl_num")
        if st.button("\u30c6\u30b9\u30c8\u958b\u59cb", type="primary", key="fl_start"):
            st.session_state.flanker_score = score
            st.session_state.flanker_num = num
            st.session_state.flanker_phase = "running"
            st.rerun()

    elif st.session_state.flanker_phase == "running":
        st.info("\u30c6\u30b9\u30c8\u4e2d\u306f\u4ed6\u306e\u64cd\u4f5c\u3092\u3057\u306a\u3044\u3067\u304f\u3060\u3055\u3044\u3002")
        result = flanker_component(num_trials=st.session_state.flanker_num, key="flanker_task")
        if result is not None:
            save_flanker_session(st.session_state.flanker_score, result)
            st.session_state.flanker_result = result
            st.session_state.flanker_phase = "result"
            st.rerun()

    elif st.session_state.flanker_phase == "result":
        st.title("Flanker \u7d50\u679c")
        trials = st.session_state.flanker_result

        correct = sum(1 for t in trials if t["is_correct"])
        accuracy = correct / len(trials) * 100 if trials else 0

        cong_rts = [t["reaction_time_ms"] for t in trials if t["is_congruent"] and t["is_correct"]]
        incong_rts = [t["reaction_time_ms"] for t in trials if not t["is_congruent"] and t["is_correct"]]
        all_rts = [t["reaction_time_ms"] for t in trials if t["is_correct"]]

        mean_cong = statistics.mean(cong_rts) if cong_rts else 0
        mean_incong = statistics.mean(incong_rts) if incong_rts else 0
        interference = mean_incong - mean_cong
        std_dev = statistics.pstdev(all_rts) if len(all_rts) >= 2 else 0

        c1, c2, c3 = st.columns(3)
        c1.metric("\u6b63\u7b54\u7387", f"{accuracy:.1f}%")
        c2.metric("\u5e72\u6e09\u52b9\u679c", f"{interference:.0f} ms")
        c3.metric("RT \u6a19\u6e96\u504f\u5dee", f"{std_dev:.0f} ms")

        c4, c5 = st.columns(2)
        c4.metric("\u4e00\u81f4\u8a66\u884c \u5e73\u5747RT", f"{mean_cong:.0f} ms")
        c5.metric("\u4e0d\u4e00\u81f4\u8a66\u884c \u5e73\u5747RT", f"{mean_incong:.0f} ms")

        df = pd.DataFrame(trials)
        colors = ["#4b9dff" if c else "#ff8c00" for c in df["is_congruent"]]
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            y=df["reaction_time_ms"], mode="lines+markers",
            marker=dict(color=colors, size=6), line=dict(color="#666"),
            name="RT",
        ))
        fig.update_layout(
            xaxis_title="\u8a66\u884c", yaxis_title="RT (ms)",
            height=350, margin=dict(t=20, b=40),
        )
        st.plotly_chart(fig, use_container_width=True)
        st.caption("\U0001f535 \u4e00\u81f4\u8a66\u884c\u3000\U0001f7e0 \u4e0d\u4e00\u81f4\u8a66\u884c")

        if st.button("\u65b0\u3057\u3044\u30c6\u30b9\u30c8", key="fl_new"):
            st.session_state.flanker_phase = "setup"
            st.rerun()


# ===== Results =====
elif page == "\U0001f4ca \u7d50\u679c\u5c65\u6b74":
    st.title("\u7d50\u679c\u5c65\u6b74")

    tab_pvt, tab_flanker = st.tabs(["PVT", "Flanker Task"])

    # --- PVT history ---
    with tab_pvt:
        sessions = get_sessions("pvt")
        if not sessions:
            st.info("PVT\u306e\u8a18\u9332\u304c\u3042\u308a\u307e\u305b\u3093\u3002")
        else:
            # Trend chart
            trend_data = []
            for s in reversed(sessions):
                trs = get_pvt_trials(s["id"])
                valid_rts = [t["reaction_time_ms"] for t in trs if not t["is_false_start"] and t["reaction_time_ms"] is not None]
                if valid_rts:
                    trend_data.append({
                        "date": s["created_at"][:16],
                        "mean_rt": statistics.mean(valid_rts),
                        "subjective": s["subjective_score"],
                    })
            if len(trend_data) >= 2:
                tdf = pd.DataFrame(trend_data)
                fig = make_subplots(specs=[[{"secondary_y": True}]])
                fig.add_trace(
                    go.Scatter(x=tdf["date"], y=tdf["mean_rt"], name="Mean RT (ms)", line=dict(color="#ff4b4b")),
                    secondary_y=False,
                )
                fig.add_trace(
                    go.Scatter(x=tdf["date"], y=tdf["subjective"], name="\u4e3b\u89b3\u30b9\u30b3\u30a2", line=dict(color="#4b9dff", dash="dot")),
                    secondary_y=True,
                )
                fig.update_layout(height=300, margin=dict(t=20, b=40))
                fig.update_yaxes(title_text="RT (ms)", secondary_y=False)
                fig.update_yaxes(title_text="\u4e3b\u89b3\u30b9\u30b3\u30a2", range=[0, 11], secondary_y=True)
                st.plotly_chart(fig, use_container_width=True)

            st.markdown("---")
            for s in sessions:
                trs = get_pvt_trials(s["id"])
                valid = [t for t in trs if not t["is_false_start"]]
                rts = [t["reaction_time_ms"] for t in valid if t["reaction_time_ms"] is not None]
                if not rts:
                    continue
                mean_rt = statistics.mean(rts)
                minor = sum(1 for r in rts if r > 355)
                major = sum(1 for r in rts if r > 500)
                label = f"{s['created_at'][:16]} | \u4e3b\u89b3: {s['subjective_score']}/10 | Mean RT: {mean_rt:.0f}ms"
                with st.expander(label):
                    c1, c2, c3 = st.columns(3)
                    c1.metric("Mean RT", f"{mean_rt:.0f} ms")
                    c2.metric("Minor Lapse", str(minor))
                    c3.metric("Major Lapse", str(major))

    # --- Flanker history ---
    with tab_flanker:
        sessions = get_sessions("flanker")
        if not sessions:
            st.info("Flanker Task\u306e\u8a18\u9332\u304c\u3042\u308a\u307e\u305b\u3093\u3002")
        else:
            trend_data = []
            for s in reversed(sessions):
                trs = get_flanker_trials(s["id"])
                if not trs:
                    continue
                acc = sum(1 for t in trs if t["is_correct"]) / len(trs) * 100
                cong = [t["reaction_time_ms"] for t in trs if t["is_congruent"] and t["is_correct"]]
                incong = [t["reaction_time_ms"] for t in trs if not t["is_congruent"] and t["is_correct"]]
                intf = (statistics.mean(incong) - statistics.mean(cong)) if cong and incong else 0
                trend_data.append({
                    "date": s["created_at"][:16],
                    "accuracy": acc,
                    "interference": intf,
                    "subjective": s["subjective_score"],
                })
            if len(trend_data) >= 2:
                tdf = pd.DataFrame(trend_data)
                fig = make_subplots(specs=[[{"secondary_y": True}]])
                fig.add_trace(
                    go.Scatter(x=tdf["date"], y=tdf["interference"], name="\u5e72\u6e09\u52b9\u679c (ms)", line=dict(color="#ff8c00")),
                    secondary_y=False,
                )
                fig.add_trace(
                    go.Scatter(x=tdf["date"], y=tdf["subjective"], name="\u4e3b\u89b3\u30b9\u30b3\u30a2", line=dict(color="#4b9dff", dash="dot")),
                    secondary_y=True,
                )
                fig.update_layout(height=300, margin=dict(t=20, b=40))
                fig.update_yaxes(title_text="\u5e72\u6e09\u52b9\u679c (ms)", secondary_y=False)
                fig.update_yaxes(title_text="\u4e3b\u89b3\u30b9\u30b3\u30a2", range=[0, 11], secondary_y=True)
                st.plotly_chart(fig, use_container_width=True)

            st.markdown("---")
            for s in sessions:
                trs = get_flanker_trials(s["id"])
                if not trs:
                    continue
                acc = sum(1 for t in trs if t["is_correct"]) / len(trs) * 100
                cong = [t["reaction_time_ms"] for t in trs if t["is_congruent"] and t["is_correct"]]
                incong = [t["reaction_time_ms"] for t in trs if not t["is_congruent"] and t["is_correct"]]
                intf = (statistics.mean(incong) - statistics.mean(cong)) if cong and incong else 0
                label = f"{s['created_at'][:16]} | \u4e3b\u89b3: {s['subjective_score']}/10 | \u6b63\u7b54\u7387: {acc:.1f}%"
                with st.expander(label):
                    c1, c2, c3 = st.columns(3)
                    c1.metric("\u6b63\u7b54\u7387", f"{acc:.1f}%")
                    c2.metric("\u5e72\u6e09\u52b9\u679c", f"{intf:.0f} ms")
                    c3.metric("\u4e00\u81f4 \u5e73\u5747RT", f"{statistics.mean(cong):.0f} ms" if cong else "N/A")

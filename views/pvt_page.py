import statistics

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from components.pvt import pvt_component
from db import save_pvt_session


def render():
    if "pvt_phase" not in st.session_state:
        st.session_state.pvt_phase = "setup"

    if st.session_state.pvt_phase == "setup":
        _setup()
    elif st.session_state.pvt_phase == "running":
        _running()
    elif st.session_state.pvt_phase == "result":
        _result()


def _setup():
    st.title("PVT - 精神運動覚醒検査")
    st.markdown(
        "画面中央にカウンターが表示されたら、できるだけ速く **スペースキー** を押してください。\n"
        "カウンターが表示される前に押すとフォルススタート (FS) になります。"
    )
    score = st.slider("現在の主観的コンディション", 1, 10, 5, help="1=非常に悪い, 10=非常に良い")
    duration_min = st.number_input(
        "テスト時間（分）", min_value=1, max_value=10, value=3,
        help="学術的推奨値: 3分 (Basner & Dinges, 2011)",
    )
    if st.button("テスト開始", type="primary"):
        st.session_state.pvt_score = score
        st.session_state.pvt_duration = duration_min * 60
        st.session_state.pvt_phase = "running"
        st.rerun()


def _running():
    st.info("テスト中は他の操作をしないでください。")
    result = pvt_component(duration_sec=st.session_state.pvt_duration, key="pvt_task")
    if result is not None:
        save_pvt_session(st.session_state.pvt_score, result)
        st.session_state.pvt_result = result
        st.session_state.pvt_phase = "result"
        st.rerun()


def _result():
    st.title("PVT 結果")
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
        st.metric("Slowest 10% 平均", f"{slowest10:.0f} ms")

        df = pd.DataFrame(valid)
        fig = go.Figure()
        fig.add_trace(go.Scatter(y=df["reaction_time_ms"], mode="lines+markers", name="RT"))
        fig.add_hline(y=355, line_dash="dash", line_color="#ffd700", annotation_text="Minor Lapse (355ms)")
        fig.add_hline(y=500, line_dash="dash", line_color="#ff4b4b", annotation_text="Major Lapse (500ms)")
        fig.update_layout(
            xaxis_title="試行", yaxis_title="RT (ms)",
            height=350, margin=dict(t=20, b=40),
        )
        st.plotly_chart(fig, width="stretch")
    else:
        st.warning("有効な試行がありません。")

    if st.button("新しいテスト"):
        st.session_state.pvt_phase = "setup"
        st.rerun()

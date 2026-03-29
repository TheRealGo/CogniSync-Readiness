import statistics

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from components.flanker import flanker_component
from db import save_flanker_session


def render():
    if "flanker_phase" not in st.session_state:
        st.session_state.flanker_phase = "setup"

    if st.session_state.flanker_phase == "setup":
        _setup()
    elif st.session_state.flanker_phase == "running":
        _running()
    elif st.session_state.flanker_phase == "result":
        _result()


def _setup():
    st.title("Flanker Task - フランカー課題")
    st.markdown(
        "5つの矢印が表示されます。**真ん中の矢印**の向きだけを判断してください。\n\n"
        "- 左向き ◀ : **F** キー\n"
        "- 右向き ▶ : **J** キー"
    )
    score = st.slider(
        "現在の主観的コンディション", 1, 10, 5,
        help="1=非常に悪い, 10=非常に良い", key="fl_score",
    )
    num = st.number_input("試行回数", min_value=10, max_value=80, value=40, step=2, key="fl_num")
    if st.button("テスト開始", type="primary", key="fl_start"):
        st.session_state.flanker_score = score
        st.session_state.flanker_num = num
        st.session_state.flanker_phase = "running"
        st.rerun()


def _running():
    st.info("テスト中は他の操作をしないでください。")
    result = flanker_component(num_trials=st.session_state.flanker_num, key="flanker_task")
    if result is not None:
        save_flanker_session(st.session_state.flanker_score, result)
        st.session_state.flanker_result = result
        st.session_state.flanker_phase = "result"
        st.rerun()


def _result():
    st.title("Flanker 結果")
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
    c1.metric("正答率", f"{accuracy:.1f}%")
    c2.metric("干渉効果", f"{interference:.0f} ms")
    c3.metric("RT 標準偏差", f"{std_dev:.0f} ms")

    c4, c5 = st.columns(2)
    c4.metric("一致試行 平均RT", f"{mean_cong:.0f} ms")
    c5.metric("不一致試行 平均RT", f"{mean_incong:.0f} ms")

    df = pd.DataFrame(trials)
    colors = ["#4b9dff" if c else "#ff8c00" for c in df["is_congruent"]]
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        y=df["reaction_time_ms"], mode="lines+markers",
        marker=dict(color=colors, size=6), line=dict(color="#666"),
        name="RT",
    ))
    fig.update_layout(
        xaxis_title="試行", yaxis_title="RT (ms)",
        height=350, margin=dict(t=20, b=40),
    )
    st.plotly_chart(fig, width="stretch")
    st.caption("\U0001f535 一致試行　\U0001f7e0 不一致試行")

    if st.button("新しいテスト", key="fl_new"):
        st.session_state.flanker_phase = "setup"
        st.rerun()

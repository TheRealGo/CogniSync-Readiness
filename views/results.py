import statistics

import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from plotly.subplots import make_subplots

from db import (
    delete_all_sessions,
    delete_session,
    get_flanker_trials,
    get_pvt_trials,
    get_sessions,
)


def render():
    st.title("結果履歴")

    tab_pvt, tab_flanker = st.tabs(["PVT", "Flanker Task"])

    with tab_pvt:
        _pvt_history()

    with tab_flanker:
        _flanker_history()


def _pvt_history():
    sessions = get_sessions("pvt")
    if not sessions:
        st.info("PVTの記録がありません。")
        return

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
            go.Scatter(x=tdf["date"], y=tdf["subjective"], name="主観スコア", line=dict(color="#4b9dff", dash="dot")),
            secondary_y=True,
        )
        fig.update_layout(height=300, margin=dict(t=20, b=40))
        fig.update_yaxes(title_text="RT (ms)", secondary_y=False)
        fig.update_yaxes(title_text="主観スコア", range=[0, 11], secondary_y=True)
        st.plotly_chart(fig, width="stretch")

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
        label = f"{s['created_at'][:16]} | 主観: {s['subjective_score']}/10 | Mean RT: {mean_rt:.0f}ms"
        with st.expander(label):
            c1, c2, c3 = st.columns(3)
            c1.metric("Mean RT", f"{mean_rt:.0f} ms")
            c2.metric("Minor Lapse", str(minor))
            c3.metric("Major Lapse", str(major))
            if st.button("削除", key=f"del_pvt_{s['id']}", type="secondary"):
                delete_session(s["id"])
                st.rerun()

    st.markdown("---")
    if st.button("全てのPVT記録を削除", key="del_all_pvt", type="secondary"):
        st.session_state.confirm_del_pvt = True
    if st.session_state.get("confirm_del_pvt"):
        st.warning("本当に全てのPVT記録を削除しますか？")
        c_yes, c_no = st.columns(2)
        if c_yes.button("はい、削除する", key="confirm_yes_pvt", type="primary"):
            delete_all_sessions("pvt")
            st.session_state.confirm_del_pvt = False
            st.rerun()
        if c_no.button("キャンセル", key="confirm_no_pvt"):
            st.session_state.confirm_del_pvt = False
            st.rerun()


def _flanker_history():
    sessions = get_sessions("flanker")
    if not sessions:
        st.info("Flanker Taskの記録がありません。")
        return

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
            go.Scatter(x=tdf["date"], y=tdf["interference"], name="干渉効果 (ms)", line=dict(color="#ff8c00")),
            secondary_y=False,
        )
        fig.add_trace(
            go.Scatter(x=tdf["date"], y=tdf["subjective"], name="主観スコア", line=dict(color="#4b9dff", dash="dot")),
            secondary_y=True,
        )
        fig.update_layout(height=300, margin=dict(t=20, b=40))
        fig.update_yaxes(title_text="干渉効果 (ms)", secondary_y=False)
        fig.update_yaxes(title_text="主観スコア", range=[0, 11], secondary_y=True)
        st.plotly_chart(fig, width="stretch")

    st.markdown("---")
    for s in sessions:
        trs = get_flanker_trials(s["id"])
        if not trs:
            continue
        acc = sum(1 for t in trs if t["is_correct"]) / len(trs) * 100
        cong = [t["reaction_time_ms"] for t in trs if t["is_congruent"] and t["is_correct"]]
        incong = [t["reaction_time_ms"] for t in trs if not t["is_congruent"] and t["is_correct"]]
        intf = (statistics.mean(incong) - statistics.mean(cong)) if cong and incong else 0
        label = f"{s['created_at'][:16]} | 主観: {s['subjective_score']}/10 | 正答率: {acc:.1f}%"
        with st.expander(label):
            c1, c2, c3 = st.columns(3)
            c1.metric("正答率", f"{acc:.1f}%")
            c2.metric("干渉効果", f"{intf:.0f} ms")
            c3.metric("一致 平均RT", f"{statistics.mean(cong):.0f} ms" if cong else "N/A")
            if st.button("削除", key=f"del_fl_{s['id']}", type="secondary"):
                delete_session(s["id"])
                st.rerun()

    st.markdown("---")
    if st.button("全てのFlanker記録を削除", key="del_all_fl", type="secondary"):
        st.session_state.confirm_del_flanker = True
    if st.session_state.get("confirm_del_flanker"):
        st.warning("本当に全てのFlanker記録を削除しますか？")
        c_yes, c_no = st.columns(2)
        if c_yes.button("はい、削除する", key="confirm_yes_fl", type="primary"):
            delete_all_sessions("flanker")
            st.session_state.confirm_del_flanker = False
            st.rerun()
        if c_no.button("キャンセル", key="confirm_no_fl"):
            st.session_state.confirm_del_flanker = False
            st.rerun()

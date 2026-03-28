import streamlit.components.v1 as components
from pathlib import Path

_component_func = components.declare_component(
    "pvt_component",
    path=str(Path(__file__).parent / "frontend" / "pvt"),
)


def pvt_component(num_trials: int = 10, key: str | None = None):
    return _component_func(num_trials=num_trials, key=key, default=None)

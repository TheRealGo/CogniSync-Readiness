import streamlit.components.v1 as components
from pathlib import Path

_component_func = components.declare_component(
    "pvt_component",
    path=str(Path(__file__).parent / "frontend" / "pvt"),
)


def pvt_component(duration_sec: int = 180, key: str | None = None):
    return _component_func(duration_ms=duration_sec * 1000, key=key, default=None)

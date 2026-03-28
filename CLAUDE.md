# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CogniSync-Readiness is a cognitive readiness measurement tool that uses two scientifically validated tasks:
- **PVT (Psychomotor Vigilance Task)**: Measures sustained attention and alertness via reaction time to a counting stimulus (2-10s random ISI)
- **Flanker Task (Eriksen Flanker Task)**: Measures inhibitory control and noise filtering via directional arrow discrimination (congruent/incongruent trials)

Users provide a subjective condition score (1-10) before each session, which is compared against objective metrics to calibrate self-awareness.

## Development

**Package manager**: uv (check `pyproject.toml` — no `[tool.poetry]` section)

```bash
uv sync                    # Install dependencies
uv run streamlit run app.py  # Launch the Streamlit app
uv run pytest              # Run tests (when added)
uv add <package>           # Add a dependency
```

**Python version**: 3.12 (pinned in `.python-version`)

## Architecture

- `app.py` — Streamlit app entry point (sidebar navigation: Home / PVT / Flanker / Results)
- `db.py` — SQLite database layer (`cognisync.db` at project root)
- `components/pvt.py`, `components/flanker.py` — Streamlit custom component wrappers
- `components/frontend/pvt/index.html`, `components/frontend/flanker/index.html` — Client-side JS for timing-critical task execution (communicates with Streamlit via `postMessage` protocol)

Reaction time measurement runs entirely in the browser (client-side JS with `performance.now()`) to avoid server roundtrip latency. Results are sent back to Python via the Streamlit custom component protocol and persisted to SQLite.

## Key Design Constraints (from Spec.md)

- PVT inter-stimulus intervals must be fully random (2000-10000ms) to prevent rhythm learning
- Flanker trial order must be shuffled every session to prevent pattern memorization
- PVT thresholds: Minor Lapse > 355ms, Major Lapse > 500ms, False Start = response before stimulus
- Flanker trials: 30-50 per session, 50:50 congruent/incongruent ratio
- Results are stored in a local database for long-term trend analysis

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CogniSync-Readiness is a cognitive readiness measurement tool that uses two scientifically validated tasks:
- **PVT (Psychomotor Vigilance Task)**: Measures sustained attention and alertness via reaction time to a counting stimulus (2-10s random ISI)
- **Flanker Task (Eriksen Flanker Task)**: Measures inhibitory control and noise filtering via directional arrow discrimination (congruent/incongruent trials)

Users provide a subjective condition score (1-10) before each session, which is compared against objective metrics to calibrate self-awareness.

## Development

**Stack**: Next.js 15 + TypeScript + Tailwind CSS 4 + better-sqlite3 + Recharts

**Package manager**: pnpm

```bash
pnpm install              # Install dependencies
pnpm dev                  # Launch development server (http://localhost:3000)
pnpm build                # Production build
pnpm start                # Start production server
```

## Architecture

- `src/app/layout.tsx` — Root layout with sidebar navigation
- `src/app/page.tsx` — Home page
- `src/app/pvt/page.tsx` — PVT task page (setup → running → result)
- `src/app/flanker/page.tsx` — Flanker task page (setup → running → result)
- `src/app/results/page.tsx` — Results history with trend charts
- `src/app/api/` — Next.js API routes for CRUD operations
- `src/components/pvt-task.tsx` — PVT client-side timing component (`performance.now()`)
- `src/components/flanker-task.tsx` — Flanker client-side timing component
- `src/components/pvt-results.tsx`, `flanker-results.tsx` — Single-session result displays
- `src/lib/db.ts` — SQLite database layer (better-sqlite3, `cognisync.db` at project root)
- `src/lib/types.ts` — TypeScript type definitions
- `src/lib/constants.ts` — Task thresholds and defaults

Reaction time measurement runs entirely in the browser (React components with `performance.now()`) to avoid server roundtrip latency. Results are sent to API routes and persisted to SQLite.

## Key Design Constraints (from Spec.md)

- PVT inter-stimulus intervals must be fully random (2000-10000ms) to prevent rhythm learning
- Flanker trial order must be shuffled every session to prevent pattern memorization
- PVT thresholds: Minor Lapse > 355ms, Major Lapse > 500ms, False Start = response before stimulus
- Flanker trials: 30-50 per session, 50:50 congruent/incongruent ratio
- Results are stored in a local database for long-term trend analysis

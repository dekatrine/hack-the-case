# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-simulator for solving business cases (PM interviews and consulting). Two services:
- **Root-level React+Vite frontend** — the active frontend deployed to Render
- **`backend/`** — Python FastAPI that calls YandexGPT

The `frontend/` subdirectory is an **old copy** and is not built or deployed by Render. All active frontend work happens in the root.

## Commands

### Frontend (root directory)
```bash
npm install
npm run dev           # dev server at http://localhost:5173
npm run build         # builds to dist/
npm run test:unit     # run Vitest tests once
npm run test:unit:update  # update snapshots
```

### Backend
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Environment variables
Copy `Secrets.example.toml` → `Secrets.toml` and fill in:
```toml
YANDEX_API_KEY = "..."
YANDEX_FOLDER_ID = "..."
YANDEX_MODEL = "yandexgpt-lite"   # without /latest — backend appends it
```

For a non-default backend URL during frontend dev:
```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Architecture

### Frontend

Everything is in a single `main.jsx` (~4000 lines). All screens are React components rendered inside one root `App` component that uses `useState` to track the current `screen`. There is no router.

Key screen/component mapping:
- `Landing` — home dashboard with sidebar navigation
- `TrackDetail` — case configuration form (industry, difficulty, interview type, grade)
- `Workspace` — the solve screen: left rail `StepsRail`, main `StepBlock` editor, right `CoachPanel` (desktop), floating sheet on mobile
- `InterviewTogether` → `InterviewTask` — mock interview mode with 5 structured rounds
- `LearnPage` — tabbed learning section (Notes, Flashcards, Question Bank, Key Definitions, AI Mentor)
- `PMQuestHifi` (in `pmquest-hifi.jsx`) — standalone hi-fi prototype

**Static data files:**
- `courseData.js` — `PM_CHAPTERS`, `FLASHCARDS`, `PRACTICE_QUESTIONS`, `KEY_DEFINITIONS`
- `quizData.js` — `QUIZ_CATEGORIES`, `QUIZ_QUESTIONS`
- `tracks.py` (Python, root) — loaded by backend at startup via `importlib`; also duplicated in frontend state via `/api/config`

**API client:** `api/client.js` — thin `fetch` wrapper; base URL is `VITE_API_BASE_URL` in prod, `http://localhost:8000` in dev.

**Styling:** `styles.css` (~2000 lines vanilla CSS, one file). No CSS modules, no Tailwind yet. CSS custom properties for theming (`--ink`, `--paper`, `--mint`, `--rust`, `--amber`, etc.).

### Backend

`backend/app/` layout:
- `main.py` — FastAPI app, all endpoints
- `llm.py` — `call_yandex_gpt()` — single function wrapping YandexGPT with retry logic
- `prompts.py` — all system prompts as constants
- `data.py` — `CASE_STEPS`, `INDUSTRIES`, `DIFFICULTY_LEVELS`, `COURSE_MODULES`
- `schemas.py` — Pydantic request/response models
- `config.py` — `Settings` reads env vars, falls back to `Secrets.toml` / `secrets.toml`

**Key business logic in `main.py`:**
- `POST /api/cases/generate` — generates case text, then for the `product` track calls `generate_phases_for_case()` (5–7 AI phases with sub-questions) or falls back to `pick_steps_for_case()` (picks from static `CASE_STEPS`)
- `POST /api/coach` — stateless per-step coaching chat
- `POST /api/evaluate` — scores the full case solution
- `GET /api/config` — returns static config (steps, industries, tracks) consumed once at app load

### Deployment

`render.yaml` defines two Render services:
- `hack-the-case-api` — Python web service, `rootDir: backend`
- `hack-the-case-web` — static site, builds from root with `npm ci && npm run build`, publishes `dist/`, rewrites all routes to `index.html`

## Planned Redesign

`DESIGN.md` documents a full redesign: Tailwind CSS v4 + shadcn/ui replacing the vanilla CSS, new color tokens, new component inventory (`<StepIndicator>`, `<ScoreBadge>`, `<CaseCard>`, `<FlashCard>`, `<HintBox>`), and mobile-first responsive layouts for all pages. The migration is phased: infrastructure → atomic components → pages → polish.

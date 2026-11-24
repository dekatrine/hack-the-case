# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Case-interview trainer for product managers and analysts. The interviewer asks, the person requests data and defends decisions, and the debrief quotes their own answers. Two services:
- **Root-level React+Vite frontend** — the only frontend, deployed to Render from `main`
- **`backend/`** — Python FastAPI that calls YandexGPT

The old `frontend/` copy no longer exists. Do not recreate it.

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

`main.jsx` mounts `MvpApp.jsx` and nothing else (the rest of `main.jsx` is legacy screens, not rendered). `MvpApp.jsx` holds the app shell: a `screen` state, no router. Screens: `home` (default), `library` (Практика: собесы и кейсы), `progress`, `interviews`, `generate`, `solve`, `review`, `learning`, `cards`, `theory`. The header has three sections plus the «Новый кейс» button: Главная (home and progress), Практика (library), Учёба (learning; cards and theory are opened from it).

Modules:
- `interviews/` — interview engine. `skeletons/*.json` define phases and turns (kinds ASK, DATA, CLARIFY, CHALLENGE, TWIST, DEMAND); `seeds.js` builds a random case per run (industry × hidden truth × twist × trap, with numbers, scenes, clues); `engine.js` runs a session; `rubric.js` grades answers locally by 7 skills (checks are regexes, plus `numberCheck` against the seed's numbers); `compare.js` compares with the previous interview; `configured.js` builds an LLM-generated interview ("configured"), graded by `/api/evaluate`; `Interview.jsx` is the UI (draft kept 24 h, drill on the weakest answer). `calibration.json` holds a strong answer for every turn of every skeleton.
- `home/` — home, progress, onboarding. `attempts.js` is the single read model over interviews and case attempts; `progress.js` computes the summary, weekly rhythm and which scenario to recommend for the weakest skill.
- `cases/` — case library and the self-paced case flow (`CaseFlow.jsx`, `caseWriting.js`).
- `learning/` — lessons, theory, flashcards.
- `api/client.js` — fetch wrapper (base URL from `VITE_API_BASE_URL`); `api/sync.js` mirrors some localStorage keys to the server.

localStorage keys: `htc_mvp_cases_v1` (cases and their attempts), `htc_interview_runs_v1` (finished interviews only), `htc_interview_draft_v1` (unfinished interview, 24 h), `htc_interview_seen_v1` (repeat protection), `htc_onboarding_v1`. Cases and onboarding are local-only; finished interviews are pushed to the server by `interviews/storage.js`.

Adding an interview scenario: new `skeletons/<id>.json`, a branch in `seeds.js` (groups, numbers, clues, intro, scenes, replies, a flag like `strategy`), a strong answer for every turn in `calibration.json`, an entry in `home/progress.js` `recommendedSkeleton`. Rules enforced by `engine.test.js`: every turn must be gradable from text (checks, evidence, or plain options); scoping questions that need no numbers carry `scoping: true`; weak runs average at most 40, strong at least 80.

**Styling:** `styles.css`, `mvp.css`, plus per-module CSS (`interviews/interview.css`, `home/home.css`, `cases/case-library.css`). Vanilla CSS with custom properties. No Tailwind yet.

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

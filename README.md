# Hack the Case

AI-симулятор решения бизнес-кейсов. Проект состоит из двух сервисов:

- `backend/` — Python FastAPI API с интеграцией YandexGPT;
- корень репозитория — актуальный React + Vite frontend, который деплоится на Render.

Папка `frontend/` осталась как старая копия интерфейса и сейчас не используется в `render.yaml`.

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API:

- `GET /health`
- `GET /api/config`
- `POST /api/cases/generate`
- `POST /api/coach`
- `POST /api/evaluate`

## Frontend

```bash
npm install
npm run dev
```

По умолчанию frontend обращается к `http://localhost:8000`. Для другого адреса backend:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Для production frontend тоже использует `VITE_API_BASE_URL`. Для локальной разработки можно создать `.env.local` в корне проекта.

## Secrets

Backend читает настройки из переменных окружения или локальных TOML-файлов:

```toml
YANDEX_API_KEY = "your-yandex-api-key"
YANDEX_FOLDER_ID = "your-folder-id"
YANDEX_MODEL = "yandexgpt-lite"
```

Можно скопировать `Secrets.example.toml` в `Secrets.toml` и заполнить локальными значениями. `Secrets.toml` не добавляй в архивы и репозитории.

Важно: `YANDEX_MODEL` указывай без `/latest`, backend добавляет `/latest` сам.

Для production через env-переменные также нужен `ALLOWED_ORIGINS` со списком разрешённых origin через запятую. Для Render-доменов с автоматическим суффиксом backend поддерживает `ALLOWED_ORIGIN_REGEX`.

## Структура

```text
backend/
  app/
    main.py       # FastAPI endpoints
    llm.py        # вызов YandexGPT
    data.py       # этапы, отрасли, уровни сложности
    prompts.py    # промпты генерации, коуча и жюри
    schemas.py    # Pydantic DTO
api/client.js      # HTTP-клиент актуального frontend
main.jsx           # React-приложение актуального frontend
styles.css         # стили актуального frontend
frontend/
  src/             # старая копия frontend, Render ее не собирает
```

## Deploy

В репозитории уже есть:

- [render.yaml](/Users/deevakatya/Desktop/hack-the-case/render.yaml) для деплоя backend + frontend на Render
- [DEPLOY.md](/Users/deevakatya/Desktop/hack-the-case/DEPLOY.md) с пошаговой инструкцией

Рекомендуемая production-схема:

- frontend: `https://your-domain.com`
- backend: `https://api.your-domain.com`

Тогда:

- `VITE_API_BASE_URL=https://api.your-domain.com`
- `ALLOWED_ORIGINS=https://your-domain.com`
- `ALLOWED_ORIGIN_REGEX=` если Render-regex больше не нужен

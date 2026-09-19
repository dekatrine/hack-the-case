# Hack the Case

AI-симулятор решения бизнес-кейсов. Проект состоит из двух сервисов:

- `backend/` — Python FastAPI API с интеграцией YandexGPT;
- корень репозитория — актуальный React + Vite frontend, который деплоится на Render.

## Текущий MVP

Входной экран — `MvpApp.jsx`: мои кейсы → генерация ИИ-кейса → решение
в восьми коротких вопросах → ИИ-разбор → редактирование и повторная проверка.
Направление одно — продуктовое. Настройки генерации: тип собеседования, отрасль, сложность и необязательный контекст.
Типы: Product Sense, аналитика и метрики, продуктовая стратегия, эксперименты и рост, оценка рынка.
Общие определения типов, вопросов и требований к модели — `backend/app/product_interviews.json`.
Выбранный тип передаётся в генерацию и проверку; вопросы сохраняются в каждой новой версии ответа.
Кейсы, черновики и неизменяемые версии ответов с разборами сохраняются локально
в этом браузере (`htc_mvp_cases_v1`), без синхронизации между устройствами.

Палитра берётся из существующего `design/clean-tokens.css`, без изменений.
Уроки, квизы, коуч и mock-интервью сохранены в прежнем `App` в `main.jsx`,
но не подключены к активному интерфейсу. Их можно возвращать поэтапно.
API генерации и оценки принимают `mvp: true`: генерация не вызывает отдельный
ИИ-маршрут, а оценка проверяет смысл кратких ответов вместо большого учебного рубрикатора.
Старые клиенты без этого флага сохраняют прежнее поведение.

Проверки: `npm run build`, `npm run test:unit`; из `backend/` —
`.venv/bin/python -m unittest test_mvp.py`. Тесты используют имитацию ответов модели.

Аналитика: задай `VITE_METRIKA_ID` (счётчик Яндекс.Метрики) — события ядра
(case_started, coach_used, evaluate_received и др.) начнут отправляться автоматически.
Backend защищён rate limiting (настройки `RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_LLM_PER_MINUTE`),
`/debug/settings` доступен только при `DEBUG=1`.

Прогресс синхронизируется с сервером: анонимный аккаунт создаётся автоматически,
данные хранятся в SQLite (`DB_PATH`, по умолчанию `backend/data/app.db`).
На Render подключи Persistent Disk и укажи `DB_PATH` на него — иначе база
обнулится при redeploy. Перенос прогресса на другое устройство — кнопки
«⇄ код» / «ввести» в сайдбаре PMQuest (код действует 10 минут).

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

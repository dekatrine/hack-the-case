# Deploy

Проект удобнее всего выкладывать на Render как два отдельных сервиса:

- `hack-the-case-api` — FastAPI backend
- `hack-the-case-web` — статический frontend на Vite

В репозитории уже есть готовый [`render.yaml`](./render.yaml), поэтому ручная настройка минимальная.

## Что подготовить

1. Залить проект в GitHub, GitLab или Bitbucket.
2. Проверить, что в репозитории нет `Secrets.toml`.
3. Убедиться, что Yandex Cloud ключ и folder id готовы.

## Deploy на Render

1. Открой Render Dashboard.
2. Нажми `New` -> `Blueprint`.
3. Подключи репозиторий и выбери ветку с этим проектом.
4. Render прочитает [`render.yaml`](./render.yaml) и создаст два сервиса.

После первого деплоя задай переменные окружения:

### Backend: `hack-the-case-api`

- `YANDEX_API_KEY` — ключ API
- `YANDEX_FOLDER_ID` — folder id
- `YANDEX_MODEL` — например `yandexgpt-lite`
- `ALLOWED_ORIGINS` — адрес фронтенда через запятую

Пример:

```env
ALLOWED_ORIGINS=https://hack-the-case-web.onrender.com,https://your-domain.com
```

### Frontend: `hack-the-case-web`

- `VITE_API_BASE_URL` — публичный URL backend

Пример:

```env
VITE_API_BASE_URL=https://hack-the-case-api.onrender.com
```

После обновления env-переменных сделай redeploy frontend, чтобы Vite встроил новый `VITE_API_BASE_URL` в production build.

## Кастомные домены

Рекомендуемая схема:

- frontend: `https://your-domain.com`
- backend: `https://api.your-domain.com`

Тогда значения будут такими:

```env
VITE_API_BASE_URL=https://api.your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
```

## Что уже настроено

- backend стартует через `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- backend healthcheck: `/health`
- frontend собирается через `npm ci && npm run build`
- для SPA добавлен rewrite `/* -> /index.html`

## Локальная проверка перед деплоем

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

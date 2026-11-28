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
- `ALLOWED_ORIGIN_REGEX` — regex для Render-доменов фронтенда, если у сервиса URL с суффиксом

Пример:

```env
ALLOWED_ORIGINS=https://hack-the-case-web.onrender.com,https://your-domain.com
ALLOWED_ORIGIN_REGEX=https://hack-the-case-web(-[a-z0-9]+)?\.onrender\.com
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
ALLOWED_ORIGIN_REGEX=
```

## Что уже настроено

- backend стартует через `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- backend healthcheck: `/health`
- frontend собирается из корня репозитория через `npm ci && npm run build`
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
npm ci
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Важно: `render.yaml` собирает frontend из корня репозитория. Папка `frontend/` сейчас является старой копией и не участвует в деплое на Render.

## Пилот со студентами: что настроить на Render

1. **Бесплатная база Postgres (рекомендуется для пилота).** Создай проект на neon.tech (или supabase.com), скопируй строку подключения вида `postgresql://user:pass@host/db?sslmode=require`. В Render, сервис `hack-the-case-api`, Environment, добавь переменную `DATABASE_URL` с этой строкой и нажми Manual Deploy. Таблицы создаются сами при первом запуске. Проверка: открой сайт, пройди собес, перезапусти сервис (Manual Deploy), запись должна остаться (в панели Neon, Tables → `interview_runs`). Строка содержит пароль: не публикуй её и не коммить в репозиторий.
1a. **Или диск для SQLite (платный вариант).** На бесплатном плане файловая система стирается при каждом перезапуске, поэтому серверные копии собесов пропадают. В сервисе `hack-the-case-api` нужен план Starter и Disk (1 ГБ, путь `/var/data`), переменная `DB_PATH=/var/data/htc.sqlite3`. Это платные настройки, они не включены в `render.yaml` автоматически. Пока диска нет, прогресс надёжно хранится только в браузере студента; для этого есть кнопка «Сохранить в файл» на экране «Прогресс».
2. **Без усыпления.** На бесплатном плане API засыпает через 15 минут. Workflow `.github/workflows/keep-alive.yml` пингует `/health` каждые 10 минут. На платном плане его можно отключить.
3. **Лимиты ИИ.** `RATE_LIMIT_LLM_PER_MINUTE` (по умолчанию 10) считается на студента (заголовок `X-Client-Id`), а не на IP университета. Потолок на IP в 8 раз выше. Если запросы идут с одного адреса у 30 человек, оставь значения по умолчанию.
4. **Метрика.** Для статистики пилота задай `VITE_METRIKA_ID` у статического сервиса и пересобери.

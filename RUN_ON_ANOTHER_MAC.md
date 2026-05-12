# Запуск Hack the Case на другом компьютере

Нужны: Git, Node.js 18+, Python 3.11+, файл `Secrets.toml` с ключами YandexGPT.

---

## 1. Клонировать репозиторий

```bash
git clone https://github.com/dekatrine/hack-the-case.git
cd hack-the-case
```

---

## 2. Создать файл с секретами

В корне проекта создать файл `Secrets.toml` (не добавлять в git — он в `.gitignore`):

```toml
YANDEX_API_KEY = "..."
YANDEX_FOLDER_ID = "..."
YANDEX_MODEL = "yandexgpt-lite"
ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
```

---

## 3. Запустить backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend доступен на `http://127.0.0.1:8000`. Проверить: `http://127.0.0.1:8000/health`

---

## 4. Запустить frontend (в новом окне терминала)

```bash
cd ..                 # вернуться в корень hack-the-case
npm install
npm run dev
```

Откроется на `http://localhost:5173`

---

## Структура проекта

```
hack-the-case/
├── main.jsx          # React-приложение (основной UI)
├── styles.css        # стили
├── api/client.js     # API-клиент
├── quizData.js       # вопросы для практики
├── tracks.py         # учебные направления и главы
├── backend/          # FastAPI + YandexGPT
│   ├── app/main.py   # API endpoints
│   └── requirements.txt
├── Secrets.toml      # НЕ в git — создать вручную из Secrets.example.toml
└── render.yaml       # конфиг деплоя на Render
```

---

## Что передать другому человеку

- ссылка на репо: `https://github.com/dekatrine/hack-the-case`
- файл `Secrets.toml` с рабочими ключами YandexGPT (передать отдельно, не через git)
- эта инструкция

# Запуск Hack the Case на другом Mac

Для запуска нужны:

- доступ к репозиторию GitHub
- файл `Secrets.toml` или значения API-ключей
- Node.js и Python 3

## 1. Забрать проект

```bash
cd ~/Desktop
git clone https://github.com/dekatrine/hack-the-case.git
cd hack-the-case
```

Если у человека настроен SSH-доступ к GitHub, можно использовать:

```bash
git clone git@github.com:dekatrine/hack-the-case.git
```

## 2. Создать файл с секретами

В корне проекта создать файл `Secrets.toml`:

```toml
YANDEX_API_KEY = "..."
YANDEX_FOLDER_ID = "..."
YANDEX_MODEL = "yandexgpt-lite"
```

Можно вместо этого передать готовый файл `Secrets.toml`. Не добавляйте этот файл в git.

## 3. Запустить backend

```bash
cd ~/Desktop/hack-the-case/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173 .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend будет доступен на:

```text
http://127.0.0.1:8000
```

## 4. Запустить старый интерфейс

В новом окне терминала:

```bash
cd ~/Desktop/hack-the-case/frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Старый UI откроется на:

```text
http://127.0.0.1:5173/
```

## 5. Запустить новый интерфейс v0.2

Еще в одном окне терминала:

```bash
cd ~/Desktop/hack-the-case
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Новый UI откроется на:

```text
http://127.0.0.1:4173/
```

Если нужен только один интерфейс, второй можно не запускать.

## Что передать человеку

- репозиторий: `https://github.com/dekatrine/hack-the-case.git`
- или SSH: `git@github.com:dekatrine/hack-the-case.git`
- файл `Secrets.toml` или отдельно значения `YANDEX_API_KEY`, `YANDEX_FOLDER_ID`, `YANDEX_MODEL`
- эту инструкцию

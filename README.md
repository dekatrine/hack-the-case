# Hack the Case — AI-симулятор решения бизнес-кейсов

AI-ассистент, который учит думать, а не решает за тебя.

## Быстрый старт (локально)

```bash
pip install -r requirements.txt
```

Создай файл `.streamlit/secrets.toml` (по примеру `secrets.toml.example`):

```toml
YANDEX_API_KEY = "твой-api-key"
YANDEX_FOLDER_ID = "твой-folder-id"
YANDEX_MODEL = "yandexgpt-lite"
```

Запуск:

```bash
streamlit run app.py
```

## Деплой на Streamlit Community Cloud

1. Залей проект в GitHub-репозиторий (публичный или приватный)
2. Зайди на [share.streamlit.io](https://share.streamlit.io)
3. Нажми **New app** → выбери репозиторий → укажи `app.py`
4. Перейди в **Settings → Secrets** и вставь:

```toml
YANDEX_API_KEY = "твой-api-key"
YANDEX_FOLDER_ID = "твой-folder-id"
YANDEX_MODEL = "yandexgpt-lite"
```

5. Нажми **Deploy** — через пару минут приложение будет доступно по ссылке

## Где взять API-ключ Yandex Cloud

1. Зайди в [console.yandex.cloud](https://console.yandex.cloud)
2. Создай сервисный аккаунт с ролью `ai.languageModels.user`
3. Создай API-ключ для этого сервисного аккаунта
4. `folder_id` — ID каталога в Yandex Cloud (виден в URL консоли)

## Структура приложения

- **Генерация кейса** — AI создаёт уникальный кейс по отрасли и сложности
- **9 этапов решения** — Issue Tree → Ресёрч → Сегментация → CJM → Инициативы → Метрики → Экономика → Риски → Roadmap
- **AI Coach** — на каждом этапе задаёт наводящие вопросы, не даёт готовых ответов
- **Rubric-жюри** — оценка по 10 критериям (1-10 баллов каждый)

## Модели YandexGPT

- `yandexgpt-lite` — быстрая, дешевле (рекомендуется для прототипа)
- `yandexgpt` — полная модель, качественнее
- `yandexgpt-32k` — для длинного контекста

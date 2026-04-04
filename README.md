# Hack the Case — AI-симулятор решения бизнес-кейсов

Прототип на Streamlit, который помогает студенту решать бизнес-кейсы по этапам и получать фидбек от AI-коуча и rubric-жюри.

## Что улучшено в этой версии

- более стабильный вызов YandexGPT: retry + backoff + понятные сообщения об ошибках;
- безопасная работа с секретами через `st.secrets`;
- улучшенный UX без смены платформы: stepper, подсказки по этапам, более чистый экран оценки;
- мягкий fallback при ошибке JSON-оценки: приложение не падает, а показывает сырой текст ответа;
- более аккуратная структура состояния через `st.session_state`.

## Локальный запуск

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Секреты

Локально создай файл:

```bash
.streamlit/secrets.toml
```

Пример содержимого смотри в `secrets.toml.example`.

### Важно

- не коммить реальный `secrets.toml` в Git;
- в Streamlit Community Cloud добавляй секреты только через **App Settings → Secrets**.

## Пример `.streamlit/secrets.toml`

```toml
YANDEX_API_KEY = "your-api-key"
YANDEX_FOLDER_ID = "your-folder-id"
YANDEX_MODEL = "yandexgpt-lite"
```

## Структура приложения

- генерация кейса;
- 9 этапов решения;
- AI Coach для каждого этапа;
- итоговая rubric-оценка с текстом и графиком.

## Безопасный деплой

1. Делай изменения в отдельной ветке, например `dev`.
2. Подними отдельный staging-app на Streamlit Community Cloud.
3. Проверь генерацию кейса, коуча и экран оценки.
4. Только после этого мержи в `main`.
5. Если после релиза что-то пошло не так, сделай rollback на предыдущий стабильный коммит и reboot app.

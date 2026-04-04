# Hack the Case

AI-симулятор решения бизнес-кейсов на Streamlit + YandexGPT.

## Что обновлено

- более чистый и собранный интерфейс;
- структурированная карточка кейса вместо длинного полотна текста;
- учебный UX на каждом шаге: цель этапа, типичная ошибка, подсказка из условия;
- улучшенный AI Coach с быстрыми действиями;
- более надежный вызов YandexGPT с retry/backoff;
- структурированный экран итоговой оценки с JSON fallback;
- radar chart для результатов rubric-жюри.

## Локальный запуск

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Secrets

Локально создай файл `.streamlit/secrets.toml` по образцу `secrets.toml.example`.

```toml
YANDEX_API_KEY = "your-yandex-api-key"
YANDEX_FOLDER_ID = "your-folder-id"
YANDEX_MODEL = "yandexgpt-lite"
```

Для Streamlit Community Cloud добавь те же значения в **App settings → Secrets**.

## Важно

Не коммить реальные ключи в репозиторий. Если ключ уже оказался в открытом доступе, его нужно перевыпустить.

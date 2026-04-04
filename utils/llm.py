"""
utils/llm.py — Вызов YandexGPT API с retry-логикой и логированием
"""

import streamlit as st
import requests
import time
import json
import logging

logger = logging.getLogger("hack_the_case")

YANDEX_GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

MAX_RETRIES = 3
RETRY_BACKOFF = [2, 5, 10]  # секунды между попытками


def get_api_credentials():
    """Получить ключи из Streamlit secrets."""
    api_key = st.secrets.get("YANDEX_API_KEY", "")
    folder_id = st.secrets.get("YANDEX_FOLDER_ID", "")
    model = st.secrets.get("YANDEX_MODEL", "yandexgpt-lite")
    return api_key, folder_id, model


def call_yandex_gpt(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.6,
    max_tokens: int = 4000,
    retries: int = MAX_RETRIES,
) -> str:
    """
    Вызов YandexGPT API с retry-логикой и exponential backoff.
    
    Улучшения по сравнению с оригиналом:
    - 3 попытки при ошибках сети / 5xx
    - Exponential backoff (2s, 5s, 10s)
    - Логирование каждого вызова (для курсовой)
    - Корректная обработка разных типов ошибок
    """
    api_key, folder_id, model = get_api_credentials()

    if not api_key or not folder_id:
        return "⚠️ Не заданы YANDEX_API_KEY и YANDEX_FOLDER_ID. Добавьте их в Settings → Secrets на Streamlit Cloud."

    model_uri = f"gpt://{folder_id}/{model}/latest"

    headers = {
        "Authorization": f"Api-Key {api_key}",
        "Content-Type": "application/json",
    }

    body = {
        "modelUri": model_uri,
        "completionOptions": {
            "stream": False,
            "temperature": temperature,
            "maxTokens": max_tokens,
        },
        "messages": [
            {"role": "system", "text": system_prompt},
            {"role": "user", "text": user_prompt},
        ],
    }

    start_time = time.time()
    last_error = None

    for attempt in range(retries):
        try:
            resp = requests.post(
                YANDEX_GPT_URL, headers=headers, json=body, timeout=90
            )
            resp.raise_for_status()
            data = resp.json()
            result = data["result"]["alternatives"][0]["message"]["text"]

            # Логируем успешный вызов
            elapsed = time.time() - start_time
            logger.info(
                f"LLM call OK | attempt={attempt+1} | "
                f"temp={temperature} | tokens={max_tokens} | "
                f"time={elapsed:.1f}s | response_len={len(result)}"
            )

            # Сохраняем статистику в session_state для курсовой
            if "llm_stats" not in st.session_state:
                st.session_state.llm_stats = []
            st.session_state.llm_stats.append({
                "timestamp": time.time(),
                "temperature": temperature,
                "response_len": len(result),
                "elapsed": elapsed,
                "attempts": attempt + 1,
            })

            return result

        except requests.exceptions.HTTPError as e:
            status = resp.status_code if resp else "?"
            last_error = f"HTTP {status}: {resp.text[:200] if resp else str(e)}"
            
            # 4xx ошибки — не ретраим (кроме 429)
            if resp and 400 <= resp.status_code < 500 and resp.status_code != 429:
                logger.error(f"LLM client error (no retry): {last_error}")
                return f"⚠️ Ошибка API ({status}): {last_error}"
            
            logger.warning(
                f"LLM error (attempt {attempt+1}/{retries}): {last_error}"
            )

        except requests.exceptions.Timeout:
            last_error = "Таймаут (90с)"
            logger.warning(f"LLM timeout (attempt {attempt+1}/{retries})")

        except requests.exceptions.ConnectionError:
            last_error = "Ошибка соединения"
            logger.warning(f"LLM connection error (attempt {attempt+1}/{retries})")

        except Exception as e:
            last_error = str(e)
            logger.error(f"LLM unexpected error: {last_error}")
            return f"⚠️ Неожиданная ошибка: {last_error}"

        # Backoff перед следующей попыткой
        if attempt < retries - 1:
            wait = RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)]
            time.sleep(wait)

    return f"⚠️ Не удалось получить ответ после {retries} попыток. Последняя ошибка: {last_error}"


def truncate_smart(text: str, max_chars: int) -> str:
    """
    Умная обрезка текста — не режет посередине предложения.
    
    Исправляет проблему оригинала: case_text[:1500] мог обрезать
    на полуслове, теряя контекст.
    """
    if len(text) <= max_chars:
        return text
    
    # Ищем последнюю точку/перенос строки до лимита
    truncated = text[:max_chars]
    last_period = max(
        truncated.rfind(". "),
        truncated.rfind(".\n"),
        truncated.rfind("\n\n"),
    )
    
    if last_period > max_chars * 0.7:  # Не обрезаем слишком много
        return truncated[:last_period + 1]
    
    # Фолбэк — ищем пробел
    last_space = truncated.rfind(" ")
    if last_space > max_chars * 0.8:
        return truncated[:last_space] + "..."
    
    return truncated + "..."

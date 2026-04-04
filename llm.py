"""
Hack the Case — LLM-модуль
YandexGPT API с retry-логикой и контекстной памятью между этапами.
"""

import streamlit as st
import requests
import time
import json
import logging

logger = logging.getLogger(__name__)

YANDEX_GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"


def get_api_credentials():
    api_key = st.secrets.get("YANDEX_API_KEY", "")
    folder_id = st.secrets.get("YANDEX_FOLDER_ID", "")
    model = st.secrets.get("YANDEX_MODEL", "yandexgpt-lite")
    return api_key, folder_id, model


def call_yandex_gpt(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.6,
    max_tokens: int = 4000,
    max_retries: int = 3,
) -> str:
    """
    Вызов YandexGPT API с exponential backoff retry.
    При 3 неудачных попытках возвращает fallback-сообщение.
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

    last_error = None
    for attempt in range(max_retries):
        try:
            resp = requests.post(YANDEX_GPT_URL, headers=headers, json=body, timeout=90)
            resp.raise_for_status()
            data = resp.json()
            return data["result"]["alternatives"][0]["message"]["text"]
        except requests.exceptions.Timeout:
            last_error = "Таймаут запроса"
            logger.warning(f"YandexGPT timeout, attempt {attempt + 1}/{max_retries}")
        except requests.exceptions.HTTPError as e:
            status = resp.status_code if resp else "?"
            last_error = f"HTTP {status}"
            logger.warning(f"YandexGPT HTTP error {status}, attempt {attempt + 1}/{max_retries}")
            if status == 429:  # rate limit
                time.sleep(2 ** (attempt + 1))
                continue
            if 400 <= status < 500 and status != 429:
                break  # client error, don't retry
        except Exception as e:
            last_error = str(e)
            logger.error(f"YandexGPT error: {e}, attempt {attempt + 1}/{max_retries}")

        # Exponential backoff
        if attempt < max_retries - 1:
            time.sleep(2 ** attempt)

    return f"⚠️ Не удалось получить ответ от AI после {max_retries} попыток ({last_error}). Попробуй ещё раз через минуту."


# ─────────────────────────────────────────────
# КОНТЕКСТНАЯ ПАМЯТЬ МЕЖДУ ЭТАПАМИ
# ─────────────────────────────────────────────

def build_previous_steps_summary(step_answers: dict, case_steps: list, current_step_id: str) -> str:
    """
    Формирует краткое саммари ответов на предыдущие этапы.
    Коуч на этапе 5 будет знать, что студент написал на этапах 1-4.
    """
    summary_parts = []
    for step in case_steps:
        if step["id"] == current_step_id:
            break
        answer = step_answers.get(step["id"], "")
        if answer.strip():
            # Обрезаем до 300 символов для экономии контекста
            truncated = answer[:300] + "..." if len(answer) > 300 else answer
            summary_parts.append(f"[{step['title']}]: {truncated}")

    if not summary_parts:
        return ""

    return "Ответы студента на предыдущие этапы:\n" + "\n".join(summary_parts)


def build_coach_context(
    step: dict,
    case_text: str,
    answer_text: str,
    chat_history: list,
    user_message: str,
    step_answers: dict,
    case_steps: list,
) -> str:
    """
    Формирует полный контекст для коуча: кейс + предыдущие этапы + текущий ответ + история чата.
    """
    prev_summary = build_previous_steps_summary(step_answers, case_steps, step["id"])

    context = f"""Кейс: {case_text[:1500]}

Текущий этап: {step['title']}
Рекомендуемые фреймворки: {', '.join(step['frameworks'])}"""

    if prev_summary:
        context += f"\n\n{prev_summary}"

    context += f"""

Ответ студента на текущий блок:
{answer_text if answer_text.strip() else '(студент ещё не написал ответ)'}

Последние сообщения:
{chr(10).join([f"{'Студент' if m['role']=='student' else 'Коуч'}: {m['text']}" for m in chat_history[-6:]])}

Сообщение студента: {user_message}"""

    return context


# ─────────────────────────────────────────────
# ПАРСИНГ JSON-ОЦЕНКИ
# ─────────────────────────────────────────────

def parse_rubric_json(raw_text: str) -> dict | None:
    """
    Парсит JSON-ответ от rubric-жюри.
    Пробует несколько стратегий: чистый JSON, извлечение из markdown, fallback.
    """
    # Стратегия 1: чистый JSON
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    # Стратегия 2: извлечь JSON из ```json ... ``` блока
    import re
    json_match = re.search(r'```json\s*(.*?)\s*```', raw_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Стратегия 3: найти первый { ... } блок
    brace_start = raw_text.find('{')
    brace_end = raw_text.rfind('}')
    if brace_start != -1 and brace_end > brace_start:
        try:
            return json.loads(raw_text[brace_start:brace_end + 1])
        except json.JSONDecodeError:
            pass

    # Не удалось распарсить
    return None

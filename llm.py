import json
import logging
import time

import requests

from .config import get_settings

logger = logging.getLogger(__name__)

YANDEX_GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"


def call_yandex_gpt(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.6,
    max_tokens: int = 4000,
    max_retries: int = 3,
) -> str:
    settings = get_settings()

    if not settings.yandex_api_key or not settings.yandex_folder_id:
        raise RuntimeError("YANDEX_API_KEY and YANDEX_FOLDER_ID are required")

    model_uri = f"gpt://{settings.yandex_folder_id}/{settings.yandex_model}/latest"
    headers = {
        "Authorization": f"Api-Key {settings.yandex_api_key}",
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
            response = requests.post(YANDEX_GPT_URL, headers=headers, json=body, timeout=90)
            response.raise_for_status()
            data = response.json()
            return data["result"]["alternatives"][0]["message"]["text"]
        except requests.exceptions.Timeout:
            last_error = "таймаут запроса"
        except requests.exceptions.HTTPError:
            status = response.status_code if "response" in locals() else "?"
            response_text = response.text[:1000] if "response" in locals() else ""
            last_error = f"HTTP {status}: {response_text}"
            if isinstance(status, int) and 400 <= status < 500 and status != 429:
                break
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            last_error = f"неожиданный ответ API: {exc}"
            break
        except requests.exceptions.RequestException as exc:
            last_error = str(exc)

        logger.warning("YandexGPT call failed: %s, attempt %s/%s", last_error, attempt + 1, max_retries)
        if attempt < max_retries - 1:
            time.sleep(2**attempt)

    raise RuntimeError(f"Не удалось получить ответ от YandexGPT: {last_error}")

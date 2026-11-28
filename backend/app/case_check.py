"""Deterministic consistency check for LLM-generated case text.

The model sometimes drops sections, truncates mid-sentence, or ships a
"Данные" block with no numbers. A student then gets a case that cannot be
solved. We check the structure and retry once before giving up."""

import re

REQUIRED = ("Проблема", "Данные")
QUESTION = ("Вопрос", "Задача")


def _section(text: str, name: str) -> str:
    match = re.search(
        rf"\*\*{name}[^*\n]*\*\*:?\s*(.*?)(?=\n\s*\*\*[^*\n]+\*\*|\Z)", text, re.S | re.I
    )
    return match.group(1).strip() if match else ""


def case_problems(text: str) -> list[str]:
    """Return human-readable problems; empty list means the case is usable."""
    problems = []
    # Free-form text with no section headers at all: nothing to check against.
    if not re.search(r"\*\*(Проблема|Данные|Вопрос|Задача)", text, re.I):
        return problems
    for name in REQUIRED:
        if len(_section(text, name)) < 3:
            problems.append(f"нет раздела «{name}»")
    data = _section(text, "Данные")
    if data and len(re.findall(r"\d+(?:[.,]\d+)?", data)) < 5:
        problems.append("в данных меньше пяти чисел")
    question = next((q for q in (_section(text, n) for n in QUESTION) if q), "")
    if not question:
        problems.append("нет раздела «Вопрос» или «Задача»")
    elif not re.search(r"[?]|[Оо]пределите|[Рр]екомендуйте|[Вв]ыберите|[Рр]еши|[Оо]бъясни|[Пп]редложите", question):
        problems.append("вопрос не сформулирован как задача")
    if text.strip() and not re.search(r"[.!?»)\d]\s*$", text.strip()):
        problems.append("текст обрывается")
    return problems


def coherence_problem(text: str, call_model) -> str:
    """Ask the model whether title, conditions and question agree. Empty string = fine
    (or the check itself failed: a broken checker must never block generation)."""
    import json
    from app.prompts import CASE_COHERENCE_SYSTEM
    try:
        raw = call_model(CASE_COHERENCE_SYSTEM, text, temperature=0, max_tokens=80)
        parsed = json.loads(re.sub(r"^\s*```(?:json)?\s*|\s*```\s*$", "", raw))
    except Exception:
        return ""
    if isinstance(parsed, dict) and parsed.get("consistent") is False:
        return str(parsed.get("reason") or "вопрос не согласован с условием")
    return ""

from typing import Union

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .data import CASE_STEPS, COURSE_MODULES, DIFFICULTY_LEVELS, INDUSTRIES, SOURCE_NOTES
from .llm import call_yandex_gpt
from .prompts import CASE_GENERATION_SYSTEM, RUBRIC_SYSTEM, get_coach_system_prompt
from .schemas import CoachRequest, CoachResponse, EvaluateRequest, EvaluateResponse, GenerateCaseRequest, GenerateCaseResponse

app = FastAPI(title="Hack the Case API", version="0.1.0")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/debug/settings")
def debug_settings() -> dict[str, Union[str, bool]]:
    settings = get_settings()
    return {
        "hasApiKey": bool(settings.yandex_api_key),
        "apiKeyPrefix": settings.yandex_api_key[:6] if settings.yandex_api_key else "",
        "apiKeySuffix": settings.yandex_api_key[-4:] if settings.yandex_api_key else "",
        "folderId": settings.yandex_folder_id,
        "model": settings.yandex_model,
        "modelUri": f"gpt://{settings.yandex_folder_id}/{settings.yandex_model}/latest",
    }


@app.get("/api/config")
def get_app_config() -> dict:
    return {
        "steps": CASE_STEPS,
        "industries": INDUSTRIES,
        "difficultyLevels": DIFFICULTY_LEVELS,
        "courseModules": COURSE_MODULES,
        "sourceNotes": SOURCE_NOTES,
    }


@app.post("/api/cases/generate", response_model=GenerateCaseResponse)
def generate_case(payload: GenerateCaseRequest) -> GenerateCaseResponse:
    prompt = (
        f"Сгенерируй бизнес-кейс.\n"
        f"Отрасль: {payload.industry}\n"
        f"Сложность: {payload.difficulty} — {DIFFICULTY_LEVELS.get(payload.difficulty, '')}"
    )
    if payload.extraContext.strip():
        prompt += f"\nДополнительный контекст: {payload.extraContext.strip()}"

    try:
        case_text = call_yandex_gpt(CASE_GENERATION_SYSTEM, prompt, temperature=0.8)
        return GenerateCaseResponse(caseText=case_text)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/api/coach", response_model=CoachResponse)
def ask_coach(payload: CoachRequest) -> CoachResponse:
    context = build_coach_context(payload)
    try:
        message = call_yandex_gpt(
            get_coach_system_prompt(payload.stepId),
            context,
            temperature=0.5,
        )
        return CoachResponse(message=message)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/api/evaluate", response_model=EvaluateResponse)
def evaluate(payload: EvaluateRequest) -> EvaluateResponse:
    answers_summary = []
    for step in CASE_STEPS:
        answer = payload.answers.get(step["id"], "").strip()
        answers_summary.append(f"### {step['title']}\n{answer or '(пропущено)'}")

    prompt = f"""Оцени решение бизнес-кейса.

КЕЙС:
{payload.caseText[:3000]}

РЕШЕНИЕ СТУДЕНТА:
{chr(10).join(answers_summary)}
"""
    try:
        evaluation = call_yandex_gpt(RUBRIC_SYSTEM, prompt, temperature=0.3)
        return EvaluateResponse(evaluation=evaluation)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


def build_coach_context(payload: CoachRequest) -> str:
    previous = []
    for step in CASE_STEPS:
        if step["id"] == payload.stepId:
            break
        answer = payload.previousAnswers.get(step["id"], "").strip()
        if answer:
            previous.append(f"- {step['title']}: {answer[:500]}")

    history = [
        f"{'Студент' if message.role == 'student' else 'Коуч'}: {message.text}"
        for message in payload.chatHistory[-6:]
    ]

    return f"""КЕЙС:
{payload.caseText[:3000]}

ТЕКУЩИЙ ЭТАП:
{payload.stepTitle}
Цель: {payload.stepDescription}
Фреймворки: {', '.join(payload.frameworks)}
Подсказка: {payload.caseHint}
Теория этапа: {payload.theory if payload.theory else '(нет)'}

ПРЕДЫДУЩИЕ ОТВЕТЫ:
{chr(10).join(previous) if previous else '(пока нет)'}

ОТВЕТ СТУДЕНТА НА ТЕКУЩИЙ БЛОК:
{payload.answerText.strip() or '(студент ещё не написал ответ)'}

ИСТОРИЯ ДИАЛОГА:
{chr(10).join(history) if history else '(пока нет)'}

СООБЩЕНИЕ СТУДЕНТА:
{payload.userMessage}
"""

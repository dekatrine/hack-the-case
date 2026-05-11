import importlib.util
from pathlib import Path
from typing import Union

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .data import CASE_STEPS, COURSE_MODULES, DIFFICULTY_LEVELS, INDUSTRIES, SOURCE_NOTES
from .llm import call_yandex_gpt
from .prompts import CASE_GENERATION_SYSTEM, INTERVIEW_GENERATION_SYSTEM, RUBRIC_SYSTEM, get_coach_system_prompt
from .schemas import (
    CoachRequest,
    CoachResponse,
    EvaluateRequest,
    EvaluateResponse,
    GenerateCaseRequest,
    GenerateCaseResponse,
    GenerateInterviewRequest,
    GenerateInterviewResponse,
)


def load_tracks() -> list[dict]:
    tracks_path = Path(__file__).resolve().parents[2] / "tracks.py"
    spec = importlib.util.spec_from_file_location("hack_the_case_tracks", tracks_path)
    if spec is None or spec.loader is None:
        return []
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return getattr(module, "TRACKS", [])

app = FastAPI(title="Hack the Case API", version="0.1.0")

settings = get_settings()
TRACKS = load_tracks()
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
        "tracks": TRACKS,
    }


@app.post("/api/cases/generate", response_model=GenerateCaseResponse)
def generate_case(payload: GenerateCaseRequest) -> GenerateCaseResponse:
    track = next((item for item in TRACKS if item.get("id") == payload.trackId), None)
    track_name = track["name"] if track else "Бизнес-кейсы"
    case_kind = (
        "продуктовый кейс для PM-интервью"
        if payload.trackId == "product"
        else "бизнес-кейс для консалтинга и кейс-чемпионатов"
    )
    prompt = (
        f"Сгенерируй условие кейса, не решение.\n"
        f"Направление: {track_name}\n"
        f"Тип: {case_kind}\n"
        f"Отрасль: {payload.industry}\n"
        f"Сложность: {payload.difficulty} — {DIFFICULTY_LEVELS.get(payload.difficulty, '')}"
    )
    if payload.trackId == "product":
        prompt += (
            "\nСделай вводную похожей на PM case interview: продукт, пользовательский сегмент, "
            "метрика, боль, ограничения, данные по воронке или retention и конкретный вопрос."
        )
    else:
        prompt += (
            "\nСделай вводную похожей на consulting case: клиент, рынок, экономика, "
            "операционные ограничения, численные данные и конкретный decision question."
        )
    if payload.extraContext.strip():
        prompt += f"\nДополнительный контекст: {payload.extraContext.strip()}"

    try:
        case_text = call_yandex_gpt(CASE_GENERATION_SYSTEM, prompt, temperature=0.8)
        return GenerateCaseResponse(caseText=case_text)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/api/interviews/generate", response_model=GenerateInterviewResponse)
def generate_interview(payload: GenerateInterviewRequest) -> GenerateInterviewResponse:
    direction = "product direction" if payload.directionId == "product" else "consulting direction"
    block_labels = {
        "product_sense": "Product sense / product design",
        "product_execution": "Execution / analytics / root cause",
        "product_strategy": "Product strategy / monetization / roadmap",
        "consulting_opening": "Opening, clarifying questions and case structuring",
        "consulting_math": "Exhibit, case math and unit economics",
        "consulting_recommendation": "Recommendation, risks and implementation",
    }
    prompt = (
        "Сгенерируй одну новую задачу для mock interview.\n"
        f"Направление: {direction}\n"
        f"Блок интервью: {block_labels.get(payload.blockId, payload.blockId)}\n"
        f"Сложность: {payload.difficulty}\n"
    )
    if payload.companyContext.strip():
        prompt += f"Контекст компании или продукта: {payload.companyContext.strip()}\n"
    prompt += (
        "Сделай задачу похожей на реальный live interview: интервьюер постепенно проверяет "
        "структуру, аналитику, здравый смысл и финальный синтез."
    )

    try:
        task_text = call_yandex_gpt(INTERVIEW_GENERATION_SYSTEM, prompt, temperature=0.75)
        return GenerateInterviewResponse(taskText=task_text)
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

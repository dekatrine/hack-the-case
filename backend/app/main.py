import importlib.util
import json
import re
from pathlib import Path
from typing import Optional, Union

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .data import CASE_STEPS, COURSE_MODULES, DIFFICULTY_LEVELS, INDUSTRIES, SOURCE_NOTES
from .llm import call_yandex_gpt
from .prompts import (
    CASE_GENERATION_SYSTEM,
    INTERVIEW_CHECK_SYSTEM,
    INTERVIEW_COACH_SYSTEM,
    INTERVIEW_FINAL_SYSTEM,
    INTERVIEW_GENERATION_SYSTEM,
    PHASE_GENERATION_SYSTEM,
    RUBRIC_SYSTEM,
    STEP_SELECTION_SYSTEM,
    get_coach_system_prompt,
)
from .schemas import (
    CasePhase,
    CheckInterviewRequest,
    CheckInterviewResponse,
    CoachRequest,
    CoachResponse,
    EvaluateRequest,
    EvaluateResponse,
    GenerateCaseRequest,
    GenerateCaseResponse,
    GenerateInterviewRequest,
    GenerateInterviewResponse,
    LearnExplainRequest,
    LearnExplainResponse,
    LearnSessionRequest,
    LearnSessionResponse,
    PhaseQuestion,
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
    allow_origin_regex=settings.allowed_origin_regex,
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
        "allowedOriginRegex": settings.allowed_origin_regex,
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

        # AI-маршрут (phases + step selection) — только для product-трека.
        # Для business-трека возвращаем кейс «как есть»: фронт использует
        # статические stepIds из track.chapters.
        if payload.trackId == "product":
            phases = generate_phases_for_case(
                case_text=case_text,
                track_id=payload.trackId,
                track_name=track_name,
                interview_type=payload.interviewType,
                grade=payload.grade,
            )
            if phases:
                suggested_step_ids: list[str] = []
            else:
                suggested_step_ids = pick_steps_for_case(
                    case_text=case_text,
                    track_id=payload.trackId,
                    track_name=track_name,
                )
        else:
            phases = []
            suggested_step_ids = []

        return GenerateCaseResponse(
            caseText=case_text,
            suggestedStepIds=suggested_step_ids,
            phases=phases,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


def pick_steps_for_case(*, case_text: str, track_id: Optional[str], track_name: str) -> list[str]:
    """Спросить у LLM, какие шаги из каталога CASE_STEPS подходят к данному кейсу.

    Возвращает упорядоченный список stepIds. Если LLM не справился — пустой
    список (фронт упадёт на статические step_ids трека)."""
    allowed_ids = [step["id"] for step in CASE_STEPS]
    catalog_lines = []
    for step in CASE_STEPS:
        title = step.get("title", "")
        description = step.get("description", "")
        catalog_lines.append(f"- {step['id']}: {title} — {description}")
    catalog = "\n".join(catalog_lines)

    prompt = (
        f"Направление: {track_name}\n"
        f"Тип трека: {track_id or 'business'}\n\n"
        f"Каталог доступных шагов (выбирай только из этих id):\n{catalog}\n\n"
        f"Текст кейса:\n{case_text[:4000]}\n\n"
        "Собери маршрут из 5–7 шагов, который ПОЛНОСТЬЮ раскрывает решение именно этого кейса: "
        "вход → анализ контекста → диагностика → решение → синтез. Каждый шаг должен быть конкретно "
        "про этот кейс, без общих «на всякий случай». final_synthesis обязателен в конце. "
        "Верни строго JSON с полем stepIds."
    )

    try:
        raw = call_yandex_gpt(
            STEP_SELECTION_SYSTEM,
            prompt,
            temperature=0.2,
            max_tokens=400,
        )
    except RuntimeError:
        return []

    return _parse_step_ids(raw, allowed_ids)


MIN_PICKED_STEPS = 5
MAX_PICKED_STEPS = 7

MIN_PHASES = 5
MAX_PHASES = 7
MIN_QUESTIONS_PER_PHASE = 2
MAX_QUESTIONS_PER_PHASE = 4

INTERVIEW_TYPE_LABELS = {
    "product_sense": "Product Sense",
    "product_design": "Product Design",
    "product_execution": "Product Execution / Analytics",
    "product_strategy": "Product Strategy",
    "product_growth": "Product Growth",
    "profitability": "Consulting · Profitability",
    "market_entry": "Consulting · Market Entry",
    "pricing": "Consulting · Pricing",
    "growth_case": "Consulting · Growth",
    "ma": "Consulting · M&A",
}

GRADE_LABELS = {
    "junior": "Junior (1-2 года опыта)",
    "middle": "Middle (3-5 лет опыта)",
    "senior": "Senior (5+ лет, ownership)",
}


def generate_phases_for_case(
    *,
    case_text: str,
    track_id: Optional[str],
    track_name: str,
    interview_type: Optional[str],
    grade: Optional[str],
) -> list[CasePhase]:
    """Сгенерировать AI-фазы маршрута решения под конкретный кейс.

    Возвращает список из 5-7 фаз, каждая содержит 2-4 sub-вопроса.
    При ошибке/пустом ответе LLM — возвращает пустой список, и фронт
    падает на старые stepIds через suggestedStepIds."""
    interview_label = INTERVIEW_TYPE_LABELS.get(interview_type or "", interview_type or "")
    grade_label = GRADE_LABELS.get(grade or "", grade or "middle")

    prompt = (
        f"Направление: {track_name}\n"
        f"Тип трека: {track_id or 'business'}\n"
        f"Вид интервью: {interview_label or '(не выбран — подбери под содержание кейса)'}\n"
        f"Грейд кандидата: {grade_label}\n\n"
        f"Текст кейса:\n{case_text[:4000]}\n\n"
        "Собери маршрут из 5–7 фаз решения этого кейса. В каждой фазе — 2–4 sub-вопроса, "
        "конкретно про этот кейс. Финальная фаза — рекомендация и risks. Верни JSON с полем phases."
    )

    try:
        raw = call_yandex_gpt(
            PHASE_GENERATION_SYSTEM,
            prompt,
            temperature=0.3,
            max_tokens=2000,
        )
    except RuntimeError:
        return []

    return _parse_phases(raw)


def _parse_phases(raw: str) -> list[CasePhase]:
    """Распарсить ответ LLM в список CasePhase с валидацией."""
    if not raw:
        return []
    text = raw.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return []
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError:
        return []
    items = parsed.get("phases") or []
    if not isinstance(items, list):
        return []

    phases: list[CasePhase] = []
    seen_phase_ids: set[str] = set()
    for raw_phase in items:
        if not isinstance(raw_phase, dict):
            continue
        phase_id = str(raw_phase.get("id", "")).strip()
        title = str(raw_phase.get("title", "")).strip()
        if not phase_id or not title:
            continue
        # Гарантируем уникальность phase_id
        base_id = phase_id
        suffix = 2
        while phase_id in seen_phase_ids:
            phase_id = f"{base_id}_{suffix}"
            suffix += 1
        seen_phase_ids.add(phase_id)

        focus = str(raw_phase.get("focus", "")).strip()
        questions_raw = raw_phase.get("questions") or []
        if not isinstance(questions_raw, list):
            continue

        questions: list[PhaseQuestion] = []
        seen_q_ids: set[str] = set()
        for idx, raw_q in enumerate(questions_raw):
            if not isinstance(raw_q, dict):
                continue
            q_text = str(raw_q.get("text", "")).strip()
            if not q_text:
                continue
            q_id = str(raw_q.get("id", "") or f"q{idx + 1}").strip()
            if q_id in seen_q_ids:
                q_id = f"q{idx + 1}"
            seen_q_ids.add(q_id)
            q_hint = str(raw_q.get("hint", "")).strip()
            questions.append(PhaseQuestion(id=q_id, text=q_text, hint=q_hint))
            if len(questions) >= MAX_QUESTIONS_PER_PHASE:
                break

        if len(questions) < MIN_QUESTIONS_PER_PHASE:
            continue
        phases.append(CasePhase(id=phase_id, title=title, focus=focus, questions=questions))
        if len(phases) >= MAX_PHASES:
            break

    if len(phases) < MIN_PHASES:
        return []
    return phases


def _parse_step_ids(raw: str, allowed_ids: list[str]) -> list[str]:
    """Аккуратно вытащить stepIds из ответа LLM, ограничив их валидным каталогом.

    Маршрут должен раскрывать полное решение кейса: от 5 до 7 шагов.
    Если LLM прислал больше — обрезаем хвост (но сохраняем final_synthesis).
    Если LLM прислал меньше 5 — возвращаем пустой список, чтобы фронт
    фолбэкнулся на статические шаги трека."""
    if not raw:
        return []
    text = raw.strip()
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return []
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError:
        return []
    candidates = parsed.get("stepIds") or parsed.get("step_ids") or []
    if not isinstance(candidates, list):
        return []

    seen: set[str] = set()
    allowed_set = set(allowed_ids)
    ordered: list[str] = []
    for item in candidates:
        if not isinstance(item, str):
            continue
        step_id = item.strip()
        if step_id in allowed_set and step_id not in seen:
            seen.add(step_id)
            ordered.append(step_id)

    if len(ordered) < MIN_PICKED_STEPS:
        # маршрут не покрывает решение — пусть фронт уходит на fallback
        return []

    if len(ordered) > MAX_PICKED_STEPS:
        # Обрезаем хвост, но гарантируем, что final_synthesis (если был в выборе)
        # сохранится последним шагом маршрута.
        had_synthesis = "final_synthesis" in ordered
        trimmed = ordered[:MAX_PICKED_STEPS]
        if had_synthesis and "final_synthesis" not in trimmed:
            trimmed[-1] = "final_synthesis"
        ordered = trimmed

    return ordered


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


@app.post("/api/interviews/check", response_model=CheckInterviewResponse)
def check_interview_answer(payload: CheckInterviewRequest) -> CheckInterviewResponse:
    previous = [
        f"- {key}: {value[:500]}"
        for key, value in payload.previousAnswers.items()
        if value.strip()
    ]

    if payload.mode == "final":
        answers_block = (
            chr(10).join(f"### {key}\n{value.strip()}" for key, value in payload.previousAnswers.items() if value.strip())
            or "(кандидат не дал ни одного ответа)"
        )
        prompt = f"""Оцени mock interview целиком.

НАПРАВЛЕНИЕ: {payload.directionId}
БЛОК: {payload.blockId}

ИСХОДНЫЙ КЕЙС:
{payload.taskText[:3500]}

ОТВЕТЫ КАНДИДАТА ПО РАУНДАМ:
{answers_block}
"""
        system = INTERVIEW_FINAL_SYSTEM
        temperature = 0.3
    elif payload.mode == "coach":
        prompt = f"""Кандидат отвечает на текущем раунде. Помоги наводящими подсказками, без оценки.

НАПРАВЛЕНИЕ: {payload.directionId}
БЛОК: {payload.blockId}

ИСХОДНЫЙ КЕЙС:
{payload.taskText[:3500]}

ТЕКУЩИЙ РАУНД: {payload.roundTitle}
Цель раунда: {payload.roundGoal}

Ожидаемые сигналы:
{chr(10).join(f"- {item}" for item in payload.expectedSignals) if payload.expectedSignals else "(нет явного списка)"}

Предыдущие ответы:
{chr(10).join(previous) if previous else "(пока нет)"}

Текущий ответ кандидата:
{payload.answerText.strip() or "(пусто)"}
"""
        system = INTERVIEW_COACH_SYSTEM
        temperature = 0.4
    else:
        prompt = f"""Проверь ответ кандидата на текущем шаге интервью.

НАПРАВЛЕНИЕ:
{payload.directionId}

БЛОК:
{payload.blockId}

ИСХОДНЫЙ КЕЙС:
{payload.taskText[:3500]}

ТЕКУЩИЙ РАУНД:
{payload.roundTitle}

Цель раунда:
{payload.roundGoal}

Ожидаемые сигналы:
{chr(10).join(f"- {item}" for item in payload.expectedSignals) if payload.expectedSignals else "(нет явного списка)"}

Предыдущие принятые ответы:
{chr(10).join(previous) if previous else "(пока нет)"}

Выбранный вариант:
{payload.selectedOption or "(не выбран)"}

Письменный ответ:
{payload.answerText.strip() or "(пусто)"}
"""
        system = INTERVIEW_CHECK_SYSTEM
        temperature = 0.25

    try:
        result = call_yandex_gpt(system, prompt, temperature=temperature, max_tokens=1200)
        return CheckInterviewResponse(result=result)
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
    used_ids = set()
    for step in CASE_STEPS:
        answer = payload.answers.get(step["id"], "").strip()
        if answer:
            used_ids.add(step["id"])
        answers_summary.append(f"### {step['title']}\n{answer or '(пропущено)'}")
    for step_id, answer in payload.answers.items():
        if step_id not in used_ids and answer.strip():
            answers_summary.append(f"### {step_id}\n{answer.strip()}")

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


@app.post("/api/learn/explain", response_model=LearnExplainResponse)
def learn_explain(payload: LearnExplainRequest) -> LearnExplainResponse:
    difficulty_label = {"simplified": "очень простыми словами, как будто объясняешь школьнику", "normal": "чётко и понятно", "advanced": "с глубокими деталями и нюансами"}.get(payload.difficulty, "чётко и понятно")
    prompt = f"""Объясни концепцию продуктового менеджмента.

Тема: {payload.topic}
Подтема: {payload.subtopic}
Уровень объяснения: {difficulty_label}
"""
    if payload.question:
        prompt += f"\nВопрос, на котором пользователь ошибся: {payload.question}"
    if payload.wrongAnswer:
        prompt += f"\nНеправильный ответ пользователя: {payload.wrongAnswer}"
    if payload.correctAnswer:
        prompt += f"\nПравильный ответ: {payload.correctAnswer}"

    prompt += "\n\nДай объяснение (3-5 предложений) и один практический совет (tip). Отвечай строго в формате JSON: {\"explanation\": \"...\", \"tip\": \"...\"}"

    system = "Ты опытный PM-ментор. Объясняй ясно, с примерами. Давай практические советы. Отвечай только валидным JSON без markdown-блоков."
    raw = ""
    try:
        raw = call_yandex_gpt(system, prompt, temperature=0.4, max_tokens=600)
        # Модель часто оборачивает JSON в ```json ... ``` markdown — вытаскиваем
        # первый сбалансированный объект через regex.
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        parsed = json.loads(m.group(0) if m else raw)
        return LearnExplainResponse(
            explanation=parsed.get("explanation", raw),
            tip=parsed.get("tip", ""),
        )
    except Exception:
        return LearnExplainResponse(explanation=raw or "", tip="")


@app.post("/api/learn/session", response_model=LearnSessionResponse)
def learn_session(payload: LearnSessionRequest) -> LearnSessionResponse:
    level_label = {"beginner": "максимально просто и доступно", "normal": "понятно с примерами", "advanced": "подробно с нюансами"}.get(payload.userLevel, "понятно с примерами")
    prompt = f"""Напиши обучающее объяснение для студента, изучающего продуктовый менеджмент.

Раздел курса: {payload.chapterId}
Подтема: {payload.subtopicId}
Стиль: {level_label}

Напиши 2-3 абзаца, объясняющих эту тему. Включи конкретный пример. Не используй markdown, только чистый текст.
"""
    try:
        exposition = call_yandex_gpt("Ты опытный PM-преподаватель. Объясняй ясно, с примерами из реального мира.", prompt, temperature=0.5, max_tokens=800)
        return LearnSessionResponse(exposition=exposition)
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

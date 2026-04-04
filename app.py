import json
import logging
import re
import time
from typing import Any

import requests
import streamlit as st

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

st.set_page_config(
    page_title="Hack the Case",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

logger = logging.getLogger(__name__)
YANDEX_GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
MAX_CASE_PREVIEW = 1800
MAX_EVAL_CASE = 2200
MAX_PREVIOUS_STEP_CHARS = 300
MAX_CHAT_HISTORY = 6


# ─────────────────────────────────────────────
# DATA
# ─────────────────────────────────────────────

CASE_STEPS = [
    {
        "id": "issue_tree",
        "title": "1. Issue Tree / Problem Tree",
        "description": "Декомпозиция проблемы: разбей задачу на MECE-компоненты.",
        "case_hint": "Выдели главную бизнес-проблему из условия и разложи её на 3–5 непересекающихся веток.",
        "frameworks": ["Issue Tree", "MECE-принцип", "Problem Tree"],
        "coach_prompt": """Ты — Case Coach, эксперт по бизнес-консалтингу в стиле McKinsey/BCG.
Студент работает над блоком Issue Tree. Твоя задача — НЕ давать готовый ответ, а:
- задавать наводящие вопросы;
- проверять MECE;
- если студент застрял — дать подсказку, но не решение;
- спрашивать: «Все ли ветки ты учёл? Нет ли пересечений?»
Отвечай на русском. Будь требовательным, но поддерживающим.""",
    },
    {
        "id": "research",
        "title": "2. Ресёрч и анализ рынка",
        "description": "Анализ внешней среды: рынок, конкуренты, тренды.",
        "case_hint": "Проверь размер рынка, тренды, конкурентов и барьеры входа. Не ограничивайся одним фреймворком.",
        "frameworks": ["PEST / PESTEL", "5 Porter Forces", "SWOT", "Benchmarking", "Market Sizing"],
        "coach_prompt": """Ты — Case Coach. Студент работает над блоком Ресёрч/Анализ рынка.
Твоя задача — НЕ давать готовые данные, а:
- направлять: «Какие макро-факторы влияют? Используй PEST»;
- проверять логику market sizing: «Откуда эта цифра? Как ты оцениваешь TAM/SAM/SOM?»;
- спрашивать про конкурентов: «Кто основные игроки? Какие барьеры входа по Porter?»;
- подсказывать фреймворк, если студент не знает какой применить.
Отвечай на русском.""",
    },
    {
        "id": "segmentation",
        "title": "3. Сегментация и инсайты",
        "description": "Определи целевую аудиторию и ключевые инсайты.",
        "case_hint": "Разбей аудиторию по понятным критериям и выбери приоритетный сегмент.",
        "frameworks": ["Customer Segmentation", "Persona", "JTBD", "Pain-Gain", "ABC-анализ"],
        "coach_prompt": """Ты — Case Coach. Студент работает над сегментацией аудитории.
Твоя задача:
- проверять критерии сегментации;
- направлять к JTBD;
- просить раскрыть боли и gains целевой persona;
- проверять ABC-логику и приоритизацию сегментов.
Отвечай на русском. Не давай готовых ответов.""",
    },
    {
        "id": "cjm",
        "title": "4. CJM и сервисный дизайн",
        "description": "Путь клиента от осознания до лояльности.",
        "case_hint": "Опиши ключевые этапы пути клиента, точки контакта, pain points и конверсию между этапами.",
        "frameworks": ["CJM", "Penetration Funnel", "Funnel Analysis", "AARRR"],
        "coach_prompt": """Ты — Case Coach. Студент строит CJM.
Твоя задача:
- проверять полноту этапов пути клиента;
- спрашивать про touchpoints и pain points;
- направлять к воронке и bottleneck;
- напоминать про AARRR, если уместно.
Отвечай на русском.""",
    },
    {
        "id": "initiatives",
        "title": "5. Инициативы и решения",
        "description": "Предложи конкретные решения и приоритизируй их.",
        "case_hint": "Каждая инициатива должна быть связана с корневой причиной и иметь понятный приоритет.",
        "frameworks": ["Driver-based Solution Design", "Prioritization Matrix", "2x2 Matrix", "Ansoff Matrix", "4P / 7P"],
        "coach_prompt": """Ты — Case Coach. Студент предлагает инициативы.
Твоя задача:
- проверять связь решения с корневой причиной;
- требовать приоритизацию по impact/effort;
- проверять, продуманы ли альтернативы;
- не давать готового набора инициатив.
Отвечай на русском.""",
    },
    {
        "id": "metrics",
        "title": "6. Метрики и эксперименты",
        "description": "Определи KPI, North Star Metric и план экспериментов.",
        "case_hint": "Сначала выбери NSM, затем декомпозируй её на входные метрики и эксперименты.",
        "frameworks": ["Metric Hierarchy", "NSM", "HEART", "AARRR", "Cohort Analysis"],
        "coach_prompt": """Ты — Case Coach. Студент определяет метрики и эксперименты.
Твоя задача:
- спрашивать про North Star Metric и почему выбрана именно она;
- проверять декомпозицию метрик;
- направлять к первым экспериментам;
- проверять логику измерения эффекта.
Отвечай на русском.""",
    },
    {
        "id": "economics",
        "title": "7. Экономика и финмодель",
        "description": "Unit Economics, business case, NPV/IRR.",
        "case_hint": "Покажи основные драйверы выручки и затрат, затем проверь здравый смысл допущений.",
        "frameworks": ["Unit Economics", "Business Case", "NPV / IRR / PBP"],
        "coach_prompt": """Ты — Case Coach. Студент строит финансовую модель.
Твоя задача:
- проверять CAC, LTV и окупаемость;
- требовать sanity check цифр;
- спрашивать о ключевых допущениях;
- не считать за студента.
Отвечай на русском.""",
    },
    {
        "id": "risks",
        "title": "8. Риски и митигация",
        "description": "Risk matrix, сценарии и план митигации.",
        "case_hint": "Назови 4–6 ключевых рисков, оцени вероятность и impact, добавь митигацию.",
        "frameworks": ["Risk Matrix", "SWOT", "McKinsey 7S"],
        "coach_prompt": """Ты — Case Coach. Студент анализирует риски.
Твоя задача:
- проверять полноту перечня рисков;
- требовать оценку impact и probability;
- спрашивать про митигацию;
- направлять к worst-case scenario.
Отвечай на русском.""",
    },
    {
        "id": "roadmap",
        "title": "9. Roadmap и реализация",
        "description": "План внедрения, quick wins, milestones.",
        "case_hint": "Разложи внедрение по этапам, добавь зависимости, ресурсы и контрольные точки.",
        "frameworks": ["Gantt Chart", "Product Roadmap", "Implementation Plan"],
        "coach_prompt": """Ты — Case Coach. Студент строит план реализации.
Твоя задача:
- проверять реалистичность сроков;
- спрашивать про зависимости и ресурсы;
- направлять к quick wins и milestones;
- не подменять собой проектного менеджера.
Отвечай на русском.""",
    },
]

INDUSTRIES = [
    "FMCG / Ритейл",
    "Fintech / Банки",
    "EdTech / Образование",
    "HealthTech / Медицина",
    "E-commerce / Маркетплейсы",
    "Транспорт / Логистика",
    "HoReCa / Рестораны",
    "IT / SaaS",
    "Телеком",
    "Промышленность / Производство",
    "Недвижимость / PropTech",
    "Медиа / Развлечения",
]

DIFFICULTY_LEVELS = {
    "Начальный": "Простой кейс для новичков: понятная проблема, один продукт, локальный рынок.",
    "Средний": "Кейс среднего уровня: несколько направлений, нужен market sizing и конкурентный анализ.",
    "Продвинутый": "Сложный кейс как на Changellenge/McKinsey: неоднозначная проблема, международный рынок, нужна финмодель.",
}

CASE_GENERATION_SYSTEM = """Ты — генератор бизнес-кейсов для кейс-чемпионатов уровня Changellenge, McKinsey Solve, BCG.
Генерируй реалистичные кейсы на русском языке.

Структура кейса:
1. Компания — название, отрасль, масштаб, краткое описание
2. Контекст — рыночная ситуация, тренды, позиция компании
3. Проблема — чёткая формулировка бизнес-задачи
4. Данные — ключевые цифры
5. Вопрос для решения — конкретный вопрос
6. Дополнительные вводные — ограничения, бюджет, сроки

Кейс должен быть решаемым с помощью стандартных консалтинговых фреймворков.
Не давай подсказок по решению. Пиши на русском."""

RUBRIC_SYSTEM = """Ты — Rubric-жюри, автоматизированный оценщик бизнес-кейсов.
Оцениваешь решение по рубрике из 10 критериев, каждый от 1 до 10 баллов.

Ответь СТРОГО в формате JSON без markdown:
{
  "criteria": [
    {"id": 1, "name": "Структура и MECE", "score": 7, "comment": "...", "recommendation": "..."}
  ],
  "total_score": 65,
  "strengths": ["..."],
  "improvements": ["..."],
  "top_3_tips": ["...", "...", "..."]
}

Критерии:
1. Структура и MECE
2. Глубина анализа рынка
3. Сегментация и инсайты
4. CJM и воронка
5. Качество инициатив
6. Метрики и KPI
7. Финансовая модель
8. Анализ рисков
9. Roadmap
10. Общая связность

Будь конструктивным, но строгим. Пиши на русском."""

CUSTOM_CSS = """
<style>
    .stApp { background-color: #f8f9fc; color: #1a1a2e; }
    .main-header {
        background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
        padding: 1.6rem 2rem;
        border-radius: 14px;
        margin-bottom: 1.4rem;
    }
    .main-header h1 { color: white !important; margin: 0; font-size: 1.9rem; }
    .main-header p { color: rgba(255,255,255,0.92) !important; margin: 0.35rem 0 0 0; }
    .card {
        background: #ffffff;
        border: 1px solid #eceef5;
        border-radius: 14px;
        padding: 1.2rem 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(16,24,40,0.05);
    }
    .framework-tag {
        display: inline-block;
        background: #fff2ea;
        color: #d45521 !important;
        padding: 0.22rem 0.7rem;
        border-radius: 999px;
        font-size: 0.8rem;
        margin: 0.15rem 0.2rem 0.15rem 0;
    }
    .progress-container {
        background: #eceef5;
        border-radius: 999px;
        height: 10px;
        margin: 0.7rem 0 1rem 0;
    }
    .progress-fill {
        background: linear-gradient(90deg, #FF6B35, #F7931E);
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
    }
    .stepper { display: flex; gap: 0.4rem; overflow-x: auto; padding-bottom: 0.4rem; margin-bottom: 0.9rem; }
    .step-item { min-width: 96px; text-align: center; }
    .step-dot {
        width: 28px; height: 28px; border-radius: 50%; margin: 0 auto 0.25rem auto;
        display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 700;
    }
    .step-done { background: #22c55e; color: white; }
    .step-active { background: #FF6B35; color: white; box-shadow: 0 0 0 4px rgba(255,107,53,0.18); }
    .step-todo { background: #dde2ee; color: #65708a; }
    .step-label { font-size: 0.68rem; color: #65708a; line-height: 1.15; }
    .hint-box {
        background: #fff7f2;
        border-left: 4px solid #FF6B35;
        border-radius: 0 10px 10px 0;
        padding: 0.9rem 1rem;
        margin: 0.8rem 0 1rem 0;
    }
    .coach-msg, .student-msg {
        border-radius: 12px;
        padding: 0.9rem 1rem;
        margin: 0.45rem 0;
        border-left: 3px solid;
    }
    .coach-msg { background: #eef4ff; border-left-color: #4677ff; }
    .student-msg { background: #fff8f0; border-left-color: #FF6B35; }
    .score-box {
        background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
        color: white;
        border-radius: 14px;
        padding: 1.2rem;
        text-align: center;
    }
    .score-box .big { font-size: 2.6rem; font-weight: 700; line-height: 1; }
    .criterion-score {
        display: inline-block; background: #fff2ea; color: #d45521; padding: 0.18rem 0.55rem; border-radius: 8px; font-weight: 600;
    }
</style>
"""


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────


def get_api_credentials() -> tuple[str, str, str]:
    api_key = st.secrets.get("YANDEX_API_KEY", "")
    folder_id = st.secrets.get("YANDEX_FOLDER_ID", "")
    model = st.secrets.get("YANDEX_MODEL", "yandexgpt-lite")
    model = str(model).replace("/latest", "")
    return api_key, folder_id, model


@st.cache_data(show_spinner=False)
def build_model_uri(folder_id: str, model: str) -> str:
    return f"gpt://{folder_id}/{model}/latest"


@st.cache_data(show_spinner=False)
def truncate_text(text: str, limit: int) -> str:
    text = text or ""
    return text if len(text) <= limit else text[:limit] + "..."


@st.cache_data(show_spinner=False)
def clean_display_text(text: str) -> str:
    return text.strip() if text else ""



def init_session_state() -> None:
    defaults: dict[str, Any] = {
        "page": "start",
        "case_text": "",
        "case_industry": "",
        "case_difficulty": "",
        "current_step": 0,
        "step_answers": {},
        "step_chats": {},
        "evaluation": "",
        "evaluation_data": None,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value



def reset_workflow() -> None:
    st.session_state.case_text = ""
    st.session_state.case_industry = ""
    st.session_state.case_difficulty = ""
    st.session_state.current_step = 0
    st.session_state.step_answers = {}
    st.session_state.step_chats = {}
    st.session_state.evaluation = ""
    st.session_state.evaluation_data = None
    st.session_state.page = "start"



def call_yandex_gpt(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.6,
    max_tokens: int = 3000,
    max_retries: int = 3,
) -> str:
    api_key, folder_id, model = get_api_credentials()
    if not api_key or not folder_id:
        return (
            "⚠️ Не заданы YANDEX_API_KEY и YANDEX_FOLDER_ID. "
            "Добавь их в Secrets на Streamlit Cloud или в локальный .streamlit/secrets.toml."
        )

    headers = {
        "Authorization": f"Api-Key {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "modelUri": build_model_uri(folder_id, model),
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

    last_error = "неизвестная ошибка"
    for attempt in range(max_retries):
        try:
            response = requests.post(YANDEX_GPT_URL, headers=headers, json=body, timeout=90)
            response.raise_for_status()
            payload = response.json()
            return payload["result"]["alternatives"][0]["message"]["text"]
        except requests.exceptions.Timeout:
            last_error = "таймаут запроса"
            logger.warning("YandexGPT timeout on attempt %s/%s", attempt + 1, max_retries)
        except requests.exceptions.HTTPError:
            status = getattr(response, "status_code", "?")
            last_error = f"HTTP {status}"
            logger.warning("YandexGPT HTTP error %s on attempt %s/%s", status, attempt + 1, max_retries)
            if status == 429 and attempt < max_retries - 1:
                time.sleep(2 ** (attempt + 1))
                continue
            if 400 <= int(status) < 500 and status != 429:
                break
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)
            logger.exception("Unexpected YandexGPT error")

        if attempt < max_retries - 1:
            time.sleep(2 ** attempt)

    return f"⚠️ Не удалось получить ответ от AI после {max_retries} попыток ({last_error}). Попробуй ещё раз через минуту."



def build_previous_steps_summary(current_step_id: str) -> str:
    parts = []
    for step in CASE_STEPS:
        if step["id"] == current_step_id:
            break
        answer = st.session_state.step_answers.get(step["id"], "").strip()
        if answer:
            parts.append(f"[{step['title']}]: {truncate_text(answer, MAX_PREVIOUS_STEP_CHARS)}")
    return "\n".join(parts)



def build_coach_context(step: dict[str, Any], answer_text: str, user_message: str) -> str:
    history = st.session_state.step_chats.get(step["id"], [])[-MAX_CHAT_HISTORY:]
    history_text = "\n".join(
        f"{'Студент' if m['role'] == 'student' else 'Коуч'}: {m['text']}" for m in history
    )
    previous_steps = build_previous_steps_summary(step["id"])

    context = f"""Кейс:
{truncate_text(st.session_state.case_text, MAX_CASE_PREVIEW)}

Текущий этап: {step['title']}
Рекомендуемые фреймворки: {', '.join(step['frameworks'])}

Ответ студента на текущий этап:
{answer_text if answer_text.strip() else '(студент ещё не написал ответ)'}
"""
    if previous_steps:
        context += f"\nОтветы студента на предыдущие этапы:\n{previous_steps}\n"
    context += f"""
Последние сообщения:
{history_text if history_text else '(история пуста)'}

Сообщение студента: {user_message}
"""
    return context



def parse_rubric_json(raw_text: str) -> dict[str, Any] | None:
    try:
        data = json.loads(raw_text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    fenced = re.search(r"```json\s*(.*?)\s*```", raw_text, re.DOTALL)
    if fenced:
        try:
            data = json.loads(fenced.group(1))
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass

    start, end = raw_text.find("{"), raw_text.rfind("}")
    if start != -1 and end > start:
        try:
            data = json.loads(raw_text[start : end + 1])
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            return None
    return None



def render_stepper(current: int) -> None:
    labels = [
        "Issue Tree", "Ресёрч", "Сегменты", "CJM", "Решения", "Метрики", "Финансы", "Риски", "Roadmap"
    ]
    chunks = []
    for idx, step in enumerate(CASE_STEPS):
        done = bool(st.session_state.step_answers.get(step["id"], "").strip())
        css = "step-done" if done else ("step-active" if idx == current else "step-todo")
        chunks.append(
            f'<div class="step-item"><div class="step-dot {css}">{idx + 1}</div><div class="step-label">{labels[idx]}</div></div>'
        )
    st.markdown(f'<div class="stepper">{"".join(chunks)}</div>', unsafe_allow_html=True)



def render_radar_chart(criteria_scores: list[dict[str, Any]]) -> None:
    try:
        import plotly.graph_objects as go

        names = [item.get("name", f"Критерий {i+1}") for i, item in enumerate(criteria_scores)]
        scores = [max(0, min(10, int(item.get("score", 0)))) for item in criteria_scores]
        if not names:
            return
        fig = go.Figure()
        fig.add_trace(
            go.Scatterpolar(
                r=scores + [scores[0]],
                theta=names + [names[0]],
                fill="toself",
                fillcolor="rgba(255,107,53,0.12)",
                line=dict(color="#FF6B35", width=2),
                marker=dict(size=5, color="#FF6B35"),
            )
        )
        fig.update_layout(
            polar=dict(radialaxis=dict(visible=True, range=[0, 10], tickvals=[2, 4, 6, 8, 10])),
            showlegend=False,
            height=420,
            margin=dict(l=40, r=40, t=30, b=30),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
        )
        st.plotly_chart(fig, use_container_width=True)
    except Exception:
        st.info("График недоступен, но оценка ниже показана текстом.")


# ─────────────────────────────────────────────
# PAGES
# ─────────────────────────────────────────────


def page_start() -> None:
    st.markdown(
        """
        <div class="main-header">
            <h1>Hack the Case</h1>
            <p>AI-симулятор решения бизнес-кейсов. Учись думать как консультант.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    col1, col2 = st.columns([2, 1], gap="large")

    with col1:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader("Настройки кейса")
        industry = st.selectbox("Отрасль", INDUSTRIES, index=0)
        difficulty = st.selectbox("Уровень сложности", list(DIFFICULTY_LEVELS.keys()), index=1)
        st.caption(DIFFICULTY_LEVELS[difficulty])
        extra_context = st.text_area(
            "Дополнительный контекст",
            placeholder="Например: международная экспансия, запуск нового продукта, выход в новый сегмент...",
            height=90,
        )
        if st.button("Сгенерировать кейс", type="primary", use_container_width=True):
            with st.spinner("Генерирую кейс..."):
                prompt = (
                    f"Сгенерируй бизнес-кейс.\nОтрасль: {industry}\n"
                    f"Сложность: {difficulty} — {DIFFICULTY_LEVELS[difficulty]}"
                )
                if extra_context.strip():
                    prompt += f"\nДополнительный контекст: {extra_context.strip()}"
                case_text = call_yandex_gpt(CASE_GENERATION_SYSTEM, prompt, temperature=0.8)
                st.session_state.case_text = case_text
                st.session_state.case_industry = industry
                st.session_state.case_difficulty = difficulty
                st.session_state.step_answers = {}
                st.session_state.step_chats = {}
                st.session_state.current_step = 0
                st.session_state.evaluation = ""
                st.session_state.evaluation_data = None
        st.markdown("</div>", unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader("Как это работает")
        st.markdown(
            """
1. **Генерация** — AI создаёт уникальный кейс.
2. **Решение по этапам** — 9 шагов как на кейс-чемпионате.
3. **AI Coach** — задаёт вопросы и направляет, но не решает за тебя.
4. **Rubric-жюри** — даёт итоговую оценку и советы по улучшению.
            """
        )
        st.markdown("</div>", unsafe_allow_html=True)

        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader("Этапы")
        for step in CASE_STEPS:
            st.markdown(f"- {step['title']}")
        st.markdown("</div>", unsafe_allow_html=True)

    if st.session_state.case_text:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader("Твой кейс")
        st.markdown(clean_display_text(st.session_state.case_text))
        col_a, col_b = st.columns(2)
        with col_a:
            if st.button("Начать решение", type="primary", use_container_width=True):
                st.session_state.page = "solve"
                st.rerun()
        with col_b:
            if st.button("Сгенерировать другой", use_container_width=True):
                st.session_state.case_text = ""
                st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)



def page_solve() -> None:
    current = st.session_state.current_step
    step = CASE_STEPS[current]
    total = len(CASE_STEPS)
    completed = sum(1 for item in CASE_STEPS if st.session_state.step_answers.get(item["id"], "").strip())
    progress_pct = int(completed / total * 100)

    st.markdown(
        f"""
        <div class="main-header">
            <h1>Hack the Case — Решение</h1>
            <p>Этап {current + 1} из {total} · заполнено {completed} из {total} блоков</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    render_stepper(current)
    st.markdown(
        f'<div class="progress-container"><div class="progress-fill" style="width: {progress_pct}%"></div></div>',
        unsafe_allow_html=True,
    )

    with st.sidebar:
        st.subheader("Навигация")
        for idx, nav_step in enumerate(CASE_STEPS):
            done = bool(st.session_state.step_answers.get(nav_step["id"], "").strip())
            icon = "✅" if done else ("▶️" if idx == current else "⬜")
            if st.button(f"{icon} {nav_step['title']}", key=f"nav_{idx}", use_container_width=True):
                st.session_state.current_step = idx
                st.rerun()
        st.markdown("---")
        if st.button("Завершить и получить оценку", type="primary", use_container_width=True):
            st.session_state.page = "evaluate"
            st.rerun()
        if st.button("Назад к генерации", use_container_width=True):
            st.session_state.page = "start"
            st.rerun()
        with st.expander("Полное условие кейса"):
            st.markdown(clean_display_text(st.session_state.case_text))

    col_work, col_coach = st.columns([1.1, 1], gap="large")

    with col_work:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader(step["title"])
        st.write(step["description"])
        tags = " ".join(f'<span class="framework-tag">{item}</span>' for item in step["frameworks"])
        st.markdown(f"**Рекомендуемые фреймворки:** {tags}", unsafe_allow_html=True)
        st.markdown(f'<div class="hint-box"><strong>Подсказка:</strong> {step["case_hint"]}</div>', unsafe_allow_html=True)
        answer_key = step["id"]
        existing_answer = st.session_state.step_answers.get(answer_key, "")
        answer = st.text_area(
            "Твоё решение по этому блоку",
            value=existing_answer,
            height=270,
            placeholder=f"Опиши своё решение для этапа «{step['title']}»...",
            key=f"answer_{answer_key}",
        )
        col_save, col_next = st.columns(2)
        with col_save:
            if st.button("Сохранить ответ", use_container_width=True, key=f"save_{answer_key}"):
                st.session_state.step_answers[answer_key] = answer
                st.success("Ответ сохранён")
        with col_next:
            if current < total - 1:
                if st.button("Следующий этап →", type="primary", use_container_width=True, key=f"next_{answer_key}"):
                    st.session_state.step_answers[answer_key] = answer
                    st.session_state.current_step = current + 1
                    st.rerun()
            else:
                if st.button("Завершить →", type="primary", use_container_width=True, key=f"finish_{answer_key}"):
                    st.session_state.step_answers[answer_key] = answer
                    st.session_state.page = "evaluate"
                    st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

    with col_coach:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader("AI Coach")
        st.caption("Коуч помогает думать и проверяет логику, но не пишет решение за тебя.")
        chat_key = step["id"]
        if chat_key not in st.session_state.step_chats:
            st.session_state.step_chats[chat_key] = []

        if not st.session_state.step_chats[chat_key]:
            st.info("Задай вопрос коучу или нажми «Проверь мой ответ».")

        for msg in st.session_state.step_chats[chat_key]:
            css_class = "coach-msg" if msg["role"] == "coach" else "student-msg"
            label = "Coach" if msg["role"] == "coach" else "Ты"
            safe_text = msg["text"].replace("\n", "<br>")
            st.markdown(f'<div class="{css_class}"><b>{label}:</b><br>{safe_text}</div>', unsafe_allow_html=True)

        coach_input = st.text_input(
            "Сообщение коучу",
            placeholder="Например: Проверь структуру моего issue tree",
            key=f"coach_input_{chat_key}",
        )
        c1, c2 = st.columns(2)
        with c1:
            if st.button("Спросить коуча", use_container_width=True, key=f"ask_{chat_key}"):
                if coach_input.strip():
                    _ask_coach(step, chat_key, coach_input.strip(), answer)
                else:
                    st.warning("Сначала напиши вопрос")
        with c2:
            if st.button("Проверь мой ответ", type="primary", use_container_width=True, key=f"review_{chat_key}"):
                if answer.strip():
                    _ask_coach(step, chat_key, "Проверь мой ответ и дай фидбек.", answer)
                else:
                    st.warning("Сначала напиши ответ слева")
        st.markdown("</div>", unsafe_allow_html=True)



def _ask_coach(step: dict[str, Any], chat_key: str, user_message: str, answer_text: str) -> None:
    st.session_state.step_chats[chat_key].append({"role": "student", "text": user_message})
    context = build_coach_context(step, answer_text, user_message)
    with st.spinner("Коуч думает..."):
        response = call_yandex_gpt(step["coach_prompt"], context, temperature=0.5)
    st.session_state.step_chats[chat_key].append({"role": "coach", "text": response})
    st.rerun()



def page_evaluate() -> None:
    st.markdown(
        """
        <div class="main-header">
            <h1>Hack the Case — Оценка</h1>
            <p>Rubric-жюри анализирует твоё решение по 10 критериям</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    answers_summary = ""
    filled = 0
    for step in CASE_STEPS:
        answer = st.session_state.step_answers.get(step["id"], "")
        if answer.strip():
            filled += 1
        answers_summary += f"\n\n### {step['title']}\n{answer if answer.strip() else '(пропущено)'}"

    col1, col2 = st.columns([2, 1], gap="large")

    with col2:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader("Статус заполнения")
        st.metric("Заполнено блоков", f"{filled}/{len(CASE_STEPS)}")
        for step in CASE_STEPS:
            answer = st.session_state.step_answers.get(step["id"], "")
            icon = "✅" if answer.strip() else "⬜"
            st.write(f"{icon} {step['title']}")
        st.markdown("</div>", unsafe_allow_html=True)
        if st.button("Вернуться к решению", use_container_width=True):
            st.session_state.page = "solve"
            st.rerun()
        if st.button("Начать заново", use_container_width=True):
            reset_workflow()
            st.rerun()

    with col1:
        if not st.session_state.evaluation and not st.session_state.evaluation_data:
            if filled == 0:
                st.warning("Ты ещё не заполнил ни одного блока. Вернись к решению.")
            else:
                st.info(f"Заполнено {filled} из {len(CASE_STEPS)} блоков. Чем больше заполнено, тем полезнее оценка.")
                if st.button("Получить оценку от Rubric-жюри", type="primary", use_container_width=True):
                    eval_prompt = f"""Оцени решение бизнес-кейса.

КЕЙС:
{truncate_text(st.session_state.case_text, MAX_EVAL_CASE)}

РЕШЕНИЕ СТУДЕНТА:
{answers_summary}

Дай оценку по всем 10 критериям рубрики. Ответ строго в JSON."""
                    with st.spinner("Жюри оценивает решение..."):
                        raw_eval = call_yandex_gpt(RUBRIC_SYSTEM, eval_prompt, temperature=0.3)
                        st.session_state.evaluation = raw_eval
                        parsed = parse_rubric_json(raw_eval)
                        if parsed and "criteria" in parsed:
                            st.session_state.evaluation_data = parsed
                        st.rerun()
        elif st.session_state.evaluation_data:
            _render_structured_evaluation(st.session_state.evaluation_data)
        else:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.subheader("Результаты оценки")
            st.markdown(clean_display_text(st.session_state.evaluation))
            st.markdown("</div>", unsafe_allow_html=True)
            if st.button("Повторить оценку", use_container_width=True):
                st.session_state.evaluation = ""
                st.session_state.evaluation_data = None
                st.rerun()



def _render_structured_evaluation(eval_data: dict[str, Any]) -> None:
    criteria = eval_data.get("criteria", [])
    total = eval_data.get("total_score", sum(int(item.get("score", 0)) for item in criteria))
    strengths = eval_data.get("strengths", [])
    improvements = eval_data.get("improvements", [])
    tips = eval_data.get("top_3_tips", [])

    st.markdown(
        f'<div class="score-box"><div class="big">{total}</div><div>из 100 баллов</div></div>',
        unsafe_allow_html=True,
    )

    if criteria:
        render_radar_chart(criteria)

    if strengths or improvements:
        s1, s2 = st.columns(2)
        with s1:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.subheader("Сильные стороны")
            for item in strengths:
                st.markdown(f"- {item}")
            st.markdown("</div>", unsafe_allow_html=True)
        with s2:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.subheader("Зоны роста")
            for item in improvements:
                st.markdown(f"- {item}")
            st.markdown("</div>", unsafe_allow_html=True)

    if tips:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader("Топ-3 совета")
        for idx, tip in enumerate(tips, start=1):
            st.markdown(f"**{idx}.** {tip}")
        st.markdown("</div>", unsafe_allow_html=True)

    st.subheader("Детальная оценка")
    for item in criteria:
        name = item.get("name", "Критерий")
        score = item.get("score", 0)
        comment = item.get("comment", "")
        recommendation = item.get("recommendation", "")
        with st.expander(f"{name} — {score}/10"):
            st.markdown(f'<span class="criterion-score">{score}/10</span>', unsafe_allow_html=True)
            if comment:
                st.markdown(f"**Комментарий:** {comment}")
            if recommendation:
                st.markdown(f"**Рекомендация:** {recommendation}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────


def main() -> None:
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    init_session_state()
    page = st.session_state.page
    if page == "start":
        page_start()
    elif page == "solve":
        page_solve()
    else:
        page_evaluate()


if __name__ == "__main__":
    main()

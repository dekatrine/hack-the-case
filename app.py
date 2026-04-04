import json
import logging
import re
import time
from html import escape
from typing import Any

import requests
import streamlit as st

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
MAX_PREVIOUS_STEP_CHARS = 320
MAX_CHAT_HISTORY = 6
QUICK_COACH_ACTIONS = [
    "Проверь структуру",
    "Проверь MECE",
    "Найди пробелы в логике",
    "Подскажи фреймворк",
]

CASE_STEPS = [
    {
        "id": "issue_tree",
        "title": "1. Issue Tree / Problem Tree",
        "short_title": "Issue Tree",
        "description": "Разбей главную проблему на 3–5 непересекающихся веток и покажи логику анализа.",
        "objective": "На выходе должен получиться понятный issue tree с MECE-ветками и гипотезами для проверки.",
        "common_mistake": "Ветки пересекаются или часть проблемы вообще не покрыта.",
        "case_hint": "Выдели главную бизнес-проблему и разложи её на драйверы: выручка, маржа, каналы, клиентский опыт, операции.",
        "frameworks": ["Issue Tree", "MECE", "Problem Tree"],
        "coach_prompt": """Ты — Case Coach, эксперт по бизнес-кейсам в стиле McKinsey/BCG.
Студент работает над Issue Tree.
Твоя задача:
- НЕ давать готовое решение;
- проверять структуру дерева и MECE;
- задавать 2–4 наводящих вопроса;
- если логика слабая, указывать где именно разрыв;
- если студент просит фреймворк, подсказывать направление, но не готовый ответ.
Отвечай на русском, кратко, по делу и доброжелательно.""",
    },
    {
        "id": "research",
        "title": "2. Ресёрч и анализ рынка",
        "short_title": "Ресёрч",
        "description": "Проверь рынок, тренды, конкурентов и ключевые внешние факторы.",
        "objective": "На выходе: ёмкость рынка, важные тренды, карта конкурентов и 2–3 главных вывода.",
        "common_mistake": "Описывается рынок в целом, но нет связи с задачей компании.",
        "case_hint": "Используй PEST/Porter/market sizing и обязательно свяжи выводы с проблемой кейса.",
        "frameworks": ["PEST / PESTEL", "5 Porter Forces", "SWOT", "Benchmarking", "Market Sizing"],
        "coach_prompt": """Ты — Case Coach. Студент делает ресёрч и анализ рынка.
Твоя задача:
- не давать готовые цифры;
- проверять логику market sizing;
- спрашивать про тренды, конкурентов и барьеры;
- помогать выбрать фреймворк;
- в конце давать 2–3 конкретные зоны улучшения.
Отвечай на русском, структурно и без лишней воды.""",
    },
    {
        "id": "segmentation",
        "title": "3. Сегментация и инсайты",
        "short_title": "Сегменты",
        "description": "Выдели сегменты аудитории и выбери приоритетный.",
        "objective": "На выходе: критерии сегментации, приоритетный сегмент и инсайты по его потребностям.",
        "common_mistake": "Сегменты описаны поверхностно и не объяснено, почему выбран именно этот приоритет.",
        "case_hint": "Покажи, по каким признакам ты делишь клиентов, и обоснуй выбор сегмента A.",
        "frameworks": ["Customer Segmentation", "Persona", "JTBD", "Pain-Gain", "ABC-анализ"],
        "coach_prompt": """Ты — Case Coach. Студент делает сегментацию.
Твоя задача:
- проверять критерии сегментации;
- направлять к JTBD и pain/gain;
- просить обосновать приоритетный сегмент;
- не давать готовых personas.
Отвечай на русском, конкретно и требовательно.""",
    },
    {
        "id": "cjm",
        "title": "4. CJM и сервисный дизайн",
        "short_title": "CJM",
        "description": "Опиши путь клиента, точки контакта, потери и bottleneck.",
        "objective": "На выходе: этапы CJM, pain points, ключевые точки потерь и идеи улучшения.",
        "common_mistake": "Есть список этапов, но нет конкретных проблем клиента и мест падения конверсии.",
        "case_hint": "Подумай, где клиент узнаёт о продукте, как принимает решение, где ломается опыт и как это влияет на результат.",
        "frameworks": ["CJM", "Penetration Funnel", "Funnel Analysis", "AARRR"],
        "coach_prompt": """Ты — Case Coach. Студент строит CJM.
Твоя задача:
- проверять полноту этапов;
- спрашивать про touchpoints, pain points и потери;
- направлять к bottleneck;
- помогать связать CJM с метриками и инициативами.
Отвечай на русском, коротко и по сути.""",
    },
    {
        "id": "initiatives",
        "title": "5. Инициативы и решения",
        "short_title": "Решения",
        "description": "Предложи решения и расставь приоритеты по impact/effort.",
        "objective": "На выходе: 3–5 инициатив, их логика, приоритет и ожидаемый эффект.",
        "common_mistake": "Инициативы выглядят как общий список идей и не привязаны к найденным причинам.",
        "case_hint": "Каждое решение должно бить в конкретную причину из issue tree и быть реалистичным для компании.",
        "frameworks": ["Driver-based Solution Design", "Prioritization Matrix", "2x2 Matrix", "Ansoff Matrix", "4P / 7P"],
        "coach_prompt": """Ты — Case Coach. Студент предлагает инициативы.
Твоя задача:
- проверять связь с корневой причиной;
- требовать приоритизацию;
- просить сравнить альтернативы;
- не выдавать готовый набор решений.
Отвечай на русском, логично и предметно.""",
    },
    {
        "id": "metrics",
        "title": "6. Метрики и эксперименты",
        "short_title": "Метрики",
        "description": "Определи North Star Metric, KPI и план проверки гипотез.",
        "objective": "На выходе: NSM, декомпозиция метрик и 1–3 первых эксперимента.",
        "common_mistake": "Перечислены метрики без иерархии и без связи с решениями.",
        "case_hint": "Сначала выбери главную метрику успеха, затем разложи её на входные показатели и способы измерения.",
        "frameworks": ["Metric Hierarchy", "NSM", "HEART", "AARRR", "Cohort Analysis"],
        "coach_prompt": """Ты — Case Coach. Студент определяет метрики и эксперименты.
Твоя задача:
- проверять выбор NSM;
- просить декомпозицию метрик;
- направлять к первым экспериментам;
- помогать определить критерии успеха.
Отвечай на русском, в формате полезного фидбэка.""",
    },
    {
        "id": "economics",
        "title": "7. Экономика и финмодель",
        "short_title": "Финансы",
        "description": "Покажи экономику решения и проверь допущения.",
        "objective": "На выходе: основные драйверы выручки и затрат, unit economics и вывод об окупаемости.",
        "common_mistake": "Цифры указаны без логики расчёта и без проверки реалистичности.",
        "case_hint": "Объясни, за счёт чего растёт результат: объём, средний чек, маржа, retention, cost savings.",
        "frameworks": ["Unit Economics", "Business Case", "NPV / IRR / PBP"],
        "coach_prompt": """Ты — Case Coach. Студент строит финансовую модель.
Твоя задача:
- проверять CAC, LTV, окупаемость и здравый смысл цифр;
- спрашивать про допущения;
- не считать за студента;
- давать короткие направления, что улучшить.
Отвечай на русском, строго и понятно.""",
    },
    {
        "id": "risks",
        "title": "8. Риски и митигация",
        "short_title": "Риски",
        "description": "Выдели ключевые риски, оцени их и предложи митигацию.",
        "objective": "На выходе: 4–6 рисков, вероятность/impact и меры снижения.",
        "common_mistake": "Риски названы слишком общо, без оценки важности и конкретной митигации.",
        "case_hint": "Смотри на рыночные, операционные, финансовые и репутационные риски — не ограничивайся одним типом.",
        "frameworks": ["Risk Matrix", "SWOT", "McKinsey 7S"],
        "coach_prompt": """Ты — Case Coach. Студент анализирует риски.
Твоя задача:
- проверять полноту рисков;
- требовать probability и impact;
- спрашивать про меры митигации;
- помогать выбрать 2–3 критичных риска.
Отвечай на русском, кратко и предметно.""",
    },
    {
        "id": "roadmap",
        "title": "9. Roadmap и реализация",
        "short_title": "Roadmap",
        "description": "Покажи этапы внедрения, quick wins, зависимости и контрольные точки.",
        "objective": "На выходе: понятный roadmap с этапами, ресурсами, ответственными и milestones.",
        "common_mistake": "План выглядит линейным списком без зависимостей и реалистичных сроков.",
        "case_hint": "Раздели план на quick wins, основной rollout и контроль результата. Покажи, что идёт параллельно, а что зависит от других задач.",
        "frameworks": ["Gantt Chart", "Product Roadmap", "Implementation Plan"],
        "coach_prompt": """Ты — Case Coach. Студент делает roadmap.
Твоя задача:
- проверять реалистичность сроков;
- спрашивать про зависимости, ресурсы и milestones;
- направлять к quick wins;
- не строить roadmap за студента.
Отвечай на русском, конкретно и делово.""",
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
    "Начальный": "Простой кейс для новичков: понятная задача, один продукт, локальный рынок.",
    "Средний": "Кейс среднего уровня: несколько направлений, нужен market sizing и конкурентный анализ.",
    "Продвинутый": "Сложный кейс: неоднозначная проблема, международный рынок и финмодель.",
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

Ответь СТРОГО в JSON:
{
  "criteria": [
    {"id": 1, "name": "Структура и MECE", "score": 7, "comment": "...", "recommendation": "..."}
  ],
  "total_score": 65,
  "strengths": ["..."],
  "improvements": ["..."],
  "top_3_tips": ["...", "...", "..."]
}

Если блоки пропущены — учитывай это в оценке. Пиши на русском."""

CUSTOM_CSS = """
<style>
    :root {
        --bg: #f5f7fb;
        --card: #ffffff;
        --text: #1b2338;
        --muted: #667085;
        --line: #e5eaf4;
        --primary: #ff6b35;
        --primary-dark: #e45722;
        --soft: #fff4ef;
        --soft-blue: #eef4ff;
        --sidebar: #121826;
        --success: #16a34a;
    }
    .stApp {
        background: var(--bg);
        color: var(--text);
    }
    .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
        max-width: 1280px;
    }
    section[data-testid="stSidebar"] {
        background: var(--sidebar);
        border-right: 1px solid rgba(255,255,255,0.06);
    }
    section[data-testid="stSidebar"] * {
        color: #eef2ff !important;
    }
    section[data-testid="stSidebar"] .stButton > button {
        width: 100%;
        border-radius: 12px !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        background: rgba(255,255,255,0.04) !important;
        color: #f8fafc !important;
        min-height: 44px !important;
    }
    section[data-testid="stSidebar"] .stButton > button:hover {
        border-color: rgba(255,255,255,0.28) !important;
        background: rgba(255,255,255,0.08) !important;
    }
    .hero {
        background: linear-gradient(135deg, #ff6b35 0%, #ff9356 100%);
        border-radius: 24px;
        padding: 1.6rem 1.8rem;
        margin-bottom: 1.2rem;
        color: white;
        box-shadow: 0 18px 45px rgba(255,107,53,0.18);
    }
    .hero h1 {
        color: white !important;
        margin: 0 0 0.35rem 0;
        font-size: 2.2rem;
        line-height: 1.05;
    }
    .hero p {
        color: rgba(255,255,255,0.92) !important;
        margin: 0;
        max-width: 720px;
        font-size: 1rem;
    }
    .hero-grid {
        display: grid;
        grid-template-columns: 1.3fr 0.9fr;
        gap: 1rem;
        align-items: start;
    }
    .hero-note {
        background: rgba(255,255,255,0.16);
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 18px;
        padding: 1rem 1.1rem;
    }
    .hero-note b {
        display: block;
        margin-bottom: 0.35rem;
        color: white !important;
    }
    .hero-note p {
        font-size: 0.95rem;
    }
    .card {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 1.2rem 1.25rem;
        box-shadow: 0 8px 24px rgba(16,24,40,0.05);
        margin-bottom: 1rem;
    }
    .card h3 {
        margin-top: 0;
        margin-bottom: 0.4rem;
        color: var(--text) !important;
    }
    .subtle {
        color: var(--muted) !important;
        font-size: 0.95rem;
    }
    .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 0.85rem;
        color: var(--text) !important;
    }
    .pill {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.26rem 0.7rem;
        border-radius: 999px;
        background: var(--soft);
        color: var(--primary-dark) !important;
        border: 1px solid #ffd8c9;
        margin: 0 0.35rem 0.35rem 0;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .meta-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        margin-top: 0.9rem;
    }
    .meta-card {
        background: #f9fbff;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 0.85rem 0.95rem;
    }
    .meta-card .label {
        font-size: 0.75rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
    }
    .meta-card .value {
        font-weight: 700;
        color: var(--text);
    }
    .steps-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
    }
    .step-mini {
        border: 1px solid var(--line);
        border-radius: 16px;
        background: #fcfdff;
        padding: 0.9rem;
        min-height: 118px;
    }
    .step-mini b {
        display: block;
        margin-bottom: 0.35rem;
        color: var(--text) !important;
    }
    .step-mini span {
        color: var(--muted) !important;
        font-size: 0.88rem;
        line-height: 1.35;
    }
    .status-banner {
        border: 1px solid var(--line);
        background: #ffffff;
        border-radius: 18px;
        padding: 0.95rem 1.05rem;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
    }
    .progress-wrap {
        margin-bottom: 1rem;
    }
    .progress-track {
        height: 10px;
        border-radius: 999px;
        background: #e8edf7;
        overflow: hidden;
    }
    .progress-bar {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #ff6b35 0%, #ff9356 100%);
    }
    .stepper {
        display: grid;
        grid-template-columns: repeat(9, minmax(76px, 1fr));
        gap: 0.5rem;
        margin: 0.8rem 0 0 0;
    }
    .step-node {
        text-align: center;
    }
    .step-dot {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        margin: 0 auto 0.28rem auto;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 700;
    }
    .step-dot.todo {
        background: #dbe3f0;
        color: #5f6c86;
    }
    .step-dot.active {
        background: var(--primary);
        color: white;
        box-shadow: 0 0 0 5px rgba(255,107,53,0.14);
    }
    .step-dot.done {
        background: var(--success);
        color: white;
    }
    .step-node .label {
        font-size: 0.72rem;
        line-height: 1.15;
        color: var(--muted);
    }
    .hint-box {
        background: #fff7f2;
        border: 1px solid #ffd9ca;
        border-left: 4px solid var(--primary);
        border-radius: 16px;
        padding: 0.95rem 1rem;
        margin: 0.9rem 0;
    }
    .mini-guides {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 0.8rem 0 0.2rem;
    }
    .mini-guide {
        background: #f9fbff;
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 0.85rem 0.9rem;
    }
    .mini-guide b {
        display: block;
        margin-bottom: 0.25rem;
    }
    .case-sections {
        display: grid;
        grid-template-columns: 1.25fr 0.85fr;
        gap: 1rem;
    }
    .section-box {
        background: #fcfdff;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 0.95rem 1rem;
        margin-bottom: 0.8rem;
    }
    .section-box h4 {
        margin: 0 0 0.4rem 0;
        color: var(--text) !important;
        font-size: 1.02rem;
    }
    .checklist {
        margin: 0;
        padding-left: 1.1rem;
    }
    .coach-shell {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 20px;
        box-shadow: 0 8px 24px rgba(16,24,40,0.05);
        padding: 1.1rem;
    }
    .coach-header {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: start;
        margin-bottom: 0.8rem;
    }
    .coach-quick {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-bottom: 0.75rem;
    }
    .coach-msg, .student-msg {
        border-radius: 16px;
        padding: 0.85rem 0.95rem;
        margin: 0.5rem 0;
        border: 1px solid var(--line);
        line-height: 1.45;
    }
    .coach-msg {
        background: var(--soft-blue);
        border-left: 4px solid #5b8cff;
    }
    .student-msg {
        background: #fff8f1;
        border-left: 4px solid var(--primary);
    }
    .empty-state {
        background: #fbfcfe;
        border: 1px dashed #d7e0ef;
        border-radius: 16px;
        padding: 1rem;
        text-align: center;
        color: var(--muted);
    }
    .score-box {
        background: linear-gradient(135deg, #ff6b35 0%, #ff9356 100%);
        color: white;
        border-radius: 22px;
        padding: 1.2rem;
        text-align: center;
        margin-bottom: 1rem;
        box-shadow: 0 18px 45px rgba(255,107,53,0.18);
    }
    .score-box .big {
        font-size: 3rem;
        font-weight: 800;
        line-height: 1;
        color: white !important;
    }
    .score-box .small {
        color: rgba(255,255,255,0.92) !important;
        margin-top: 0.3rem;
    }
    .criteria-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.8rem;
    }
    .criterion-chip {
        display: inline-block;
        padding: 0.18rem 0.56rem;
        border-radius: 999px;
        background: var(--soft);
        color: var(--primary-dark) !important;
        font-weight: 700;
        font-size: 0.82rem;
        border: 1px solid #ffd8c9;
        margin-bottom: 0.45rem;
    }
    .bullet-card {
        background: #fcfdff;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 1rem;
        height: 100%;
    }
    div[data-testid="stButton"] > button {
        border-radius: 14px !important;
        min-height: 46px !important;
        font-weight: 600 !important;
        border: 1px solid #d8dfec !important;
        box-shadow: none !important;
    }
    div[data-testid="stButton"] > button[kind="primary"],
    .stButton button[data-testid="baseButton-primary"] {
        background: linear-gradient(135deg, #ff6b35 0%, #ff8853 100%) !important;
        color: white !important;
        border: none !important;
    }
    div[data-testid="stButton"] > button:hover {
        border-color: #c7d2e5 !important;
    }
    .stTextInput input,
    .stTextArea textarea {
        background: #ffffff !important;
        color: var(--text) !important;
        border-radius: 14px !important;
        border: 1px solid #dbe3f0 !important;
    }
    .stSelectbox > div > div,
    .stMultiSelect > div > div {
        background: #ffffff !important;
        color: var(--text) !important;
        border-radius: 14px !important;
        border: 1px solid #dbe3f0 !important;
    }
    .stCaption, small, .stMarkdown p, .stMarkdown li {
        color: var(--text);
    }
    @media (max-width: 980px) {
        .hero-grid,
        .case-sections,
        .meta-grid,
        .mini-guides,
        .criteria-grid,
        .steps-grid {
            grid-template-columns: 1fr;
        }
        .stepper {
            grid-template-columns: repeat(3, minmax(76px, 1fr));
        }
    }
</style>
"""


def get_api_credentials() -> tuple[str, str, str]:
    api_key = st.secrets.get("YANDEX_API_KEY", "")
    folder_id = st.secrets.get("YANDEX_FOLDER_ID", "")
    model = str(st.secrets.get("YANDEX_MODEL", "yandexgpt-lite")).replace("/latest", "")
    return api_key, folder_id, model


def build_model_uri(folder_id: str, model: str) -> str:
    return f"gpt://{folder_id}/{model}/latest"


def truncate_text(text: str, limit: int) -> str:
    text = text or ""
    return text if len(text) <= limit else text[:limit] + "..."


def clean_display_text(text: str) -> str:
    return (text or "").strip()


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
        response = None
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
            if str(status) == "429" and attempt < max_retries - 1:
                time.sleep(2 ** (attempt + 1))
                continue
            try:
                if 400 <= int(status) < 500 and int(status) != 429:
                    break
            except Exception:
                pass
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
        f"{'Студент' if msg['role'] == 'student' else 'Коуч'}: {msg['text']}" for msg in history
    )
    previous_steps = build_previous_steps_summary(step["id"])

    context = f"""Кейс:
{truncate_text(st.session_state.case_text, MAX_CASE_PREVIEW)}

Текущий этап: {step['title']}
Рекомендуемые фреймворки: {', '.join(step['frameworks'])}
Цель этапа: {step['objective']}
Типичная ошибка: {step['common_mistake']}

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


def parse_case_sections(case_text: str) -> dict[str, str]:
    labels = [
        "Компания",
        "Отрасль",
        "Масштаб",
        "Краткое описание",
        "Контекст",
        "Проблема",
        "Данные",
        "Вопрос для решения",
        "Дополнительные вводные",
    ]
    normalized = (case_text or "").replace("**", "")
    pattern = re.compile(
        r"(?m)^\s*(Компания|Отрасль|Масштаб|Краткое описание|Контекст|Проблема|Данные|Вопрос для решения|Дополнительные вводные)\s*:\s*"
    )
    matches = list(pattern.finditer(normalized))
    sections: dict[str, str] = {}
    for index, match in enumerate(matches):
        key = match.group(1)
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(normalized)
        value = normalized[start:end].strip()
        sections[key] = value
    for label in labels:
        sections.setdefault(label, "")
    return sections


def render_hero(title: str, subtitle: str, note_title: str, note_text: str) -> None:
    st.markdown(
        f"""
        <div class="hero">
            <div class="hero-grid">
                <div>
                    <h1>{escape(title)}</h1>
                    <p>{escape(subtitle)}</p>
                </div>
                <div class="hero-note">
                    <b>{escape(note_title)}</b>
                    <p>{escape(note_text)}</p>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_stepper(current: int) -> None:
    chunks = []
    for idx, step in enumerate(CASE_STEPS):
        answer = st.session_state.step_answers.get(step["id"], "")
        state = "done" if answer.strip() else ("active" if idx == current else "todo")
        chunks.append(
            f'<div class="step-node"><div class="step-dot {state}">{idx + 1}</div><div class="label">{escape(step["short_title"])}</div></div>'
        )
    st.markdown(f'<div class="stepper">{"".join(chunks)}</div>', unsafe_allow_html=True)


def render_status_banner(current: int, completed: int) -> None:
    st.markdown(
        f"""
        <div class="status-banner">
            <div>
                <div class="section-title" style="margin:0; font-size:1.05rem;">Этап {current + 1} из {len(CASE_STEPS)}</div>
                <div class="subtle">Сначала сформулируй логику сам, потом попроси коуча проверить пробелы.</div>
            </div>
            <div style="text-align:right; min-width:180px;">
                <div class="subtle">Прогресс</div>
                <div style="font-weight:800; font-size:1.3rem;">{completed}/{len(CASE_STEPS)}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_progress(completed: int) -> None:
    progress = int((completed / len(CASE_STEPS)) * 100)
    st.markdown(
        f"""
        <div class="progress-wrap">
            <div class="subtle" style="margin-bottom:0.35rem;">Готово {progress}%</div>
            <div class="progress-track"><div class="progress-bar" style="width:{progress}%"></div></div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_case_overview(case_text: str) -> None:
    sections = parse_case_sections(case_text)
    context_html = sections["Контекст"].replace("\n", "<br>") if sections["Контекст"] else "Контекст пока не выделен."
    data_html = sections["Данные"].replace("\n", "<br>") if sections["Данные"] else "Ключевые цифры не выделены."

    st.markdown('<div class="case-sections">', unsafe_allow_html=True)
    with st.container():
        left, right = st.columns([1.3, 0.9], gap="large")
        with left:
            for title in ["Компания", "Краткое описание", "Контекст", "Проблема"]:
                content = sections.get(title, "") or "Раздел не выделен явно — смотри полный текст кейса ниже."
                st.markdown(
                    f'<div class="section-box"><h4>{escape(title)}</h4><div>{content}</div></div>',
                    unsafe_allow_html=True,
                )
        with right:
            st.markdown(
                f'''
                <div class="section-box">
                    <h4>Карточка кейса</h4>
                    <div class="meta-grid" style="grid-template-columns:1fr; margin-top:0;">
                        <div class="meta-card"><div class="label">Отрасль</div><div class="value">{escape(st.session_state.case_industry or sections.get("Отрасль", "—") or "—")}</div></div>
                        <div class="meta-card"><div class="label">Сложность</div><div class="value">{escape(st.session_state.case_difficulty or "—")}</div></div>
                        <div class="meta-card"><div class="label">Фокус решения</div><div class="value">{escape(sections.get("Вопрос для решения", "Выдели ключевой вопрос и собери ответ вокруг него."))}</div></div>
                    </div>
                </div>
                ''',
                unsafe_allow_html=True,
            )
            st.markdown(
                f'<div class="section-box"><h4>Данные</h4><div>{data_html}</div></div>',
                unsafe_allow_html=True,
            )
            st.markdown(
                f'<div class="section-box"><h4>Дополнительные вводные</h4><div>{sections.get("Дополнительные вводные", "Если ограничений нет, обозначь разумные допущения самостоятельно.")}</div></div>',
                unsafe_allow_html=True,
            )


def render_start_page() -> None:
    render_hero(
        "Hack the Case",
        "AI-симулятор решения бизнес-кейсов: тренируй структуру мысли, а не просто получай ответ.",
        "Что изменилось",
        "Более чистый интерфейс, пошаговое обучение, структурированный кейс и сильнее оформленный экран оценки.",
    )

    left, right = st.columns([1.3, 0.9], gap="large")
    with left:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown('<div class="section-title">Настройки кейса</div>', unsafe_allow_html=True)
        industry = st.selectbox("Отрасль", INDUSTRIES, index=0)
        difficulty = st.selectbox("Уровень сложности", list(DIFFICULTY_LEVELS.keys()), index=1)
        st.caption(DIFFICULTY_LEVELS[difficulty])
        extra_context = st.text_area(
            "Дополнительный контекст",
            placeholder="Например: международная экспансия, омниканальность, запуск B2B-направления...",
            height=110,
        )
        c1, c2 = st.columns([1, 1])
        with c1:
            if st.button("Сгенерировать кейс", type="primary", use_container_width=True):
                with st.spinner("Генерирую кейс... обычно это занимает 10–20 секунд"):
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
                    st.session_state.current_step = 0
                    st.session_state.step_answers = {}
                    st.session_state.step_chats = {}
                    st.session_state.evaluation = ""
                    st.session_state.evaluation_data = None
        with c2:
            if st.button("Очистить и начать заново", use_container_width=True):
                reset_workflow()
                st.rerun()
        st.markdown('<div class="subtle">Сначала попробуй 1–2 кейса на средней сложности, чтобы проверить логику продукта и удобство флоу.</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with right:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown('<div class="section-title">Как это работает</div>', unsafe_allow_html=True)
        st.markdown(
            """
            1. **Генерация** — AI создаёт кейс под выбранную отрасль и уровень сложности.
            2. **Решение по этапам** — ты проходишь 9 шагов как на кейс-чемпионате.
            3. **AI Coach** — не решает за тебя, а проверяет логику и задаёт вопросы.
            4. **Rubric-жюри** — оценивает решение и показывает сильные стороны и зоны роста.
            """
        )
        st.markdown('</div>', unsafe_allow_html=True)

        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown('<div class="section-title">Этапы решения</div>', unsafe_allow_html=True)
        steps_html = []
        for step in CASE_STEPS:
            steps_html.append(
                f'<div class="step-mini"><b>{escape(step["short_title"])}</b><span>{escape(step["description"][:95])}</span></div>'
            )
        st.markdown(f'<div class="steps-grid">{"".join(steps_html)}</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    if st.session_state.case_text:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown('<div class="section-title">Твой кейс</div>', unsafe_allow_html=True)
        render_case_overview(st.session_state.case_text)
        with st.expander("Показать полный текст кейса"):
            st.markdown(st.session_state.case_text)
        a, b = st.columns([1, 1])
        with a:
            if st.button("Начать решение", type="primary", use_container_width=True):
                st.session_state.page = "solve"
                st.rerun()
        with b:
            if st.button("Сгенерировать другой кейс", use_container_width=True):
                st.session_state.case_text = ""
                st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)


def _sidebar_navigation(current: int) -> None:
    with st.sidebar:
        st.markdown("### Навигация")
        st.caption("Переходи между шагами, но старайся не перескакивать слишком рано.")
        for idx, step in enumerate(CASE_STEPS):
            answer = st.session_state.step_answers.get(step["id"], "")
            icon = "✅" if answer.strip() else ("▶" if idx == current else "○")
            if st.button(f"{icon} {step['short_title']}", key=f"nav_{idx}"):
                st.session_state.current_step = idx
                st.rerun()
        st.markdown("---")
        if st.button("Завершить и получить оценку", type="primary"):
            st.session_state.page = "evaluate"
            st.rerun()
        if st.button("Назад к генерации"):
            st.session_state.page = "start"
            st.rerun()
        if st.button("Начать заново"):
            reset_workflow()
            st.rerun()


def _ask_coach(step: dict[str, Any], chat_key: str, user_message: str, answer_text: str) -> None:
    st.session_state.step_chats[chat_key].append({"role": "student", "text": user_message})
    context = build_coach_context(step, answer_text, user_message)
    with st.spinner("Коуч думает..."):
        response = call_yandex_gpt(step["coach_prompt"], context, temperature=0.45, max_tokens=1800)
    st.session_state.step_chats[chat_key].append({"role": "coach", "text": response})
    st.rerun()


def render_solve_page() -> None:
    current = st.session_state.current_step
    step = CASE_STEPS[current]
    completed = sum(1 for item in CASE_STEPS if st.session_state.step_answers.get(item["id"], "").strip())

    render_hero(
        "Решение кейса",
        "Сначала зафиксируй собственную логику, потом используй коуча, чтобы найти пробелы и усилить аргументацию.",
        "Учебный режим",
        "На каждом этапе ты видишь цель шага, типичную ошибку и подсказку из условия. Это делает флоу ближе к реальной подготовке к кейсам.",
    )
    _sidebar_navigation(current)
    render_status_banner(current, completed)
    render_progress(completed)
    render_stepper(current)

    left, right = st.columns([1.1, 0.9], gap="large")

    with left:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown(f'<div class="section-title">{escape(step["title"])}</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="subtle">{escape(step["description"])}</div>', unsafe_allow_html=True)
        st.markdown(
            "".join([f'<span class="pill">{escape(framework)}</span>' for framework in step["frameworks"]]),
            unsafe_allow_html=True,
        )
        st.markdown(
            f'<div class="hint-box"><b>Подсказка из условия</b><br>{escape(step["case_hint"])}</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            f'''
            <div class="mini-guides">
                <div class="mini-guide"><b>Что должно быть на выходе</b><div>{escape(step["objective"])}</div></div>
                <div class="mini-guide"><b>Типичная ошибка</b><div>{escape(step["common_mistake"])}</div></div>
            </div>
            ''',
            unsafe_allow_html=True,
        )
        with st.expander("Открыть кейс целиком"):
            st.markdown(st.session_state.case_text)
        answer_key = step["id"]
        existing_answer = st.session_state.step_answers.get(answer_key, "")
        answer = st.text_area(
            "Твоё решение",
            value=existing_answer,
            height=300,
            placeholder=f"Сформулируй решение для этапа «{step['short_title']}». Начни с логики, потом добавь выводы и допущения.",
            key=f"answer_{answer_key}",
        )
        b1, b2 = st.columns([1, 1])
        with b1:
            if st.button("Сохранить ответ", use_container_width=True, key=f"save_{answer_key}"):
                st.session_state.step_answers[answer_key] = answer
                st.success("Ответ сохранён")
        with b2:
            if current < len(CASE_STEPS) - 1:
                if st.button("Следующий шаг", type="primary", use_container_width=True, key=f"next_{answer_key}"):
                    st.session_state.step_answers[answer_key] = answer
                    st.session_state.current_step = current + 1
                    st.rerun()
            else:
                if st.button("Перейти к оценке", type="primary", use_container_width=True, key=f"finish_{answer_key}"):
                    st.session_state.step_answers[answer_key] = answer
                    st.session_state.page = "evaluate"
                    st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)

    with right:
        st.markdown('<div class="coach-shell">', unsafe_allow_html=True)
        st.markdown(
            """
            <div class="coach-header">
                <div>
                    <div class="section-title" style="margin-bottom:0.25rem;">AI Coach</div>
                    <div class="subtle">Коуч не пишет решение за тебя — он проверяет логику, задаёт вопросы и показывает слабые места.</div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.markdown('<div class="coach-quick">', unsafe_allow_html=True)
        quick_cols = st.columns(2)
        for idx, label in enumerate(QUICK_COACH_ACTIONS):
            with quick_cols[idx % 2]:
                if st.button(label, key=f"quick_{step['id']}_{idx}", use_container_width=True):
                    answer_text = st.session_state.get(f"answer_{step['id']}", st.session_state.step_answers.get(step["id"], ""))
                    _ask_coach(step, step["id"], label, answer_text)
        st.markdown('</div>', unsafe_allow_html=True)

        chat_key = step["id"]
        if chat_key not in st.session_state.step_chats:
            st.session_state.step_chats[chat_key] = []
        with st.container(height=340):
            if not st.session_state.step_chats[chat_key]:
                st.markdown(
                    '<div class="empty-state"><b>Пока сообщений нет</b><br>Спроси коуча про структуру, пробелы в логике или попроси проверить твой ответ.</div>',
                    unsafe_allow_html=True,
                )
            else:
                for msg in st.session_state.step_chats[chat_key]:
                    css_class = "coach-msg" if msg["role"] == "coach" else "student-msg"
                    label = "Coach" if msg["role"] == "coach" else "Ты"
                    st.markdown(
                        f'<div class="{css_class}"><b>{escape(label)}</b><br>{escape(msg["text"]).replace(chr(10), "<br>")}</div>',
                        unsafe_allow_html=True,
                    )

        coach_input = st.text_input(
            "Сообщение коучу",
            placeholder="Например: проверь структуру моего issue tree или найди слабые места в логике.",
            key=f"coach_input_{chat_key}",
            label_visibility="collapsed",
        )
        c1, c2 = st.columns([1, 1])
        with c1:
            if st.button("Задать вопрос", use_container_width=True, key=f"ask_{chat_key}"):
                answer_text = st.session_state.get(f"answer_{step['id']}", st.session_state.step_answers.get(step["id"], ""))
                if coach_input.strip():
                    _ask_coach(step, chat_key, coach_input.strip(), answer_text)
                else:
                    st.warning("Сначала напиши вопрос")
        with c2:
            if st.button("Проверить мой ответ", type="primary", use_container_width=True, key=f"review_{chat_key}"):
                answer_text = st.session_state.get(f"answer_{step['id']}", st.session_state.step_answers.get(step["id"], ""))
                if answer_text.strip():
                    _ask_coach(step, chat_key, "Проверь мой ответ и дай 3 конкретных замечания.", answer_text)
                else:
                    st.warning("Сначала заполни поле слева")
        st.markdown('</div>', unsafe_allow_html=True)


def render_radar_chart(criteria_scores: list[dict[str, Any]]) -> None:
    try:
        import plotly.graph_objects as go

        if not criteria_scores:
            return
        names = [item.get("name", f"Критерий {idx + 1}") for idx, item in enumerate(criteria_scores)]
        scores = [max(0, min(10, int(item.get("score", 0)))) for item in criteria_scores]
        names_closed = names + [names[0]]
        scores_closed = scores + [scores[0]]
        fig = go.Figure()
        fig.add_trace(
            go.Scatterpolar(
                r=scores_closed,
                theta=names_closed,
                fill="toself",
                line=dict(width=2),
                marker=dict(size=5),
            )
        )
        fig.update_layout(
            showlegend=False,
            height=430,
            margin=dict(l=40, r=40, t=30, b=30),
            polar=dict(radialaxis=dict(visible=True, range=[0, 10], tickvals=[2, 4, 6, 8, 10])),
        )
        st.plotly_chart(fig, use_container_width=True)
    except Exception:
        st.info("График недоступен — проверь, что установлен plotly.")


def render_structured_evaluation(eval_data: dict[str, Any]) -> None:
    criteria = eval_data.get("criteria", [])
    total = eval_data.get("total_score", sum(int(item.get("score", 0)) for item in criteria))
    strengths = eval_data.get("strengths", [])
    improvements = eval_data.get("improvements", [])
    tips = eval_data.get("top_3_tips", [])

    left, right = st.columns([1.1, 0.9], gap="large")
    with left:
        st.markdown(
            f'''
            <div class="score-box">
                <div class="big">{total}</div>
                <div class="small">из 100 баллов</div>
            </div>
            ''',
            unsafe_allow_html=True,
        )
        if criteria:
            render_radar_chart(criteria)
    with right:
        box1, box2 = st.columns(2)
        with box1:
            st.markdown('<div class="bullet-card"><b>Сильные стороны</b>', unsafe_allow_html=True)
            for item in strengths or ["Пока нет структурированного вывода."]:
                st.markdown(f"- {item}")
            st.markdown('</div>', unsafe_allow_html=True)
        with box2:
            st.markdown('<div class="bullet-card"><b>Зоны роста</b>', unsafe_allow_html=True)
            for item in improvements or ["Пока нет структурированного вывода."]:
                st.markdown(f"- {item}")
            st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('<div class="bullet-card" style="margin-top:0.8rem;"><b>Следующие действия</b>', unsafe_allow_html=True)
        for idx, item in enumerate(tips or ["Доработай слабые блоки и перезапусти оценку."], start=1):
            st.markdown(f"**{idx}.** {item}")
        st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown('<div class="section-title">Детальная оценка по критериям</div>', unsafe_allow_html=True)
    for item in criteria:
        score = max(0, min(10, int(item.get("score", 0))))
        name = item.get("name", "Критерий")
        comment = item.get("comment", "")
        recommendation = item.get("recommendation", "")
        with st.expander(f"{name} — {score}/10"):
            st.markdown(f'<span class="criterion-chip">{score}/10</span>', unsafe_allow_html=True)
            if comment:
                st.markdown(f"**Комментарий:** {comment}")
            if recommendation:
                st.markdown(f"**Как улучшить:** {recommendation}")
    st.markdown('</div>', unsafe_allow_html=True)


def render_evaluation_page() -> None:
    render_hero(
        "Итоговая оценка",
        "Жюри смотрит не только на идеи, но и на логику от проблемы к решению, экономике и плану внедрения.",
        "Что делать после оценки",
        "Вернись к слабым блокам, усили аргументацию и повторно прогони решение через rubric-жюри.",
    )

    answers_summary = ""
    filled = 0
    for step in CASE_STEPS:
        answer = st.session_state.step_answers.get(step["id"], "")
        if answer.strip():
            filled += 1
        answers_summary += f"\n\n### {step['title']}\n{answer if answer.strip() else '(пропущено)'}"

    side, main = st.columns([0.8, 1.2], gap="large")
    with side:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown('<div class="section-title">Статус решения</div>', unsafe_allow_html=True)
        st.metric("Заполнено блоков", f"{filled}/{len(CASE_STEPS)}")
        for step in CASE_STEPS:
            done = "✅" if st.session_state.step_answers.get(step["id"], "").strip() else "⬜"
            st.write(f"{done} {step['short_title']}")
        st.markdown('</div>', unsafe_allow_html=True)
        if st.button("Вернуться к решению", use_container_width=True):
            st.session_state.page = "solve"
            st.rerun()
        if st.button("Начать заново", use_container_width=True):
            reset_workflow()
            st.rerun()

    with main:
        eval_data = st.session_state.evaluation_data
        if not eval_data and not st.session_state.evaluation:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            if filled == 0:
                st.warning("Сначала заполни хотя бы один блок решения.")
            else:
                st.info(f"Заполнено {filled} из {len(CASE_STEPS)} блоков. Чем полнее решение, тем полезнее фидбэк жюри.")
                if st.button("Получить оценку от Rubric-жюри", type="primary", use_container_width=True):
                    eval_prompt = f"""Оцени решение бизнес-кейса.

КЕЙС:
{truncate_text(st.session_state.case_text, MAX_EVAL_CASE)}

РЕШЕНИЕ СТУДЕНТА:
{answers_summary}

Дай оценку по всем 10 критериям рубрики. Ответ строго в JSON."""
                    with st.spinner("Жюри оценивает решение..."):
                        raw_eval = call_yandex_gpt(RUBRIC_SYSTEM, eval_prompt, temperature=0.25, max_tokens=2600)
                        st.session_state.evaluation = raw_eval
                        parsed = parse_rubric_json(raw_eval)
                        if parsed and "criteria" in parsed:
                            st.session_state.evaluation_data = parsed
                        st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)
        elif eval_data:
            render_structured_evaluation(eval_data)
        else:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown('<div class="section-title">Сырой ответ жюри</div>', unsafe_allow_html=True)
            st.markdown(st.session_state.evaluation)
            st.markdown('</div>', unsafe_allow_html=True)
            if st.button("Попробовать оценку ещё раз", use_container_width=True):
                st.session_state.evaluation = ""
                st.session_state.evaluation_data = None
                st.rerun()


def main() -> None:
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    init_session_state()
    if st.session_state.page == "start":
        render_start_page()
    elif st.session_state.page == "solve":
        render_solve_page()
    else:
        render_evaluation_page()


if __name__ == "__main__":
    main()

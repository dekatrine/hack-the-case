"""
Hack the Case — AI-симулятор решения бизнес-кейсов
Streamlit-приложение с YandexGPT API
"""

import streamlit as st
import requests
import json
import time

# ─────────────────────────────────────────────
# КОНФИГУРАЦИЯ
# ─────────────────────────────────────────────

st.set_page_config(
    page_title="Hack the Case",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────
# YandexGPT API
# ─────────────────────────────────────────────

YANDEX_GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"


def get_api_credentials():
    api_key = st.secrets.get("YANDEX_API_KEY", "")
    folder_id = st.secrets.get("YANDEX_FOLDER_ID", "")
    model = st.secrets.get("YANDEX_MODEL", "yandexgpt-lite")
    return api_key, folder_id, model


def call_yandex_gpt(system_prompt: str, user_prompt: str, temperature: float = 0.6) -> str:
    api_key, folder_id, model = get_api_credentials()

    if not api_key or not folder_id:
        return "Не заданы YANDEX_API_KEY и YANDEX_FOLDER_ID. Добавьте их в Settings -> Secrets на Streamlit Cloud."

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
            "maxTokens": 4000,
        },
        "messages": [
            {"role": "system", "text": system_prompt},
            {"role": "user", "text": user_prompt},
        ],
    }

    try:
        resp = requests.post(YANDEX_GPT_URL, headers=headers, json=body, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return data["result"]["alternatives"][0]["message"]["text"]
    except requests.exceptions.HTTPError:
        return f"Ошибка API ({resp.status_code}): {resp.text}"
    except Exception as e:
        return f"Ошибка: {e}"


# ─────────────────────────────────────────────
# ДАННЫЕ: ЭТАПЫ И ФРЕЙМВОРКИ
# ─────────────────────────────────────────────

CASE_STEPS = [
    {
        "id": "issue_tree",
        "title": "1. Issue Tree / Problem Tree",
        "description": "Декомпозиция проблемы: разбей задачу на MECE-компоненты",
        "case_hint": "Внимательно прочитай раздел **Проблема** в условии кейса. Выдели главную проблему и разложи её на подпроблемы. Используй данные из кейса, чтобы определить ключевые ветки дерева.",
        "frameworks": ["Issue Tree", "MECE-принцип", "Problem Tree"],
        "coach_prompt": """Ты — Case Coach, эксперт по бизнес-консалтингу в стиле McKinsey/BCG.
Студент работает над блоком Issue Tree. Твоя задача — НЕ давать готовый ответ, а:
- Задавать наводящие вопросы
- Проверять MECE (Mutually Exclusive, Collectively Exhaustive)
- Если студент застрял — дать подсказку, но не решение
- Спрашивать: "Все ли ветки ты учёл? Нет ли пересечений?"
Отвечай на русском. Будь требовательным, но поддерживающим.""",
    },
    {
        "id": "research",
        "title": "2. Ресёрч и анализ рынка",
        "description": "Анализ внешней среды: рынок, конкуренты, тренды",
        "case_hint": "Обрати внимание на раздел **Контекст** — там описаны тренды рынка, конкуренция и позиция компании. Используй **Данные** (доля рынка, рост продаж) для market sizing и оценки конкурентного ландшафта.",
        "frameworks": ["PEST / PESTEL", "5 Porter Forces", "SWOT", "Benchmarking", "Market Sizing"],
        "coach_prompt": """Ты — Case Coach. Студент работает над блоком Ресёрч/Анализ рынка.
Твоя задача — НЕ давать готовые данные, а:
- Направлять: "Какие макро-факторы влияют? Используй PEST"
- Проверять логику market sizing: "Откуда эта цифра? Как ты оцениваешь TAM/SAM/SOM?"
- Спрашивать про конкурентов: "Кто основные игроки? Какие барьеры входа по Porter?"
- Подсказывать фреймворк, если студент не знает какой применить
Отвечай на русском.""",
    },
    {
        "id": "segmentation",
        "title": "3. Сегментация и инсайты",
        "description": "Определи целевую аудиторию и ключевые инсайты",
        "case_hint": "Из раздела **Компания** и **Контекст** определи, кто основные клиенты. Используй данные о количестве клиентов и их поведении. Подумай, какие сегменты наиболее прибыльны и почему.",
        "frameworks": ["Customer Segmentation", "Persona", "JTBD (Jobs To Be Done)", "Pain-Gain / Need-state", "ABC-анализ"],
        "coach_prompt": """Ты — Case Coach. Студент работает над сегментацией аудитории.
Твоя задача:
- Проверять: "По каким критериям ты сегментируешь? Демография? Поведение? Потребности?"
- Направлять к JTBD: "Какую 'работу' выполняет продукт для клиента?"
- Если поверхностно: "Опиши persona подробнее — что у неё болит? Какой gain?"
- Проверять ABC-логику: "Кто твой сегмент A? Почему именно он приоритетный?"
Отвечай на русском. Не давай готовых ответов.""",
    },
    {
        "id": "cjm",
        "title": "4. CJM и сервисный дизайн",
        "description": "Customer Journey Map: путь клиента от осознания до лояльности",
        "case_hint": "Подумай, как клиент узнаёт о продукте/услуге компании из кейса, как принимает решение о покупке и что происходит после. Используй данные о каналах продаж из раздела **Компания**.",
        "frameworks": ["CJM (Customer Journey Map)", "Penetration Funnel", "Funnel Analysis", "AARRR"],
        "coach_prompt": """Ты — Case Coach. Студент строит CJM (Customer Journey Map).
Твоя задача:
- Проверять полноту: "Все ли этапы пути клиента ты описал? Awareness -> Consideration -> Purchase -> Retention -> Advocacy?"
- Спрашивать про touchpoints: "Где клиент соприкасается с продуктом? Где pain points?"
- Направлять к воронке: "Какая конверсия на каждом этапе? Где bottleneck?"
- Напоминать про AARRR если уместно
Отвечай на русском.""",
    },
    {
        "id": "initiatives",
        "title": "5. Инициативы и решения",
        "description": "Предложи конкретные решения и приоритизируй их",
        "case_hint": "Вернись к **Проблеме** и **Вопросу для решения**. Твои инициативы должны напрямую отвечать на вопрос из кейса. Учитывай **Дополнительные вводные** — бюджет и ограничения.",
        "frameworks": ["Driver-based Solution Design", "Prioritization Matrix", "2x2 Matrix", "Ansoff Matrix", "4P / 7P Marketing Mix"],
        "coach_prompt": """Ты — Case Coach. Студент предлагает инициативы/решения.
Твоя задача:
- Проверять связь с проблемой: "Как это решение связано с корневой причиной из issue tree?"
- Требовать приоритизацию: "Расставь по impact/effort — что даёт максимум при минимуме затрат?"
- Проверять 4P: "Ты продумал все P? Product понятен, а Place и Promotion?"
- Спрашивать: "Почему именно это решение? Какие альтернативы ты отбросил и почему?"
Отвечай на русском.""",
    },
    {
        "id": "metrics",
        "title": "6. Метрики и эксперименты",
        "description": "Определи KPI, North Star Metric, план экспериментов",
        "case_hint": "Используй **Данные** из кейса (выручка, рост, количество клиентов) как базовые метрики. Подумай, какая метрика лучше всего отражает успех решения проблемы из кейса.",
        "frameworks": ["Metric Hierarchy", "NSM (North Star Metric)", "HEART", "AARRR", "Cohort Analysis"],
        "coach_prompt": """Ты — Case Coach. Студент определяет метрики и эксперименты.
Твоя задача:
- Спрашивать: "Какая у тебя North Star Metric? Почему именно она?"
- Проверять иерархию: "Как NSM декомпозируется на метрики уровня ниже?"
- Направлять: "Как ты будешь измерять успех? Какой эксперимент проведёшь первым?"
- Проверять HEART: "Happiness, Engagement, Adoption, Retention, Task success — что отслеживаешь?"
Отвечай на русском.""",
    },
    {
        "id": "economics",
        "title": "7. Экономика и финмодель",
        "description": "Unit Economics, Business Case, NPV/IRR",
        "case_hint": "Используй **Данные** из кейса — выручку, количество клиентов, долю рынка. Рассчитай unit economics на основе этих цифр. Учитывай бюджетные ограничения из **Дополнительных вводных**.",
        "frameworks": ["Unit Economics", "Business Case / Financial Model", "NPV / IRR / PBP", "BCG Matrix"],
        "coach_prompt": """Ты — Case Coach. Студент строит финансовую модель.
Твоя задача:
- Проверять unit economics: "Какой CAC? LTV? LTV/CAC ratio?"
- Требовать sanity check: "Эта выручка реалистична? Откуда цифры?"
- Спрашивать: "Какой payback period? Когда проект выходит в плюс?"
- Если есть NPV: "Какую ставку дисконтирования ты взял и почему?"
Отвечай на русском. Не считай за студента — задавай вопросы.""",
    },
    {
        "id": "risks",
        "title": "8. Риски и митигация",
        "description": "Risk Matrix, план митигации, сценарный анализ",
        "case_hint": "Вернись к **Контексту** — конкуренция, тренды, ограничения. Какие из них создают риски для твоих инициатив? Подумай также о внутренних рисках компании.",
        "frameworks": ["Risk Matrix", "McKinsey 7S (для орг. рисков)", "SWOT (угрозы и слабости)"],
        "coach_prompt": """Ты — Case Coach. Студент анализирует риски.
Твоя задача:
- Проверять полноту: "Ты рассмотрел рыночные, операционные, финансовые, репутационные риски?"
- Требовать оценку: "Какова вероятность? Какой impact? Покажи на risk matrix"
- Спрашивать про митигацию: "Как ты будешь снижать каждый ключевой риск?"
- Направлять: "Какой worst-case scenario? Что будешь делать?"
Отвечай на русском.""",
    },
    {
        "id": "roadmap",
        "title": "9. Roadmap и реализация",
        "description": "Gantt chart, Product Roadmap, план внедрения",
        "case_hint": "Учитывай **сроки** и **бюджет** из Дополнительных вводных. Расставь приоритеты: что запустить первым (quick wins), а что требует подготовки. Свяжи roadmap с инициативами из этапа 5.",
        "frameworks": ["Gantt Chart", "Product Roadmap", "Implementation Plan"],
        "coach_prompt": """Ты — Case Coach. Студент строит план реализации.
Твоя задача:
- Проверять реалистичность: "Сроки адекватны? Нет ли параллельных задач, зависящих друг от друга?"
- Спрашивать: "Кто отвечает за каждый этап? Какие ресурсы нужны?"
- Направлять: "Покажи quick wins — что можно запустить в первый месяц?"
- Проверять: "Есть ли контрольные точки (milestones)? Как ты узнаешь, что всё идёт по плану?"
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
    "Средний": "Кейс среднего уровня: несколько направлений, нужен market sizing, конкурентный анализ.",
    "Продвинутый": "Сложный кейс как на Changellenge/McKinsey: неоднозначная проблема, международный рынок.",
}

# ─────────────────────────────────────────────
# ПРОМПТЫ
# ─────────────────────────────────────────────

CASE_GENERATION_SYSTEM = """Ты — генератор бизнес-кейсов для кейс-чемпионатов уровня Changellenge, McKinsey Solve, BCG.
Генерируй реалистичные кейсы на русском языке.

Структура кейса:
1. **Компания** — название (вымышленное), отрасль, масштаб, краткое описание
2. **Контекст** — рыночная ситуация, тренды, позиция компании
3. **Проблема** — чёткая формулировка бизнес-задачи
4. **Данные** — ключевые цифры (выручка, доля рынка, количество клиентов, рост/падение)
5. **Вопрос для решения** — конкретный вопрос, на который нужно ответить
6. **Дополнительные вводные** — ограничения, бюджет, сроки

Кейс должен быть решаемым с помощью стандартных консалтинговых фреймворков.
Не давай подсказок по решению. Пиши на русском."""

RUBRIC_SYSTEM = """Ты — Rubric-жюри, автоматизированный оценщик бизнес-кейсов.
Оцениваешь решение по рубрике из 10 критериев, каждый от 1 до 10 баллов.

КРИТЕРИИ ОЦЕНКИ:
1. **Структура и MECE** (1-10): Issue tree логичное? Нет пересечений? Полное?
2. **Глубина анализа рынка** (1-10): Market sizing, PEST, Porter — насколько глубоко?
3. **Сегментация и инсайты** (1-10): Чёткие сегменты? JTBD? Personas?
4. **CJM и воронка** (1-10): Полный путь клиента? Touchpoints? Конверсии?
5. **Качество инициатив** (1-10): Решения связаны с проблемой? Приоритизированы?
6. **Метрики и KPI** (1-10): NSM определена? Иерархия метрик? Эксперименты?
7. **Финансовая модель** (1-10): Unit economics? Реалистичные прогнозы? ROI?
8. **Анализ рисков** (1-10): Полнота? Risk matrix? Митигация?
9. **Roadmap** (1-10): Реалистичный план? Milestones? Ответственные?
10. **Общая связность** (1-10): Решение целостное? Логика от проблемы к решению?

Для каждого критерия: поставь балл, объясни почему, дай рекомендацию.
В конце: общий балл /100, сильные стороны, зоны роста, 3 конкретных совета.
Пиши на русском. Будь конструктивным но строгим."""


# ─────────────────────────────────────────────
# СТИЛИ — светлая тема в стиле Karpov Courses
# ─────────────────────────────────────────────

CUSTOM_CSS = """
<style>
    /* === ОСНОВА === */
    .stApp {
        background-color: #f5f5f7 !important;
        color: #2d2d3f !important;
    }

    /* Все тексты — тёмные */
    .stApp, .stApp p, .stApp span, .stApp li, .stApp label, .stApp div {
        color: #2d2d3f !important;
    }

    .stApp h1, .stApp h2, .stApp h3, .stApp h4 {
        color: #1a1a2e !important;
    }

    /* Фикс для text_area и text_input */
    .stTextArea textarea, .stTextInput input {
        color: #2d2d3f !important;
        background-color: #ffffff !important;
        border: 1px solid #d1d5db !important;
        border-radius: 8px !important;
    }

    .stTextArea textarea::placeholder, .stTextInput input::placeholder {
        color: #9ca3af !important;
    }

    /* Selectbox */
    .stSelectbox > div > div {
        color: #2d2d3f !important;
        background-color: #ffffff !important;
    }

    /* Sidebar — тёмная */
    section[data-testid="stSidebar"] {
        background-color: #1a1a2e !important;
    }
    section[data-testid="stSidebar"] * {
        color: #e0e0e0 !important;
    }
    section[data-testid="stSidebar"] .stButton > button {
        background-color: #2d2d5e !important;
        color: #ffffff !important;
        border: none !important;
    }
    section[data-testid="stSidebar"] .stButton > button:hover {
        background-color: #4a4a8a !important;
    }

    /* === HEADER === */
    .main-header {
        background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
        padding: 2rem 2.5rem;
        border-radius: 16px;
        margin-bottom: 2rem;
    }
    .main-header h1 {
        color: #ffffff !important;
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
    }
    .main-header p {
        color: rgba(255,255,255,0.85) !important;
        margin: 0.5rem 0 0 0;
        font-size: 1.05rem;
    }

    /* === КАРТОЧКИ === */
    .card {
        background: #ffffff;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        border: 1px solid #e8e8ed;
    }
    .card h3, .card h4 {
        color: #1a1a2e !important;
        margin-top: 0;
    }
    .card p, .card li, .card span {
        color: #4a4a5a !important;
    }

    /* === ФРЕЙМВОРК-ТЕГИ === */
    .framework-tag {
        display: inline-block;
        background: #ede9fe;
        color: #6c5ce7 !important;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.82rem;
        margin: 0.15rem;
        font-weight: 500;
    }

    /* === ПОДСКАЗКА ПО КЕЙСУ === */
    .case-hint {
        background: #f0f4ff;
        border-left: 4px solid #6c5ce7;
        border-radius: 0 8px 8px 0;
        padding: 1rem 1.25rem;
        margin: 1rem 0;
    }
    .case-hint p, .case-hint span {
        color: #3d3d5c !important;
        font-size: 0.92rem;
        line-height: 1.5;
    }
    .case-hint strong {
        color: #6c5ce7 !important;
    }

    /* === ЧАТ === */
    .coach-msg {
        background: #f8f7ff;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        margin: 0.5rem 0;
        border-left: 3px solid #6c5ce7;
    }
    .coach-msg b, .coach-msg strong { color: #6c5ce7 !important; }
    .coach-msg p, .coach-msg span, .coach-msg br { color: #3d3d5c !important; }

    .student-msg {
        background: #fff8f0;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        margin: 0.5rem 0;
        border-left: 3px solid #f59e0b;
    }
    .student-msg b, .student-msg strong { color: #d97706 !important; }
    .student-msg p, .student-msg span, .student-msg br { color: #4a4a5a !important; }

    /* === ПРОГРЕСС-БАР === */
    .progress-container {
        background: #e0e0e8;
        border-radius: 10px;
        height: 10px;
        margin: 1rem 0 2rem 0;
    }
    .progress-fill {
        background: linear-gradient(90deg, #6c5ce7, #a29bfe);
        height: 100%;
        border-radius: 10px;
        transition: width 0.3s;
    }

    /* === КНОПКИ === */
    .stButton > button {
        border-radius: 8px !important;
        font-weight: 500 !important;
        padding: 0.5rem 1.5rem !important;
        min-height: 42px !important;
        transition: all 0.15s !important;
    }

    /* Primary кнопки */
    .stApp [data-testid="stBaseButton-primary"] {
        background-color: #6c5ce7 !important;
        color: #ffffff !important;
        border: none !important;
    }
    .stApp [data-testid="stBaseButton-primary"]:hover {
        background-color: #5a4bd1 !important;
    }

    /* Secondary кнопки */
    .stApp [data-testid="stBaseButton-secondary"] {
        background-color: #ffffff !important;
        color: #6c5ce7 !important;
        border: 1px solid #6c5ce7 !important;
    }
    .stApp [data-testid="stBaseButton-secondary"]:hover {
        background-color: #f8f7ff !important;
    }

    /* === ИНСТРУКЦИИ К КНОПКАМ === */
    .btn-hint {
        font-size: 0.78rem;
        color: #9ca3af !important;
        margin-top: 0.3rem;
        line-height: 1.3;
    }

    /* === METRIC === */
    [data-testid="stMetricValue"] {
        color: #6c5ce7 !important;
    }
    [data-testid="stMetricLabel"] {
        color: #4a4a5a !important;
    }

    /* === CAPTION === */
    .stCaption, small {
        color: #9ca3af !important;
    }

    /* === EXPANDER === */
    .streamlit-expanderHeader {
        color: #2d2d3f !important;
        background-color: #ffffff !important;
    }

    /* === TABS / DIVIDER === */
    hr {
        border-color: #e8e8ed !important;
    }
</style>
"""


# ─────────────────────────────────────────────
# SESSION STATE
# ─────────────────────────────────────────────

def init_session_state():
    defaults = {
        "page": "start",
        "case_text": "",
        "case_industry": "",
        "case_difficulty": "",
        "current_step": 0,
        "step_answers": {},
        "step_chats": {},
        "evaluation": "",
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


# ─────────────────────────────────────────────
# СТРАНИЦА 1: ГЕНЕРАЦИЯ КЕЙСА
# ─────────────────────────────────────────────

def page_start():
    st.markdown("""
    <div class="main-header">
        <h1>Hack the Case</h1>
        <p>AI-симулятор решения бизнес-кейсов. Учись думать как консультант.</p>
    </div>
    """, unsafe_allow_html=True)

    col1, col2 = st.columns([2, 1], gap="large")

    with col1:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("#### Настройки кейса")

        industry = st.selectbox("Отрасль", INDUSTRIES, index=0)
        difficulty = st.selectbox("Уровень сложности", list(DIFFICULTY_LEVELS.keys()), index=1)
        st.caption(DIFFICULTY_LEVELS[difficulty])

        extra_context = st.text_area(
            "Дополнительный контекст (необязательно)",
            placeholder="Например: международная экспансия, запуск нового продукта...",
            height=80,
        )

        if st.button("Сгенерировать кейс", type="primary", use_container_width=True):
            with st.spinner("Генерирую кейс..."):
                prompt = f"Сгенерируй бизнес-кейс.\nОтрасль: {industry}\nСложность: {difficulty} — {DIFFICULTY_LEVELS[difficulty]}"
                if extra_context:
                    prompt += f"\nДополнительный контекст: {extra_context}"
                case_text = call_yandex_gpt(CASE_GENERATION_SYSTEM, prompt, temperature=0.8)
                st.session_state.case_text = case_text
                st.session_state.case_industry = industry
                st.session_state.case_difficulty = difficulty
                st.session_state.step_answers = {}
                st.session_state.step_chats = {}
                st.session_state.current_step = 0
                st.session_state.evaluation = ""

        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("#### Как это работает")
        st.markdown("""
**1. Генерация** — AI создаёт уникальный бизнес-кейс по твоим параметрам

**2. Решение по этапам** — 9 шагов, как на настоящем кейс-чемпионате

**3. AI-Coach** — на каждом шаге задаёт наводящие вопросы, но не решает за тебя

**4. Rubric-жюри** — в конце ставит баллы по 10 критериям из 100
        """)
        st.markdown('</div>', unsafe_allow_html=True)

        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("#### Этапы решения")
        for step in CASE_STEPS:
            st.markdown(f"- {step['title']}")
        st.markdown('</div>', unsafe_allow_html=True)

    if st.session_state.case_text:
        st.markdown("---")
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("#### Твой кейс")
        st.markdown(st.session_state.case_text)
        st.markdown('</div>', unsafe_allow_html=True)

        col_a, col_b = st.columns(2, gap="medium")
        with col_a:
            if st.button("Начать решение", type="primary", use_container_width=True):
                st.session_state.page = "solve"
                st.rerun()
        with col_b:
            if st.button("Сгенерировать другой", use_container_width=True):
                st.session_state.case_text = ""
                st.rerun()


# ─────────────────────────────────────────────
# СТРАНИЦА 2: РЕШЕНИЕ ПО ЭТАПАМ
# ─────────────────────────────────────────────

def page_solve():
    current = st.session_state.current_step
    step = CASE_STEPS[current]
    total = len(CASE_STEPS)

    completed = sum(1 for s in CASE_STEPS if s["id"] in st.session_state.step_answers)
    progress_pct = int(completed / total * 100)

    st.markdown(f"""
    <div class="main-header">
        <h1>Hack the Case — Решение</h1>
        <p>Этап {current + 1} из {total}  |  Прогресс: {completed} из {total} блоков завершено</p>
    </div>
    <div class="progress-container">
        <div class="progress-fill" style="width: {progress_pct}%"></div>
    </div>
    """, unsafe_allow_html=True)

    # === SIDEBAR ===
    with st.sidebar:
        st.markdown("### Навигация")
        for i, s in enumerate(CASE_STEPS):
            done = s["id"] in st.session_state.step_answers
            icon = "✅" if done else ("▶️" if i == current else "⬜")
            if st.button(f"{icon} {s['title']}", key=f"nav_{i}", use_container_width=True):
                st.session_state.current_step = i
                st.rerun()

        st.markdown("---")
        if st.button("Завершить и получить оценку", type="primary", use_container_width=True):
            st.session_state.page = "evaluate"
            st.rerun()
        if st.button("Назад к генерации", use_container_width=True):
            st.session_state.page = "start"
            st.rerun()

    # === ОСНОВНОЙ КОНТЕНТ ===
    col_work, col_coach = st.columns([1, 1], gap="large")

    with col_work:
        # Заголовок этапа
        st.markdown(f'<div class="card"><h3>{step["title"]}</h3><p>{step["description"]}</p></div>', unsafe_allow_html=True)

        # Фреймворки
        tags = " ".join([f'<span class="framework-tag">{f}</span>' for f in step["frameworks"]])
        st.markdown(f"**Рекомендуемые фреймворки:** {tags}", unsafe_allow_html=True)

        # Подсказка из условия кейса
        st.markdown(f"""
        <div class="case-hint">
            <p><strong>Подсказка из условия кейса:</strong> {step['case_hint']}</p>
        </div>
        """, unsafe_allow_html=True)

        # Условие кейса (сворачиваемое)
        with st.expander("Показать полное условие кейса"):
            st.markdown(st.session_state.case_text)

        # Поле ответа
        answer_key = step["id"]
        existing_answer = st.session_state.step_answers.get(answer_key, "")
        answer = st.text_area(
            "Твоё решение по этому блоку",
            value=existing_answer,
            height=250,
            placeholder=f"Опиши своё решение для этапа '{step['title']}'...",
            key=f"answer_{answer_key}",
        )

        # Кнопки — ровные
        btn_col1, btn_col2 = st.columns(2, gap="small")
        with btn_col1:
            if st.button("Сохранить ответ", use_container_width=True, key=f"save_{answer_key}"):
                st.session_state.step_answers[answer_key] = answer
                st.success("Ответ сохранён!")
            st.markdown('<p class="btn-hint">Сохраняет текст, чтобы не потерять при переключении этапов</p>', unsafe_allow_html=True)

        with btn_col2:
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

    with col_coach:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("#### AI Coach")
        st.markdown('</div>', unsafe_allow_html=True)

        # Чат
        chat_key = step["id"]
        if chat_key not in st.session_state.step_chats:
            st.session_state.step_chats[chat_key] = []

        chat_container = st.container(height=300)
        with chat_container:
            if not st.session_state.step_chats[chat_key]:
                st.markdown('<p style="color: #9ca3af; text-align: center; padding: 2rem;">Задай вопрос коучу или нажми "Проверь мой ответ"</p>', unsafe_allow_html=True)
            for msg in st.session_state.step_chats[chat_key]:
                css_class = "coach-msg" if msg["role"] == "coach" else "student-msg"
                label = "Coach" if msg["role"] == "coach" else "Ты"
                st.markdown(f'<div class="{css_class}"><b>{label}:</b><br>{msg["text"]}</div>', unsafe_allow_html=True)

        # Поле ввода
        coach_input = st.text_input(
            "Сообщение коучу",
            placeholder="Задай вопрос или попроси совет...",
            key=f"coach_input_{chat_key}",
            label_visibility="collapsed",
        )

        # Кнопки коуча — ровные
        c1, c2 = st.columns(2, gap="small")
        with c1:
            if st.button("Спросить коуча", use_container_width=True, key=f"ask_{chat_key}"):
                if coach_input:
                    _ask_coach(step, chat_key, coach_input, answer)
                else:
                    st.warning("Напиши вопрос в поле выше")
            st.markdown('<p class="btn-hint">Задай свободный вопрос по этапу, фреймворку или подходу</p>', unsafe_allow_html=True)

        with c2:
            if st.button("Проверь мой ответ", type="primary", use_container_width=True, key=f"review_{chat_key}"):
                if answer.strip():
                    _ask_coach(step, chat_key, "Проверь мой ответ и дай фидбек.", answer)
                else:
                    st.warning("Сначала напиши ответ слева")
            st.markdown('<p class="btn-hint">Коуч прочитает твой ответ слева и даст структурированный фидбек</p>', unsafe_allow_html=True)

        st.markdown('</div>', unsafe_allow_html=True)


def _ask_coach(step, chat_key, user_message, answer_text):
    st.session_state.step_chats[chat_key].append({
        "role": "student",
        "text": user_message,
    })

    context = f"""Кейс: {st.session_state.case_text[:1500]}

Текущий этап: {step['title']}
Рекомендуемые фреймворки: {', '.join(step['frameworks'])}

Ответ студента на этот блок:
{answer_text if answer_text.strip() else '(студент ещё не написал ответ)'}

История диалога:
{chr(10).join([f"{'Студент' if m['role']=='student' else 'Коуч'}: {m['text']}" for m in st.session_state.step_chats[chat_key][-6:]])}

Сообщение студента: {user_message}"""

    with st.spinner("Коуч думает..."):
        response = call_yandex_gpt(step["coach_prompt"], context, temperature=0.5)

    st.session_state.step_chats[chat_key].append({
        "role": "coach",
        "text": response,
    })
    st.rerun()


# ─────────────────────────────────────────────
# СТРАНИЦА 3: ОЦЕНКА
# ─────────────────────────────────────────────

def page_evaluate():
    st.markdown("""
    <div class="main-header">
        <h1>Hack the Case — Оценка</h1>
        <p>Rubric-жюри анализирует твоё решение по 10 критериям</p>
    </div>
    """, unsafe_allow_html=True)

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
        st.markdown("#### Статус заполнения")
        st.metric("Заполнено блоков", f"{filled} / {len(CASE_STEPS)}")
        for step in CASE_STEPS:
            answer = st.session_state.step_answers.get(step["id"], "")
            icon = "✅" if answer.strip() else "⬜"
            st.write(f"{icon} {step['title']}")
        st.markdown('</div>', unsafe_allow_html=True)

        st.markdown("")
        if st.button("Вернуться к решению", use_container_width=True):
            st.session_state.page = "solve"
            st.rerun()
        if st.button("Начать заново", use_container_width=True):
            for key in ["case_text", "step_answers", "step_chats", "evaluation"]:
                st.session_state[key] = "" if key != "step_answers" and key != "step_chats" else {}
            st.session_state.page = "start"
            st.rerun()

    with col1:
        if not st.session_state.evaluation:
            if filled == 0:
                st.warning("Ты ещё не заполнил ни одного блока. Вернись к решению!")
            else:
                st.info(f"Заполнено {filled} из {len(CASE_STEPS)} блоков. Чем больше заполнено, тем точнее оценка.")
                if st.button("Получить оценку от Rubric-жюри", type="primary", use_container_width=True):
                    eval_prompt = f"""Оцени решение бизнес-кейса.

КЕЙС:
{st.session_state.case_text[:2000]}

РЕШЕНИЕ СТУДЕНТА:
{answers_summary}

Дай оценку по всем 10 критериям рубрики."""

                    with st.spinner("Жюри оценивает решение..."):
                        evaluation = call_yandex_gpt(RUBRIC_SYSTEM, eval_prompt, temperature=0.3)
                        st.session_state.evaluation = evaluation
                        st.rerun()
        else:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown("#### Результаты оценки")
            st.markdown(st.session_state.evaluation)
            st.markdown('</div>', unsafe_allow_html=True)


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)
    init_session_state()

    page = st.session_state.page
    if page == "start":
        page_start()
    elif page == "solve":
        page_solve()
    elif page == "evaluate":
        page_evaluate()


if __name__ == "__main__":
    main()

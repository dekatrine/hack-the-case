"""Учебные направления и главы внутри каждого.

Содержание построено по research-источникам:
- Product track: CIRCLES (Comprehend, Identify customer, Report needs,
  Cut, List, Evaluate, Summarize) + типы PM-кейсов (Design / Improvement /
  Growth / Strategy / Estimation / RCA), стандарт PM-собеседований FAANG.
- Business track: классические консалтинговые типы (Profitability,
  Market Entry, Pricing, M&A, Growth) + Issue Tree / MECE, Market Sizing,
  экономика и финальная рекомендация — стандарт McKinsey / BCG / Bain.
"""

PRODUCT_TRACK_CHAPTERS = [
    {
        "id": "p_clarify",
        "title": "Clarify the prompt",
        "circle": "C — Comprehend",
        "summary": "Уточни цель, контекст, продукт и пользователя до того, как генерировать идеи.",
        "skills": ["Clarifying questions", "Goal alignment", "Constraints"],
        "outcome": "Сформулирован goal в формате метрика + сегмент + горизонт.",
        "stepIds": ["clarify_objective", "case_archetype"],
    },
    {
        "id": "p_user",
        "title": "User & JTBD",
        "circle": "I — Identify customer",
        "summary": "Выбери primary user, опиши JTBD, контекст и pain points.",
        "skills": ["Personas", "JTBD", "User context"],
        "outcome": "1 primary user, 2-3 jobs, ranked pain points.",
        "stepIds": ["product_approach", "segmentation"],
    },
    {
        "id": "p_needs",
        "title": "Pain points & opportunities",
        "circle": "R — Report needs",
        "summary": "Преврати наблюдения о пользователе в проверяемые problem statements.",
        "skills": ["Problem statement", "Insight → opportunity"],
        "outcome": "Список pain points с severity и frequency.",
        "stepIds": ["cjm", "root_cause_analysis"],
    },
    {
        "id": "p_prioritize",
        "title": "Prioritization",
        "circle": "C — Cut through",
        "summary": "Отбери проблемы и решения по impact / effort, RICE, MoSCoW.",
        "skills": ["RICE", "Impact / effort", "Trade-offs"],
        "outcome": "1-2 проблемы выбраны с явным критерием.",
        "stepIds": ["initiatives"],
    },
    {
        "id": "p_solutions",
        "title": "Solution design",
        "circle": "L — List solutions",
        "summary": "Сгенерируй 3+ решения, опиши MVP и пользовательский сценарий.",
        "skills": ["Ideation", "MVP scoping", "User flow"],
        "outcome": "3 решения, выбран one MVP с обоснованием.",
        "stepIds": ["product_design", "ai_ml"],
    },
    {
        "id": "p_tradeoffs",
        "title": "Trade-offs & metrics",
        "circle": "E — Evaluate",
        "summary": "Опиши NSM, guardrail-метрики, эксперимент и trade-offs.",
        "skills": ["NSM", "Guardrails", "A/B test design"],
        "outcome": "NSM + 2 guardrail + дизайн эксперимента.",
        "stepIds": ["metrics", "experiments"],
    },
    {
        "id": "p_summary",
        "title": "Recommendation & next step",
        "circle": "S — Summarize",
        "summary": "Дай executive-ответ, риски, roadmap, первый шаг на 2 недели.",
        "skills": ["Executive summary", "Risks", "Roadmap"],
        "outcome": "Рекомендация в 3 предложениях + первый шаг.",
        "stepIds": ["risks", "roadmap", "final_synthesis", "reflection"],
    },
]

BUSINESS_TRACK_CHAPTERS = [
    {
        "id": "b_objective",
        "title": "Задача клиента",
        "circle": "01 · Setup",
        "summary": "Расшифруй вопрос: клиент, бизнес-модель, цель, ограничения, критерий решения.",
        "skills": ["Problem restatement", "Objective function", "Decision criteria"],
        "outcome": "Цель в виде метрики, ограничения, критерий выбора.",
        "stepIds": ["clarify_objective"],
    },
    {
        "id": "b_archetype",
        "title": "Тип кейса",
        "circle": "02 · Route",
        "summary": "Profitability, Market Entry, Pricing, M&A, Growth, RCA — выбери маршрут.",
        "skills": ["Case archetypes", "Framework selection"],
        "outcome": "Тип кейса + базовая структура анализа.",
        "stepIds": ["case_archetype"],
    },
    {
        "id": "b_tree",
        "title": "Issue tree & MECE",
        "circle": "03 · Structure",
        "summary": "Разложи проблему на MECE-ветки, добавь драйверы и проверяемые гипотезы.",
        "skills": ["MECE", "Driver tree", "Hypotheses"],
        "outcome": "Дерево 3-5 веток с гипотезами и нужными данными.",
        "stepIds": ["issue_tree"],
    },
    {
        "id": "b_market",
        "title": "Рынок и конкуренты",
        "circle": "04 · Outside-in",
        "summary": "Размер рынка, тренды, конкуренты, value chain, revenue / cost drivers.",
        "skills": ["Market sizing", "Porter 5F", "Value chain"],
        "outcome": "Sizing с диапазоном + 2-3 ключевых вывода.",
        "stepIds": ["research", "market_sizing"],
    },
    {
        "id": "b_diagnose",
        "title": "Диагностика и сегменты",
        "circle": "05 · Inside-out",
        "summary": "Сегментация, CJM, root cause через дерево метрик и разрезы.",
        "skills": ["Segmentation", "CJM", "Root cause"],
        "outcome": "Подтверждённая корневая причина с данными.",
        "stepIds": ["segmentation", "cjm", "root_cause_analysis"],
    },
    {
        "id": "b_solution",
        "title": "Решение и инициативы",
        "circle": "06 · Solve",
        "summary": "Сгенерируй инициативы, привязанные к root cause, оцени impact / effort.",
        "skills": ["Initiative design", "Impact / effort", "GTM"],
        "outcome": "3-5 инициатив с приоритетом и владельцем.",
        "stepIds": ["product_design", "go_to_market", "initiatives"],
    },
    {
        "id": "b_econ",
        "title": "Экономика и риски",
        "circle": "07 · Validate",
        "summary": "CAC, LTV, payback, NPV, break-even, sensitivity, top-3 риска.",
        "skills": ["Unit economics", "Sensitivity", "Risk register"],
        "outcome": "Бизнес-кейс с диапазоном и митигацией рисков.",
        "stepIds": ["economics", "risks", "metrics", "experiments"],
    },
    {
        "id": "b_recommend",
        "title": "Рекомендация и roadmap",
        "circle": "08 · Land",
        "summary": "Pyramid principle: вывод, 3 аргумента, доказательства, roadmap, первый шаг.",
        "skills": ["Pyramid principle", "Executive summary", "Roadmap"],
        "outcome": "1-page recommendation + roadmap 30/60/90.",
        "stepIds": ["roadmap", "final_synthesis", "reflection"],
    },
]

TRACKS = [
    {
        "id": "product",
        "name": "Продуктовые кейсы",
        "tagline": "PM-собеседования: FAANG, Яндекс, Авито, Tinkoff",
        "description": (
            "Структурированный подход CIRCLES к задачам design / improvement / "
            "growth / strategy. Отрабатывается логика продуктового мышления: от "
            "пользователя и JTBD до метрик, экспериментов и финальной рекомендации."
        ),
        "duration": "7 глав · ~90 минут практики",
        "chapters": PRODUCT_TRACK_CHAPTERS,
    },
    {
        "id": "business",
        "name": "Бизнес-кейсы",
        "tagline": "Консалтинг и кейс-чемпионаты: McKinsey, BCG, Bain, Changellenge",
        "description": (
            "Классическая консалтинговая воронка: тип кейса → issue tree → рынок → "
            "диагностика → инициативы → экономика → рекомендация. Готовит к "
            "интервью в стратегические консалтинговые фирмы и к финалам кейс-чемпионатов."
        ),
        "duration": "8 глав · ~120 минут практики",
        "chapters": BUSINESS_TRACK_CHAPTERS,
    },
]

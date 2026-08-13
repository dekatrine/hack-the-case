"""Учебные направления и главы внутри каждого.

MVP-скоуп сужен до одного трека: Product Manager.
CIRCLES (Comprehend, Identify customer, Report needs, Cut, List, Evaluate,
Summarize) + типы PM-кейсов (Design / Improvement / Growth / Strategy /
Estimation / RCA), стандарт PM-собеседований FAANG.

Business/consulting-трек вырезан из MVP (см. Notion: MVP-scope).
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
]

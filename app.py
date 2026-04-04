"""
Hack the Case — AI-симулятор решения бизнес-кейсов
Streamlit-приложение с YandexGPT API

Улучшения v2:
- Модульная структура (prompts.py, data.py, llm.py, styles.py)
- Retry-логика с exponential backoff для API
- Контекстная память: коуч знает ответы на предыдущие этапы
- Визуальный stepper вместо простого progress bar
- JSON-парсинг оценки + radar-chart (plotly)
"""

import streamlit as st
import json

from prompts import CASE_GENERATION_SYSTEM, RUBRIC_SYSTEM, COACH_PROMPTS
from data import CASE_STEPS, INDUSTRIES, DIFFICULTY_LEVELS, RUBRIC_CRITERIA_NAMES
from llm import call_yandex_gpt, build_coach_context, parse_rubric_json
from styles import CUSTOM_CSS

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
        "evaluation_data": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


# ─────────────────────────────────────────────
# ВИЗУАЛЬНЫЙ STEPPER
# ─────────────────────────────────────────────

def render_stepper(current, step_answers):
    short_labels = [
        "Issue Tree", "Ресёрч", "Сегмент.", "CJM",
        "Решения", "Метрики", "Финансы", "Риски", "Roadmap"
    ]
    steps_html = ""
    for i, step in enumerate(CASE_STEPS):
        done = step_answers.get(step["id"], "").strip()
        if done:
            dot_class = "done"
        elif i == current:
            dot_class = "active"
        else:
            dot_class = "todo"
        label = short_labels[i] if i < len(short_labels) else str(i + 1)
        steps_html += f'<div class="stepper-step"><div class="stepper-dot {dot_class}">{i+1}</div><div class="stepper-label">{label}</div></div>'
    st.markdown(f'<div class="stepper">{steps_html}</div>', unsafe_allow_html=True)


# ─────────────────────────────────────────────
# RADAR CHART
# ─────────────────────────────────────────────

def render_radar_chart(criteria_scores):
    try:
        import plotly.graph_objects as go
        names = [c.get("name", f"Критерий {c.get('id', '?')}") for c in criteria_scores]
        scores = [c.get("score", 0) for c in criteria_scores]
        names_closed = names + [names[0]]
        scores_closed = scores + [scores[0]]

        fig = go.Figure()
        fig.add_trace(go.Scatterpolar(
            r=scores_closed, theta=names_closed, fill='toself',
            fillcolor='rgba(108, 92, 231, 0.15)',
            line=dict(color='#6c5ce7', width=2),
            marker=dict(size=6, color='#6c5ce7'),
        ))
        fig.update_layout(
            polar=dict(radialaxis=dict(visible=True, range=[0, 10], tickvals=[2, 4, 6, 8, 10])),
            showlegend=False, margin=dict(l=60, r=60, t=40, b=40),
            height=400, paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
        )
        st.plotly_chart(fig, use_container_width=True)
    except ImportError:
        st.info("Для radar-chart установи plotly: `pip install plotly`")
        for c in criteria_scores:
            s = c.get("score", 0)
            st.write(f"**{c.get('name', '?')}**: {'█' * s}{'░' * (10 - s)} {s}/10")


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
                st.session_state.evaluation_data = None
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
    completed = sum(1 for s in CASE_STEPS if st.session_state.step_answers.get(s["id"], "").strip())
    progress_pct = int(completed / total * 100)

    st.markdown(f"""
    <div class="main-header">
        <h1>Hack the Case — Решение</h1>
        <p>Этап {current + 1} из {total}  |  Прогресс: {completed} из {total} блоков завершено</p>
    </div>
    """, unsafe_allow_html=True)

    render_stepper(current, st.session_state.step_answers)

    st.markdown(f'<div class="progress-container"><div class="progress-fill" style="width: {progress_pct}%"></div></div>', unsafe_allow_html=True)

    # SIDEBAR
    with st.sidebar:
        st.markdown("### Навигация")
        for i, s in enumerate(CASE_STEPS):
            done = st.session_state.step_answers.get(s["id"], "").strip()
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

    # КОНТЕНТ
    col_work, col_coach = st.columns([1, 1], gap="large")

    with col_work:
        st.markdown(f'<div class="card"><h3>{step["title"]}</h3><p>{step["description"]}</p></div>', unsafe_allow_html=True)
        tags = " ".join([f'<span class="framework-tag">{f}</span>' for f in step["frameworks"]])
        st.markdown(f"**Рекомендуемые фреймворки:** {tags}", unsafe_allow_html=True)
        st.markdown(f'<div class="case-hint"><p><strong>Подсказка из условия кейса:</strong> {step["case_hint"]}</p></div>', unsafe_allow_html=True)

        with st.expander("Показать полное условие кейса"):
            st.markdown(st.session_state.case_text)

        answer_key = step["id"]
        existing_answer = st.session_state.step_answers.get(answer_key, "")
        answer = st.text_area(
            "Твоё решение по этому блоку", value=existing_answer, height=250,
            placeholder=f"Опиши своё решение для этапа '{step['title']}'...",
            key=f"answer_{answer_key}",
        )

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

        coach_input = st.text_input(
            "Сообщение коучу", placeholder="Задай вопрос или попроси совет...",
            key=f"coach_input_{chat_key}", label_visibility="collapsed",
        )
        c1, c2 = st.columns(2, gap="small")
        with c1:
            if st.button("Спросить коуча", use_container_width=True, key=f"ask_{chat_key}"):
                if coach_input:
                    _ask_coach(step, chat_key, coach_input, answer)
                else:
                    st.warning("Напиши вопрос в поле выше")
            st.markdown('<p class="btn-hint">Задай свободный вопрос по этапу</p>', unsafe_allow_html=True)
        with c2:
            if st.button("Проверь мой ответ", type="primary", use_container_width=True, key=f"review_{chat_key}"):
                if answer.strip():
                    _ask_coach(step, chat_key, "Проверь мой ответ и дай фидбек.", answer)
                else:
                    st.warning("Сначала напиши ответ слева")
            st.markdown('<p class="btn-hint">Коуч даст структурированный фидбек</p>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)


def _ask_coach(step, chat_key, user_message, answer_text):
    st.session_state.step_chats[chat_key].append({"role": "student", "text": user_message})

    context = build_coach_context(
        step=step, case_text=st.session_state.case_text,
        answer_text=answer_text, chat_history=st.session_state.step_chats[chat_key],
        user_message=user_message, step_answers=st.session_state.step_answers,
        case_steps=CASE_STEPS,
    )
    coach_prompt = COACH_PROMPTS.get(step["id"], "Ты — Case Coach. Помогай студенту. Отвечай на русском.")

    with st.spinner("Коуч думает..."):
        response = call_yandex_gpt(coach_prompt, context, temperature=0.5)

    st.session_state.step_chats[chat_key].append({"role": "coach", "text": response})
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
            for key in ["case_text", "step_answers", "step_chats", "evaluation", "evaluation_data"]:
                if key in ("step_answers", "step_chats"):
                    st.session_state[key] = {}
                elif key == "evaluation_data":
                    st.session_state[key] = None
                else:
                    st.session_state[key] = ""
            st.session_state.page = "start"
            st.rerun()

    with col1:
        eval_data = st.session_state.evaluation_data

        if not eval_data and not st.session_state.evaluation:
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

Дай оценку по всем 10 критериям рубрики. Ответ строго в JSON."""

                    with st.spinner("Жюри оценивает решение..."):
                        raw_eval = call_yandex_gpt(RUBRIC_SYSTEM, eval_prompt, temperature=0.3)
                        st.session_state.evaluation = raw_eval
                        parsed = parse_rubric_json(raw_eval)
                        if parsed and "criteria" in parsed:
                            st.session_state.evaluation_data = parsed
                        st.rerun()

        elif eval_data:
            _render_structured_evaluation(eval_data)
        else:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown("#### Результаты оценки")
            st.markdown(st.session_state.evaluation)
            st.markdown('</div>', unsafe_allow_html=True)
            if st.button("Запросить оценку повторно (в JSON)", use_container_width=True):
                st.session_state.evaluation = ""
                st.session_state.evaluation_data = None
                st.rerun()


def _render_structured_evaluation(eval_data):
    criteria = eval_data.get("criteria", [])
    total = eval_data.get("total_score", sum(c.get("score", 0) for c in criteria))

    st.markdown(f'<div class="card" style="text-align: center;"><div class="eval-score-big">{total}</div><div class="eval-score-label">из 100 баллов</div></div>', unsafe_allow_html=True)

    if criteria:
        render_radar_chart(criteria)

    strengths = eval_data.get("strengths", [])
    improvements = eval_data.get("improvements", [])
    tips = eval_data.get("top_3_tips", [])

    if strengths or improvements:
        scol1, scol2 = st.columns(2, gap="medium")
        with scol1:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown("#### 💪 Сильные стороны")
            for s in strengths:
                st.markdown(f"- {s}")
            st.markdown('</div>', unsafe_allow_html=True)
        with scol2:
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown("#### 🎯 Зоны роста")
            for imp in improvements:
                st.markdown(f"- {imp}")
            st.markdown('</div>', unsafe_allow_html=True)

    if tips:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("#### 💡 Топ-3 совета")
        for i, tip in enumerate(tips, 1):
            st.markdown(f"**{i}.** {tip}")
        st.markdown('</div>', unsafe_allow_html=True)

    st.markdown("#### Детальная оценка по критериям")
    for c in criteria:
        score = c.get("score", 0)
        name = c.get("name", f"Критерий {c.get('id', '?')}")
        comment = c.get("comment", "")
        rec = c.get("recommendation", "")
        with st.expander(f"{name} — {score}/10"):
            st.markdown(f'<span class="criterion-score">{score}/10</span>', unsafe_allow_html=True)
            if comment:
                st.markdown(f"**Комментарий:** {comment}")
            if rec:
                st.markdown(f"**Рекомендация:** {rec}")


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

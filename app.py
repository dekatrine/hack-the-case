"""
Hack the Case — AI-симулятор решения бизнес-кейсов
Refactored: модульная структура, retry-логика, контекстная память коуча
"""

import streamlit as st
from config import CASE_STEPS, INDUSTRIES, DIFFICULTY_LEVELS
from utils.llm import call_yandex_gpt, truncate_smart
from utils.logger import init_analytics, log_event, log_step_enter, log_step_leave, log_coach_call, get_session_summary, export_analytics_json
from prompts.rubric import RUBRIC_SYSTEM, CASE_GENERATION_SYSTEM, parse_scores_from_text, CRITERIA_NAMES
from prompts.coach import get_coach_system_prompt, build_coach_context, STEP_EVAL_PROMPT
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
        "step_scores": {},  # НОВОЕ: мини-оценки по этапам
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v
    init_analytics()


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
                st.session_state.step_scores = {}
                st.session_state.current_step = 0
                st.session_state.evaluation = ""
                log_event("case_generated", {"industry": industry, "difficulty": difficulty})

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

    completed = sum(1 for s in CASE_STEPS if s["id"] in st.session_state.step_answers and st.session_state.step_answers[s["id"]].strip())
    progress_pct = int(completed / total * 100)

    # Визуальный stepper (НОВОЕ!)
    stepper_html = '<div class="stepper">'
    for i, s in enumerate(CASE_STEPS):
        done = s["id"] in st.session_state.step_answers and st.session_state.step_answers.get(s["id"], "").strip()
        is_current = i == current
        cls = "step-done" if done else ("step-current" if is_current else "step-todo")
        num = i + 1
        stepper_html += f'<div class="step-dot {cls}" title="{s["title"]}">{num}</div>'
        if i < total - 1:
            line_cls = "step-line-done" if done else "step-line"
            stepper_html += f'<div class="{line_cls}"></div>'
    stepper_html += '</div>'

    st.markdown(f"""
    <div class="main-header">
        <h1>Hack the Case — Решение</h1>
        <p>Этап {current + 1} из {total}  |  Прогресс: {completed} из {total} блоков завершено</p>
    </div>
    {stepper_html}
    """, unsafe_allow_html=True)

    # Логируем вход на этап
    log_step_enter(step["id"])

    # === SIDEBAR ===
    with st.sidebar:
        st.markdown("### Навигация")
        for i, s in enumerate(CASE_STEPS):
            done = s["id"] in st.session_state.step_answers and st.session_state.step_answers.get(s["id"], "").strip()
            icon = "✅" if done else ("▶️" if i == current else "⬜")
            # Показать мини-оценку, если есть
            score = st.session_state.step_scores.get(s["id"], "")
            score_badge = f" ({score})" if score else ""
            if st.button(f"{icon} {s['title']}{score_badge}", key=f"nav_{i}", use_container_width=True):
                log_step_leave(CASE_STEPS[st.session_state.current_step]["id"])
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

        # Кнопки
        btn_col1, btn_col2 = st.columns(2, gap="small")
        with btn_col1:
            if st.button("Сохранить ответ", use_container_width=True, key=f"save_{answer_key}"):
                st.session_state.step_answers[answer_key] = answer
                log_event("step_saved", {"step": answer_key, "answer_len": len(answer)})
                
                # Мини-оценка (НОВОЕ!)
                if answer.strip():
                    with st.spinner("Быстрая оценка..."):
                        mini_eval = call_yandex_gpt(
                            STEP_EVAL_PROMPT,
                            f"Этап: {step['title']}\nОтвет: {answer[:500]}",
                            temperature=0.3, max_tokens=200
                        )
                        st.session_state.step_scores[answer_key] = mini_eval
                
                st.success("Ответ сохранён!")
            st.markdown('<p class="btn-hint">Сохраняет текст + даёт быструю оценку</p>', unsafe_allow_html=True)

        with btn_col2:
            if current < total - 1:
                if st.button("Следующий этап →", type="primary", use_container_width=True, key=f"next_{answer_key}"):
                    st.session_state.step_answers[answer_key] = answer
                    log_step_leave(step["id"])
                    st.session_state.current_step = current + 1
                    st.rerun()
            else:
                if st.button("Завершить →", type="primary", use_container_width=True, key=f"finish_{answer_key}"):
                    st.session_state.step_answers[answer_key] = answer
                    st.session_state.page = "evaluate"
                    st.rerun()

        # Показать мини-оценку если есть
        mini_score = st.session_state.step_scores.get(answer_key, "")
        if mini_score:
            st.markdown(f'<div class="mini-eval">{mini_score}</div>', unsafe_allow_html=True)

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
            "Сообщение коучу",
            placeholder="Задай вопрос или попроси совет...",
            key=f"coach_input_{chat_key}",
            label_visibility="collapsed",
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
            st.markdown('<p class="btn-hint">Коуч прочитает и даст фидбек</p>', unsafe_allow_html=True)

        st.markdown('</div>', unsafe_allow_html=True)


def _ask_coach(step, chat_key, user_message, answer_text):
    """Вызов коуча с контекстом предыдущих этапов (УЛУЧШЕНО!)."""
    st.session_state.step_chats[chat_key].append({
        "role": "student",
        "text": user_message,
    })

    # Строим контекст с учётом ВСЕХ предыдущих этапов (НОВОЕ!)
    context = build_coach_context(
        step_id=step["id"],
        step_title=step["title"],
        frameworks=step["frameworks"],
        case_text=st.session_state.case_text,
        answer_text=answer_text,
        chat_history=st.session_state.step_chats[chat_key],
        all_answers=st.session_state.step_answers,
        all_steps=CASE_STEPS,
    )
    context += f"\n\nСообщение студента: {user_message}"

    system_prompt = get_coach_system_prompt(step["id"])

    with st.spinner("Коуч думает..."):
        response = call_yandex_gpt(system_prompt, context, temperature=0.5)

    st.session_state.step_chats[chat_key].append({
        "role": "coach",
        "text": response,
    })
    
    log_coach_call(step["id"])
    log_event("coach_asked", {"step": step["id"], "message_len": len(user_message)})
    st.rerun()


# ─────────────────────────────────────────────
# СТРАНИЦА 3: ОЦЕНКА (УЛУЧШЕНО — с radar-chart)
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

        # Аналитика сессии (НОВОЕ!)
        summary = get_session_summary()
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("#### Статистика сессии")
        st.metric("Время работы", f"{summary['total_time_minutes']} мин")
        st.metric("Обращений к коучу", summary['total_coach_calls'])
        st.metric("Ср. длина ответа", f"{summary['avg_answer_length']} символов")
        st.markdown('</div>', unsafe_allow_html=True)

        st.markdown("")
        if st.button("Вернуться к решению", use_container_width=True):
            st.session_state.page = "solve"
            st.rerun()
        
        # Экспорт данных (НОВОЕ — для курсовой!)
        analytics_json = export_analytics_json()
        st.download_button(
            "Скачать данные сессии (JSON)",
            data=analytics_json,
            file_name="hack_the_case_session.json",
            mime="application/json",
            use_container_width=True,
        )

        if st.button("Начать заново", use_container_width=True):
            for key in ["case_text", "step_answers", "step_chats", "evaluation", "step_scores"]:
                st.session_state[key] = "" if key not in ("step_answers", "step_chats", "step_scores") else {}
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
{truncate_smart(st.session_state.case_text, 2000)}

РЕШЕНИЕ СТУДЕНТА:
{answers_summary}

Дай оценку по всем 10 критериям рубрики."""

                    with st.spinner("Жюри оценивает решение..."):
                        log_event("evaluation_requested", {"filled_steps": filled})
                        evaluation = call_yandex_gpt(RUBRIC_SYSTEM, eval_prompt, temperature=0.3)
                        st.session_state.evaluation = evaluation
                        st.rerun()
        else:
            # Попробовать распарсить оценки для radar-chart
            scores = parse_scores_from_text(st.session_state.evaluation)
            
            if scores:
                # Radar-chart через Plotly (НОВОЕ!)
                try:
                    import plotly.graph_objects as go
                    
                    fig = go.Figure(data=go.Scatterpolar(
                        r=scores + [scores[0]],  # замыкаем фигуру
                        theta=CRITERIA_NAMES + [CRITERIA_NAMES[0]],
                        fill='toself',
                        fillcolor='rgba(108, 92, 231, 0.15)',
                        line=dict(color='#6c5ce7', width=2),
                        marker=dict(size=6, color='#6c5ce7'),
                    ))
                    fig.update_layout(
                        polar=dict(
                            radialaxis=dict(visible=True, range=[0, 10], tickfont=dict(size=10)),
                            angularaxis=dict(tickfont=dict(size=11)),
                        ),
                        showlegend=False,
                        height=400,
                        margin=dict(l=80, r=80, t=30, b=30),
                    )
                    st.plotly_chart(fig, use_container_width=True)
                    
                    total = sum(scores)
                    st.markdown(f'<div style="text-align:center; font-size:1.8rem; font-weight:700; color:#6c5ce7; margin:1rem 0;">{total}/100</div>', unsafe_allow_html=True)
                except ImportError:
                    st.info("Для radar-chart установите plotly: pip install plotly")

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

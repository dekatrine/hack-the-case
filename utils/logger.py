"""
utils/logger.py — Логирование действий пользователя для исследования

Это критично для курсовой: раздел "Результаты" требует данных о том,
как пользователи взаимодействуют с системой. Логгер записывает:
- Время на каждый этап
- Количество обращений к коучу
- Длину ответов
- Итоговые баллы
"""

import streamlit as st
import json
import time
from datetime import datetime


def init_analytics():
    """Инициализировать аналитику в session_state."""
    if "analytics" not in st.session_state:
        st.session_state.analytics = {
            "session_start": time.time(),
            "session_id": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "events": [],
            "step_times": {},  # step_id -> {"start": ts, "total_seconds": N}
            "coach_calls": {},  # step_id -> count
        }


def log_event(event_type: str, details: dict = None):
    """
    Записать событие.
    
    event_type: 'case_generated', 'step_started', 'step_completed',
                'coach_asked', 'coach_review', 'evaluation_requested'
    """
    if "analytics" not in st.session_state:
        init_analytics()

    event = {
        "timestamp": time.time(),
        "elapsed": time.time() - st.session_state.analytics["session_start"],
        "type": event_type,
        **(details or {}),
    }
    st.session_state.analytics["events"].append(event)


def log_step_enter(step_id: str):
    """Зафиксировать вход на этап (для подсчёта времени)."""
    analytics = st.session_state.get("analytics", {})
    step_times = analytics.get("step_times", {})

    if step_id not in step_times:
        step_times[step_id] = {"start": time.time(), "total_seconds": 0}
    else:
        step_times[step_id]["start"] = time.time()

    analytics["step_times"] = step_times
    st.session_state.analytics = analytics


def log_step_leave(step_id: str):
    """Зафиксировать уход с этапа — прибавить время."""
    analytics = st.session_state.get("analytics", {})
    step_times = analytics.get("step_times", {})

    if step_id in step_times and step_times[step_id].get("start"):
        elapsed = time.time() - step_times[step_id]["start"]
        step_times[step_id]["total_seconds"] += elapsed
        step_times[step_id]["start"] = None

    analytics["step_times"] = step_times
    st.session_state.analytics = analytics


def log_coach_call(step_id: str):
    """Инкрементировать счётчик обращений к коучу на этапе."""
    analytics = st.session_state.get("analytics", {})
    coach_calls = analytics.get("coach_calls", {})
    coach_calls[step_id] = coach_calls.get(step_id, 0) + 1
    analytics["coach_calls"] = coach_calls
    st.session_state.analytics = analytics


def get_session_summary() -> dict:
    """
    Собрать сводку сессии для отображения / экспорта.
    
    Это то, что пойдёт в раздел «Результаты» курсовой работы.
    """
    analytics = st.session_state.get("analytics", {})
    answers = st.session_state.get("step_answers", {})

    total_time = time.time() - analytics.get("session_start", time.time())

    return {
        "session_id": analytics.get("session_id", "unknown"),
        "total_time_minutes": round(total_time / 60, 1),
        "steps_completed": len([a for a in answers.values() if a.strip()]),
        "total_steps": 9,
        "total_coach_calls": sum(analytics.get("coach_calls", {}).values()),
        "coach_calls_by_step": analytics.get("coach_calls", {}),
        "avg_answer_length": (
            round(sum(len(a) for a in answers.values()) / max(len(answers), 1))
            if answers
            else 0
        ),
        "step_times": {
            k: round(v.get("total_seconds", 0) / 60, 1)
            for k, v in analytics.get("step_times", {}).items()
        },
        "events_count": len(analytics.get("events", [])),
    }


def export_analytics_json() -> str:
    """Экспортировать все данные сессии как JSON (для скачивания)."""
    summary = get_session_summary()
    summary["raw_events"] = st.session_state.get("analytics", {}).get("events", [])
    summary["answers"] = {
        k: v[:500] for k, v in st.session_state.get("step_answers", {}).items()
    }
    return json.dumps(summary, ensure_ascii=False, indent=2)

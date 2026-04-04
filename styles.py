"""
Hack the Case — CSS стили
"""

CUSTOM_CSS = """
<style>
    .stApp { background-color: #f5f5f7 !important; color: #2d2d3f !important; }
    .stApp, .stApp p, .stApp span, .stApp li, .stApp label, .stApp div { color: #2d2d3f !important; }
    .stApp h1, .stApp h2, .stApp h3, .stApp h4 { color: #1a1a2e !important; }
    .stTextArea textarea, .stTextInput input { color: #2d2d3f !important; background-color: #ffffff !important; border: 1px solid #d1d5db !important; border-radius: 8px !important; }
    .stTextArea textarea::placeholder, .stTextInput input::placeholder { color: #9ca3af !important; }
    .stSelectbox > div > div { color: #2d2d3f !important; background-color: #ffffff !important; }

    section[data-testid="stSidebar"] { background-color: #1a1a2e !important; }
    section[data-testid="stSidebar"] * { color: #e0e0e0 !important; }
    section[data-testid="stSidebar"] .stButton > button { background-color: #2d2d5e !important; color: #ffffff !important; border: none !important; }
    section[data-testid="stSidebar"] .stButton > button:hover { background-color: #4a4a8a !important; }

    .main-header { background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); padding: 2rem 2.5rem; border-radius: 16px; margin-bottom: 2rem; }
    .main-header h1 { color: #ffffff !important; margin: 0; font-size: 2rem; font-weight: 700; }
    .main-header p { color: rgba(255,255,255,0.85) !important; margin: 0.5rem 0 0 0; font-size: 1.05rem; }

    .card { background: #ffffff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #e8e8ed; }
    .card h3, .card h4 { color: #1a1a2e !important; margin-top: 0; }
    .card p, .card li, .card span { color: #4a4a5a !important; }

    .stepper { display: flex; justify-content: space-between; align-items: flex-start; margin: 0.5rem 0 1.5rem 0; padding: 0; }
    .stepper-step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
    .stepper-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; z-index: 1; transition: all 0.2s; }
    .stepper-dot.done { background: #6c5ce7; color: white; }
    .stepper-dot.active { background: #f59e0b; color: white; box-shadow: 0 0 0 3px rgba(245,158,11,0.3); }
    .stepper-dot.todo { background: #e0e0e8; color: #9ca3af; }
    .stepper-label { font-size: 0.62rem; color: #9ca3af; margin-top: 4px; text-align: center; max-width: 68px; line-height: 1.2; }

    .framework-tag { display: inline-block; background: #ede9fe; color: #6c5ce7 !important; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.82rem; margin: 0.15rem; font-weight: 500; }

    .case-hint { background: #f0f4ff; border-left: 4px solid #6c5ce7; border-radius: 0 8px 8px 0; padding: 1rem 1.25rem; margin: 1rem 0; }
    .case-hint p, .case-hint span { color: #3d3d5c !important; font-size: 0.92rem; line-height: 1.5; }
    .case-hint strong { color: #6c5ce7 !important; }

    .coach-msg { background: #f8f7ff; border-radius: 12px; padding: 1rem 1.25rem; margin: 0.5rem 0; border-left: 3px solid #6c5ce7; }
    .coach-msg b, .coach-msg strong { color: #6c5ce7 !important; }
    .coach-msg p, .coach-msg span, .coach-msg br { color: #3d3d5c !important; }
    .student-msg { background: #fff8f0; border-radius: 12px; padding: 1rem 1.25rem; margin: 0.5rem 0; border-left: 3px solid #f59e0b; }
    .student-msg b, .student-msg strong { color: #d97706 !important; }
    .student-msg p, .student-msg span, .student-msg br { color: #4a4a5a !important; }

    .progress-container { background: #e0e0e8; border-radius: 10px; height: 10px; margin: 0.5rem 0 1rem 0; }
    .progress-fill { background: linear-gradient(90deg, #6c5ce7, #a29bfe); height: 100%; border-radius: 10px; transition: width 0.3s; }

    .stButton > button { border-radius: 8px !important; font-weight: 500 !important; padding: 0.5rem 1.5rem !important; min-height: 42px !important; transition: all 0.15s !important; }
    .stApp [data-testid="stBaseButton-primary"] { background-color: #6c5ce7 !important; color: #ffffff !important; border: none !important; }
    .stApp [data-testid="stBaseButton-primary"]:hover { background-color: #5a4bd1 !important; }
    .stApp [data-testid="stBaseButton-secondary"] { background-color: #ffffff !important; color: #6c5ce7 !important; border: 1px solid #6c5ce7 !important; }
    .stApp [data-testid="stBaseButton-secondary"]:hover { background-color: #f8f7ff !important; }
    .btn-hint { font-size: 0.78rem; color: #9ca3af !important; margin-top: 0.3rem; line-height: 1.3; }

    .eval-score-big { font-size: 3rem; font-weight: 700; color: #6c5ce7 !important; text-align: center; margin: 0.5rem 0; }
    .eval-score-label { font-size: 0.9rem; color: #9ca3af !important; text-align: center; }
    .criterion-card { background: #ffffff; border-radius: 10px; padding: 1rem 1.25rem; margin: 0.5rem 0; border: 1px solid #e8e8ed; }
    .criterion-score { display: inline-block; background: #ede9fe; color: #6c5ce7 !important; padding: 0.15rem 0.6rem; border-radius: 6px; font-weight: 600; font-size: 0.9rem; }

    [data-testid="stMetricValue"] { color: #6c5ce7 !important; }
    [data-testid="stMetricLabel"] { color: #4a4a5a !important; }
    .stCaption, small { color: #9ca3af !important; }
    .streamlit-expanderHeader { color: #2d2d3f !important; background-color: #ffffff !important; }
    hr { border-color: #e8e8ed !important; }
</style>
"""

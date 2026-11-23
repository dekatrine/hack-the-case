from typing import Annotated, Optional

from pydantic import BaseModel, Field


class GenerateCaseRequest(BaseModel):
    mvp: bool = False
    industry: str
    difficulty: str
    extraContext: str = ""
    trackId: Optional[str] = None
    chapterId: Optional[str] = None
    interviewType: Optional[str] = None
    grade: Optional[str] = None
    variantId: Optional[str] = Field(default=None, max_length=40)
    focusSkill: Optional[str] = Field(default=None, max_length=40)
    previousVariant: Optional[str] = Field(default=None, max_length=40)
    seenVariants: list[Annotated[str, Field(max_length=40)]] = Field(default_factory=list, max_length=32)
    seenFingerprints: list[Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]] = Field(default_factory=list)
    recentCases: list[Annotated[str, Field(max_length=2000)]] = Field(
        default_factory=list, max_length=12,
        description="Prior case statements used to choose distinct supporting evidence.",
    )


class PhaseQuestion(BaseModel):
    id: str
    text: str
    hint: str = ""


class CasePhase(BaseModel):
    id: str
    title: str
    focus: str = ""
    questions: list[PhaseQuestion] = Field(default_factory=list)


class CaseRouteStep(BaseModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9_]{0,47}$")
    question: str = Field(min_length=1, max_length=240)
    hint: str = Field(default="", max_length=300)
    options: list[Annotated[str, Field(min_length=1, max_length=160)]] = Field(default_factory=list, max_length=4)
    evidence: str = Field(default="", max_length=1600)
    scene: str = Field(default="", max_length=1000)
    chapter: int = Field(default=0, ge=0, le=4)
    chapterTitle: str = Field(default="", max_length=80)
    longAnswer: bool = False
    nextStepId: Optional[str] = None
    nextByAnswer: dict[str, str] = Field(default_factory=dict, max_length=4)


class EvidenceRequest(BaseModel):
    answer: str = Field(min_length=1, max_length=4000)
    sources: list[Annotated[str, Field(min_length=1, max_length=160)]] = Field(min_length=1, max_length=4)


class EvidenceResponse(BaseModel):
    source: Optional[str] = None


class GenerateCaseResponse(BaseModel):
    caseText: str
    suggestedStepIds: list[str] = Field(default_factory=list)
    phases: list[CasePhase] = Field(default_factory=list)
    caseRoute: list[CaseRouteStep] = Field(default_factory=list)
    caseIntro: str = ""
    variantId: Optional[str] = None
    focusSkill: Optional[str] = None
    fingerprints: list[str] = Field(default_factory=list)


class GenerateInterviewRequest(BaseModel):
    directionId: str
    blockId: str
    companyContext: str = ""
    difficulty: str = "middle"


class GenerateInterviewResponse(BaseModel):
    taskText: str


class CheckInterviewRequest(BaseModel):
    directionId: str
    blockId: str
    taskText: str
    roundId: str
    roundTitle: str
    roundGoal: str
    answerText: str = ""
    selectedOption: str = ""
    expectedSignals: list[str] = Field(default_factory=list)
    previousAnswers: dict[str, str] = Field(default_factory=dict)
    mode: str = "score"


class CheckInterviewResponse(BaseModel):
    result: str


class ChatMessage(BaseModel):
    role: str
    text: str


class CoachRequest(BaseModel):
    stepId: str
    stepTitle: str
    stepDescription: str
    frameworks: list[str] = Field(default_factory=list)
    caseHint: str = ""
    theory: dict = Field(default_factory=dict)
    caseText: str
    answerText: str = ""
    userMessage: str
    chatHistory: list[ChatMessage] = Field(default_factory=list)
    previousAnswers: dict[str, str] = Field(default_factory=dict)
    trackId: Optional[str] = None
    chapterId: Optional[str] = None
    stepHint: bool = False


class CoachResponse(BaseModel):
    message: str


class HintUsage(BaseModel):
    basic: int = Field(default=0, ge=0, le=128)
    ai: int = Field(default=0, ge=0, le=256)


class CaseScore(BaseModel):
    quality: Optional[int] = None
    final: Optional[int] = None
    hintPenalty: int
    hints: HintUsage


class EvaluateRequest(BaseModel):
    interviewType: Optional[str] = None
    mvp: bool = False
    caseText: str
    answers: dict[str, str] = Field(default_factory=dict)
    trackId: Optional[str] = None
    caseRoute: list[CaseRouteStep] = Field(default_factory=list, max_length=64)
    hintUsage: HintUsage = Field(default_factory=HintUsage)
    focusSkill: Optional[str] = Field(default=None, max_length=40)
    hintedSteps: Optional[list[Annotated[str, Field(max_length=48)]]] = Field(default=None, max_length=128)


class PracticeFeedback(BaseModel):
    skillId: str
    stepId: Optional[str] = None
    observation: str = ""
    applied: Optional[bool] = None
    assisted: Optional[bool] = None


class EvaluateResponse(BaseModel):
    evaluation: str
    score: Optional[CaseScore] = None
    practice: Optional[PracticeFeedback] = None


class LearnExplainRequest(BaseModel):
    topic: str
    subtopic: str
    question: str = ""
    wrongAnswer: str = ""
    correctAnswer: str = ""
    difficulty: str = "normal"  # 'simplified' | 'normal' | 'advanced'


class LearnExplainResponse(BaseModel):
    explanation: str
    tip: str


class LearnSessionRequest(BaseModel):
    chapterId: str
    subtopicId: str
    userLevel: str = "normal"  # 'beginner' | 'normal' | 'advanced'


class LearnSessionResponse(BaseModel):
    exposition: str


class ConditionExplainRequest(BaseModel):
    caseText: str = Field(min_length=1, max_length=30000)
    question: str = Field(min_length=1, max_length=1500)


class ConditionExplainResponse(BaseModel):
    message: str

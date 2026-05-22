from pydantic import BaseModel, Field


class GenerateCaseRequest(BaseModel):
    industry: str
    difficulty: str
    extraContext: str = ""
    trackId: str | None = None
    chapterId: str | None = None
    interviewType: str | None = None
    grade: str | None = None


class PhaseQuestion(BaseModel):
    id: str
    text: str
    hint: str = ""


class CasePhase(BaseModel):
    id: str
    title: str
    focus: str = ""
    questions: list[PhaseQuestion] = Field(default_factory=list)


class GenerateCaseResponse(BaseModel):
    caseText: str
    suggestedStepIds: list[str] = Field(default_factory=list)
    phases: list[CasePhase] = Field(default_factory=list)


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
    trackId: str | None = None
    chapterId: str | None = None


class CoachResponse(BaseModel):
    message: str


class EvaluateRequest(BaseModel):
    caseText: str
    answers: dict[str, str] = Field(default_factory=dict)
    trackId: str | None = None


class EvaluateResponse(BaseModel):
    evaluation: str


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

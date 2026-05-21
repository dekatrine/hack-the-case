from pydantic import BaseModel, Field


class GenerateCaseRequest(BaseModel):
    industry: str
    difficulty: str
    extraContext: str = ""
    trackId: str | None = None
    chapterId: str | None = None


class GenerateCaseResponse(BaseModel):
    caseText: str
    suggestedStepIds: list[str] = Field(default_factory=list)


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

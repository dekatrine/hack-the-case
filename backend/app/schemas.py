from pydantic import BaseModel, Field


class GenerateCaseRequest(BaseModel):
    industry: str
    difficulty: str
    extraContext: str = ""


class GenerateCaseResponse(BaseModel):
    caseText: str


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


class CoachResponse(BaseModel):
    message: str


class EvaluateRequest(BaseModel):
    caseText: str
    answers: dict[str, str] = Field(default_factory=dict)


class EvaluateResponse(BaseModel):
    evaluation: str

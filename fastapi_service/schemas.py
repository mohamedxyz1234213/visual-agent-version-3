from pydantic import BaseModel, Field
from typing import Optional, Any
from enum import Enum


class Emotion(str, Enum):
    explaining = "explaining"
    happy = "happy"
    encouraging = "encouraging"
    thinking = "thinking"
    curious = "curious"
    neutral = "neutral"


class NextAction(str, Enum):
    listen = "listen"
    explain = "explain"
    code = "code"
    quiz = "quiz"
    continue_session = "continue_session"
    end_session = "end_session"


class VoiceInput(BaseModel):
    transcript: str = Field(..., description="The transcribed voice input text")
    session_id: Optional[str] = Field(None, description="Active session ID to continue")
    language: Optional[str] = Field("en", description="Language code (en/ar)")


class CodeSubmission(BaseModel):
    code: str = Field(..., description="Source code submitted by the student")
    exercise_id: Optional[str] = Field(None, description="Exercise identifier")
    session_id: Optional[str] = Field(None, description="Active session ID")
    language: Optional[str] = Field("javascript", description="Programming language")


class SessionStartRequest(BaseModel):
    topic: Optional[str] = Field("programming", description="Topic or subject to learn")
    dialect: Optional[str] = Field("msa", description="Arabic dialect (msa/egyptian)")
    subject_id: Optional[str] = Field(None, description="Subject identifier")
    lesson_id: Optional[str] = Field(None, description="Lesson identifier")
    language: Optional[str] = Field("en", description="Language code")


class TeacherResponse(BaseModel):
    speech: str = Field(..., description="What the AI teacher says")
    emotion: Emotion = Field(default=Emotion.neutral)
    next_action: NextAction = Field(default=NextAction.listen)
    lesson_state: str = Field(default="", description="Current state description")
    enable_microphone: bool = Field(default=True)
    show_code_editor: bool = Field(default=False)
    progress: Optional[dict] = Field(None, description="Learning progress data")
    student_feedback: Optional[str] = Field(None, description="Feedback for the student")


class ExecutionResult(BaseModel):
    output: str = Field(default="", description="Standard output")
    error: Optional[str] = Field(None, description="Error output if any")
    execution_time_ms: Optional[int] = Field(None)
    passed: Optional[bool] = Field(None, description="Did the code pass tests")


class SessionStartResponse(BaseModel):
    session_id: str
    teacher_response: TeacherResponse
    audio_bytes: Optional[str] = None


class VoiceResponse(BaseModel):
    session_id: Optional[str] = None
    teacher_response: TeacherResponse
    audio_bytes: Optional[str] = None


class CodeResponse(BaseModel):
    execution_result: Optional[ExecutionResult] = None
    teacher_response: TeacherResponse
    audio_bytes: Optional[str] = None


class StateResponse(BaseModel):
    session_id: Optional[str] = None
    active: bool
    teacher_response: TeacherResponse
    lesson_plan: Optional[dict] = None
    progress: Optional[dict] = None
    audio_bytes: Optional[str] = None


class ValidationError(BaseModel):
    loc: list[str | int] = Field(..., description="Location of the error")
    msg: str = Field(..., description="Error message")
    type: str = Field(..., description="Error type")


class HTTPValidationError(BaseModel):
    detail: list[ValidationError]


class AICompletionRequest(BaseModel):
    prompt: str = Field(..., description="User prompt text")
    system_prompt: Optional[str] = Field(None, description="Optional system instruction")
    model: Optional[str] = Field(None, description="Model ID override")
    max_tokens: int = Field(4096, description="Maximum output tokens")
    temperature: float = Field(0.5, description="Sampling temperature", ge=0.0, le=2.0)


class AICompletionResponse(BaseModel):
    content: str = Field(..., description="Generated text")
    model: str = Field(..., description="Model used")

import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    VoiceInput, CodeSubmission, SessionStartRequest,
    SessionStartResponse, VoiceResponse, CodeResponse, StateResponse,
    TeacherResponse, ExecutionResult,
    AICompletionRequest, AICompletionResponse,
)
from blaze_client import BlazeClient
from session_manager import session_manager

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

blaze = BlazeClient()

app = FastAPI(
    title="AI Teacher FastAPI Service",
    version="0.1.0",
    description="Voice, code, and session management for the AI coding teacher, powered by BlazeAPI.",
    openapi_version="3.1.0",
    servers=[{"url": "/", "description": "Default"}],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/openapi.json", include_in_schema=False)
async def get_openapi():
    return app.openapi()


@app.post("/session/start", response_model=SessionStartResponse)
async def start_session(req: SessionStartRequest):
    try:
        state = session_manager.create_session(
            topic=req.topic or "programming",
            language=req.language or "en",
            dialect=req.dialect or "msa",
        )

        lesson_plan = blaze.generate_lesson_plan(
            topic=req.topic or "programming",
            language=req.language or "en",
        )
        state.lesson_plan = lesson_plan
        if lesson_plan.get("estimated_minutes"):
            pass

        sections = lesson_plan.get("sections", [])
        state.progress["total_sections"] = len(sections)

        greeting = lesson_plan.get("greeting", "")
        speech = greeting or f"Welcome! Today we'll learn about {req.topic or 'programming'}. Let's get started!"
        next_action = lesson_plan.get("next_action", "listen")

        return SessionStartResponse(
            session_id=state.session_id,
            teacher_response=TeacherResponse(
                speech=speech,
                emotion="happy",
                next_action=next_action,
                lesson_state=f"Starting: {lesson_plan.get('title', req.topic or 'programming')}",
                enable_microphone=True,
                show_code_editor=bool(lesson_plan.get("has_code_examples", False)),
                progress=state.progress,
                student_feedback=None,
            ),
            audio_bytes=None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/voice", response_model=VoiceResponse)
async def process_voice(req: VoiceInput):
    try:
        session_context = None
        state = None
        if req.session_id:
            state = session_manager.get_session(req.session_id)
            if state:
                section_idx = state.current_section_index
                lesson_title = (state.lesson_plan or {}).get("title", "")
                session_context = (
                    f"Current topic: {state.topic}. "
                    f"Lesson: {lesson_title}. "
                    f"Current section: {section_idx}. "
                    f"You have had {len(state.messages)} exchanges with the student."
                )

        result = blaze.teaching_response(
            transcript=req.transcript,
            session_context=session_context,
            language=req.language or "en",
        )

        if state:
            state.messages.append({
                "role": "user", "content": req.transcript,
            })
            state.messages.append({
                "role": "assistant", "content": result.get("speech", ""),
            })

        emotion = result.get("emotion", "explaining")
        show_editor = result.get("show_code_editor", False)
        next_action = result.get("next_action", "listen")

        return VoiceResponse(
            session_id=req.session_id,
            teacher_response=TeacherResponse(
                speech=result.get("speech", "I'm thinking about your question..."),
                emotion=emotion,
                next_action=next_action,
                lesson_state=result.get("lesson_state", ""),
                enable_microphone=True,
                show_code_editor=bool(show_editor),
                progress=state.progress if state else None,
                student_feedback=result.get("student_feedback"),
            ),
            audio_bytes=None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/code", response_model=CodeResponse)
async def submit_code(req: CodeSubmission):
    try:
        session_context = None
        state = None
        if req.session_id:
            state = session_manager.get_session(req.session_id)
            if state:
                state.code_submissions.append(req.code)
                session_context = (
                    f"The student is working on exercise: {req.exercise_id or 'coding practice'}. "
                    f"They have submitted {len(state.code_submissions)} attempts."
                )

        review = blaze.review_code(
            code=req.code,
            language=req.language or "javascript",
            exercise_id=req.exercise_id,
            session_context=session_context,
        )

        exec_output = ""
        exec_error = None
        try:
            exec_output = _execute_code_sandbox(req.code, req.language or "javascript")
        except Exception as exec_err:
            exec_error = str(exec_err)

        correct = review.get("correct", False)
        execution_result = ExecutionResult(
            output=exec_output,
            error=exec_error,
            passed=correct,
        )

        if state:
            state.messages.append({
                "role": "user",
                "content": f"[Code submission in {req.language}]:\n```\n{req.code[:500]}\n```",
            })

        speech = review.get("speech", "Let me look at your code...")
        if exec_error:
            speech += f" I see a runtime error: {exec_error[:200]}"

        next_action = review.get("next_action", "continue_session")

        return CodeResponse(
            execution_result=execution_result,
            teacher_response=TeacherResponse(
                speech=speech,
                emotion="encouraging" if correct else "explaining",
                next_action=next_action,
                lesson_state="Reviewing code" if not correct else "Code looks good",
                enable_microphone=False,
                show_code_editor=True,
                progress=state.progress if state else None,
                student_feedback=review.get("student_feedback"),
            ),
            audio_bytes=None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/state", response_model=StateResponse)
async def get_state(session_id: str = ""):
    try:
        if session_id:
            state = session_manager.get_session(session_id)
            if not state:
                return StateResponse(
                    session_id=session_id,
                    active=False,
                    teacher_response=TeacherResponse(
                        speech="Session not found or has expired.",
                        emotion="neutral",
                        next_action="continue_session",
                        lesson_state="inactive",
                    ),
                )
            plan = state.lesson_plan
            return StateResponse(
                session_id=state.session_id,
                active=True,
                teacher_response=TeacherResponse(
                    speech=f"You're learning about {state.topic}. "
                           f"Completed {state.progress['sections_completed']} of {state.progress['total_sections']} sections.",
                    emotion="neutral",
                    next_action="listen",
                    lesson_state=f"Topic: {state.topic}",
                    enable_microphone=True,
                    show_code_editor=False,
                    progress=state.progress,
                ),
                lesson_plan=plan,
                progress=state.progress,
                audio_bytes=None,
            )

        all_sessions = [
            s.to_dict() for s in session_manager._sessions.values()
        ]
        return StateResponse(
            active=False,
            teacher_response=TeacherResponse(
                speech=f"No session specified. {len(all_sessions)} active session(s) available.",
                emotion="neutral",
                next_action="continue_session",
                lesson_state="no_session",
            ),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _execute_code_sandbox(code: str, language: str) -> str:
    if language == "javascript":
        import subprocess
        import tempfile
        with tempfile.NamedTemporaryFile(mode="w", suffix=".mjs", delete=False) as f:
            f.write(code)
            f.flush()
            result = subprocess.run(
                ["node", f.name],
                capture_output=True, text=True, timeout=10,
            )
            os.unlink(f.name)
            if result.returncode != 0:
                raise RuntimeError(result.stderr.strip() or "Execution failed")
            return result.stdout.strip()

    elif language == "python":
        import subprocess
        import tempfile
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(code)
            f.flush()
            result = subprocess.run(
                ["python3", f.name],
                capture_output=True, text=True, timeout=10,
            )
            os.unlink(f.name)
            if result.returncode != 0:
                raise RuntimeError(result.stderr.strip() or "Execution failed")
            return result.stdout.strip()

    else:
        return f"[Sandbox execution not supported for '{language}']"


# ── AI Completion proxy ───────────────────────────────────────────────────────
# Allows the Node.js backend to route AI calls through this service, which may
# have its own BlazeAPI key/plan configured on Render (different from local .env).

@app.post("/ai/completions", response_model=AICompletionResponse)
async def ai_completion(req: AICompletionRequest):
    messages = []
    if req.system_prompt:
        messages.append({"role": "system", "content": req.system_prompt})
    messages.append({"role": "user", "content": req.prompt})
    model = req.model or None
    try:
        content = blaze.chat(
            messages=messages,
            model=model,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
        )
        return AICompletionResponse(content=content, model=model or blaze.model)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("FASTAPI_PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

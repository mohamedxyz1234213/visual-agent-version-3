import uuid
import time
from typing import Optional


class SessionState:
    def __init__(self, session_id: str, topic: str, language: str = "en"):
        self.session_id = session_id
        self.topic = topic
        self.language = language
        self.created_at = time.time()
        self.last_active_at = time.time()
        self.messages: list[dict] = []
        self.current_section_index = 0
        self.lesson_plan: Optional[dict] = None
        self.progress = {
            "sections_completed": 0,
            "total_sections": 0,
            "exercises_completed": 0,
            "quiz_score": None,
        }
        self.code_submissions: list[str] = []
        self.dialect: str = "msa"

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "topic": self.topic,
            "language": self.language,
            "created_at": self.created_at,
            "last_active_at": self.last_active_at,
            "current_section_index": self.current_section_index,
            "lesson_plan_title": self.lesson_plan.get("title") if self.lesson_plan else None,
            "progress": self.progress,
        }


class SessionManager:
    def __init__(self):
        self._sessions: dict[str, SessionState] = {}
        self._max_sessions = 1000

    def create_session(self, topic: str = "programming",
                       language: str = "en", dialect: str = "msa") -> SessionState:
        self._evict_stale()
        session_id = uuid.uuid4().hex[:12]
        state = SessionState(session_id, topic, language)
        state.dialect = dialect
        self._sessions[session_id] = state
        return state

    def get_session(self, session_id: str) -> Optional[SessionState]:
        state = self._sessions.get(session_id)
        if state:
            state.last_active_at = time.time()
        return state

    def delete_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def _evict_stale(self):
        if len(self._sessions) < self._max_sessions:
            return
        now = time.time()
        stale = [sid for sid, s in self._sessions.items()
                 if now - s.last_active_at > 3600]
        for sid in stale:
            del self._sessions[sid]


session_manager = SessionManager()

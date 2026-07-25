import os
import json
from typing import Optional
from openai import OpenAI


class BlazeClient:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("BLAZE_API_KEY") or os.getenv("BLAZEAPI_API_KEY", "")
        self.base_url = os.getenv("OPENROUTER_BASE_URL") or os.getenv("BLAZE_BASE_URL", "https://openrouter.ai/api/v1")
        self.model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
        self.deep_model = os.getenv("BLAZE_DEEP_MODEL", self.model)

        if not self.api_key:
            print("[blaze] WARNING: No OpenRouter/Blaze API key set — AI calls will fail")

        self._client: Optional[OpenAI] = None

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        return self._client

    def chat(self, messages: list[dict], model: Optional[str] = None,
             temperature: float = 0.7, max_tokens: int = 8192,
             response_format: Optional[dict] = None) -> str:
        kwargs = dict(
            model=model or self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if response_format:
            kwargs["response_format"] = response_format

        resp = self.client.chat.completions.create(**kwargs)
        msg = resp.choices[0].message
        content = msg.content or ""
        reasoning = getattr(msg, "reasoning_content", None) or ""
        if not content and reasoning:
            content = reasoning
        return content

    def chat_json(self, messages: list[dict], model: Optional[str] = None,
                  temperature: float = 0.5, max_tokens: int = 8192) -> dict:
        try:
            content = self.chat(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
            )
        except Exception:
            content = self.chat(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end > start:
                return json.loads(content[start:end + 1])
            return {"text": content}

    def teaching_response(self, transcript: str, session_context: Optional[str] = None,
                          language: str = "en") -> dict:
        lang_instruction = {
            "en": "Respond in English.",
            "ar": "Respond in Arabic (use Egyptian dialect if the student uses it).",
        }.get(language, "Respond in English.")

        prompt = f"""You are Nour, an expert AI coding teacher. Your role is to guide students step-by-step.

{lang_instruction}

Student says: "{transcript}"

Respond with a JSON object with these exact fields:
- "speech": Your teaching response (max 120 words, clear, encouraging, one concept at a time)
- "emotion": one of "explaining", "happy", "encouraging", "thinking", "curious", "neutral"
- "next_action": one of "listen", "explain", "code", "quiz", "continue_session", "end_session"
- "lesson_state": brief state description (max 50 chars)
- "enable_microphone": true/false
- "show_code_editor": true/false (true if you want them to write code)
- "student_feedback": null or a short encouraging feedback string"""

        ctx = session_context or "The student is learning programming fundamentals."
        messages = [
            {"role": "system", "content": f"You are Nour, an AI coding teacher. {ctx}"},
            {"role": "user", "content": prompt},
        ]
        return self.chat_json(messages)

    def generate_lesson_plan(self, topic: str, language: str = "en") -> dict:
        prompt = f"""Create a structured lesson plan for teaching "{topic}".

Return a JSON object with:
- "title": lesson title
- "greeting": warm opening greeting from the teacher (max 60 words)
- "objectives": array of 2-4 learning objectives
- "sections": array of section objects, each with "title" and "summary" (max 40 words each)
- "estimated_minutes": total estimated time (integer)
- "difficulty": "beginner", "intermediate", or "advanced"
- "has_code_examples": true/false
- "next_action": "listen" or "explain"

Be specific to the topic. Use real, accurate teaching content."""

        messages = [
            {"role": "system", "content": "You are an expert curriculum designer and coding teacher."},
            {"role": "user", "content": prompt},
        ]
        return self.chat_json(messages, model=self.deep_model, max_tokens=8192)

    def review_code(self, code: str, language: str = "javascript",
                    exercise_id: Optional[str] = None,
                    session_context: Optional[str] = None) -> dict:
        lang_hints = {
            "javascript": "Node.js JavaScript",
            "python": "Python 3",
            "java": "Java",
            "cpp": "C++",
            "html": "HTML/CSS",
        }
        lang_name = lang_hints.get(language, language)

        prompt = f"""Review the following {lang_name} code submitted by a student.

```{language}
{code}
```

Respond with a JSON object with:
- "speech": Your spoken feedback to the student (max 100 words, encouraging, specific)
- "emotion": one of "explaining", "happy", "encouraging", "thinking", "curious", "neutral"
- "correct": true/false (is the code functionally correct?)
- "issues": array of specific issues found, each with "line" (approx), "description", and "severity" ("error"/"warning"/"hint")
- "suggestion": suggested improvement (max 80 words)
- "next_action": "code" if they should try again, "explain" if they need help, "continue_session" if done
- "show_code_editor": true/false
- "student_feedback": brief encouraging feedback string"""

        ctx = session_context or "The student is practicing coding."
        messages = [
            {"role": "system", "content": f"You are an expert code reviewer and coding teacher. {ctx}"},
            {"role": "user", "content": prompt},
        ]
        return self.chat_json(messages, temperature=0.3)

    def generate_session_greeting(self, topic: str, dialect: str = "msa") -> str:
        if dialect == "egyptian":
            prompt = f"""Generate a warm greeting in Egyptian Arabic for a student who wants to learn about "{topic}".
The greeting should be from Nour, their AI coding teacher.
Be encouraging and excited. Max 3 sentences.
Return ONLY the greeting text, no JSON."""
        else:
            prompt = f"""Generate a warm greeting in Modern Standard Arabic for a student who wants to learn about "{topic}".
The greeting should be from Nour, their AI coding teacher.
Be encouraging and excited. Max 3 sentences.
Return ONLY the greeting text, no JSON."""

        messages = [
            {"role": "system", "content": "You are Nour, a friendly AI coding teacher who speaks Arabic."},
            {"role": "user", "content": prompt},
        ]
        return self.chat(messages, temperature=0.8, max_tokens=300)

# 🎓 AI Whiteboard Teacher

> **Upload any document. Watch an AI teacher bring it to life on an interactive animated whiteboard.**

---

## Table of Contents

1. [What This Is](#what-this-is)
2. [How It Works — Full Data Flow](#how-it-works--full-data-flow)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Prerequisites](#prerequisites)
6. [Running the App](#running-the-app)
   - [Option A — Docker Compose (recommended)](#option-a--docker-compose-recommended)
   - [Option B — Local Development (no Docker)](#option-b--local-development-no-docker)
7. [Configuration Reference](#configuration-reference)
8. [Supported Input Formats](#supported-input-formats)
9. [Project Structure](#project-structure)
10. [Frontend Deep-Dive](#frontend-deep-dive)
11. [Backend Deep-Dive](#backend-deep-dive)
12. [Database Schema](#database-schema)
13. [API Reference](#api-reference)
14. [The Storyboard System](#the-storyboard-system)
15. [Authentication & Admin Panel](#authentication--admin-panel)
16. [Known Limitations & What's Missing](#known-limitations--whats-missing)
17. [Troubleshooting](#troubleshooting)
18. [Roadmap](#roadmap)

---

## What This Is

An end-to-end platform that converts PDFs, lecture slides, textbooks, notes, and images into **structured, animated, interactive whiteboard lessons** — exactly like watching a skilled teacher explain a concept step-by-step.

A student uploads a document. The system:
- Reads and understands the document
- Plans a full multi-part lesson with timed visual actions
- Animates those actions on a live SVG whiteboard
- Narrates each part (optionally via TTS audio)
- Tests the student with AI-generated quizzes
- Scores open-ended answers with AI feedback

---

## How It Works — Full Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  1. UPLOAD                                                        │
│     Student drags/drops a file in the browser                    │
│     → POST /api/v1/upload/  (multipart, max 50 MB)               │
│     ← 202 Accepted: {lesson_id, status: "processing"}            │
│     Frontend polls GET /api/v1/upload/status/{id} every 2s       │
└──────────────────────────────┬───────────────────────────────────┘
                               │  asyncio.create_task (background)
┌──────────────────────────────▼───────────────────────────────────┐
│  2. TEXT EXTRACTION  (document_extractor.py)                     │
│     PDF    → pypdf page-by-page text                             │
│     DOCX   → python-docx paragraph text                          │
│     TXT/MD → raw UTF-8                                           │
│     Image  → GPT-4o or Gemini vision OCR + diagram description   │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│  3. AI LESSON PLANNING  (ai_planner.py)                          │
│     First 12 000 chars of extracted text sent to LLM             │
│     GPT-4o (json_object mode) or Gemini 1.5 Pro                  │
│     Returns structured JSON:                                     │
│       title, subject, summary                                    │
│       parts[]:                                                   │
│         - content parts: narration + visual_sequence             │
│         - quiz parts:    quiz_questions[]                        │
│     Retried up to 3× with exponential backoff (tenacity)         │
│     Falls back to a placeholder plan if no API key is set        │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│  4. DATABASE PERSISTENCE  (storyboard_generator.py)              │
│     Lesson record updated (title, subject, summary)              │
│     LessonPart rows created (one per part)                       │
│     StoryboardScene rows created (one per visual action)         │
│     Quiz / QuizQuestion rows created for quiz parts              │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│  5. TTS NARRATION  (tts_service.py)  [optional]                  │
│     For each content part, narration text sent to TTS provider   │
│     ElevenLabs REST API  or  Azure Cognitive Services Speech     │
│     MP3 bytes uploaded to S3/R2 storage                          │
│     part.audio_url stored in DB                                  │
│     Skipped silently if TTS_PROVIDER=none or key missing         │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                    lesson.status = "ready"
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│  6. PLAYBACK (browser)                                           │
│     Frontend fetches full lesson: GET /api/v1/lessons/{id}       │
│     Zustand store holds: lesson, currentPartIndex, elapsed,      │
│                          status, speed, zoom                     │
│     AnimationEngine (headless component) runs setInterval        │
│       → increments elapsed by 0.1 × speed every 100 ms          │
│       → also plays/pauses audio if audio_url present             │
│     Whiteboard (SVG component) watches elapsed                   │
│       → renders each scene whose time_offset ≤ elapsed           │
│       → "clear" action wipes the board                           │
│     NavigationControls: play/pause/speed (0.5×–3×)/zoom/skip    │
└──────────────────────────────┬───────────────────────────────────┘
                               │  part.part_type === "quiz"
┌──────────────────────────────▼───────────────────────────────────┐
│  7. QUIZ                                                         │
│     Frontend fetches: GET /api/v1/quiz/part/{part_id}            │
│     QuizPanel renders MCQ / fill-blank / short-answer            │
│     Student submits: POST /api/v1/quiz/{quiz_id}/attempt         │
│     Backend evaluates:                                           │
│       MCQ / fill-blank → exact string match                      │
│       short_answer / graph_interpretation → AI evaluation        │
│     Returns: score, passed (≥70%), per-question feedback         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 14 + Tailwind + Zustand)                         │
│  ┌──────────────┐  ┌─────────────────────┐  ┌──────────────────┐   │
│  │  Upload Zone │  │  Whiteboard Engine  │  │   Quiz Panel     │   │
│  │  (drag/drop) │  │  (SVG + CSS anim.)  │  │  (MCQ/fill/open) │   │
│  └──────────────┘  └─────────────────────┘  └──────────────────┘   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Navigation Controls  (play/pause/speed/zoom/skip/prev)       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ REST API (JSON)
┌──────────────────────────────▼──────────────────────────────────────┐
│  Backend (FastAPI + Python 3.12)                                     │
│  ┌────────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐ │
│  │  /upload   │  │  AI Planner  │  │ Storyboard │  │   Quiz      │ │
│  │  (async)   │  │ (GPT-4o /    │  │ Persister  │  │ Evaluator   │ │
│  │            │  │  Gemini)     │  │            │  │ (AI-powered)│ │
│  └────────────┘  └──────────────┘  └────────────┘  └─────────────┘ │
│  ┌────────────────────────┐  ┌──────────────────────────────────┐   │
│  │  Document Extractor    │  │  TTS Service                     │   │
│  │  PDF/DOCX/Image/Text   │  │  ElevenLabs / Azure Speech       │   │
│  └────────────────────────┘  └──────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
         ┌─────────────────────┼──────────────────────┐
         ▼                     ▼                       ▼
   PostgreSQL 16         Storage (S3/R2)         AI APIs
   (lessons, parts,    (source files,           (OpenAI GPT-4o /
    scenes, quizzes)    audio MP3s)              Gemini 1.5 Pro /
                                                 ElevenLabs / Azure)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend framework** | Next.js 14 (App Router), TypeScript |
| **Frontend styling** | Tailwind CSS |
| **Frontend state** | Zustand |
| **Animation** | Pure SVG + CSS (no canvas, no GSAP) |
| **Backend framework** | FastAPI, Python 3.12 |
| **ORM / migrations** | SQLAlchemy 2 (async), Alembic (installed, not yet wired) |
| **Database** | PostgreSQL 16 |
| **Async DB driver** | asyncpg |
| **Cloud storage** | AWS S3 / Cloudflare R2 (boto3) |
| **Primary LLM** | OpenAI GPT-4o (`gpt-4o` for planning, `gpt-4o-mini` for quiz eval) |
| **Alternative LLM** | Google Gemini 1.5 Pro / Flash |
| **TTS** | ElevenLabs REST API or Azure Cognitive Services Speech |
| **Retry logic** | tenacity (3 attempts, exponential backoff) |
| **Containerisation** | Docker + Docker Compose |

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Docker & Docker Compose** | Version 24+ recommended. Required for the Docker path. |
| **Python 3.12** | Only needed for the local dev path. |
| **Node.js 20+** | Only needed for the local dev path. |
| **PostgreSQL 16** | Provided by Docker Compose. For local dev, install separately. |
| **OpenAI API key** | Required to generate lessons. Set `OPENAI_API_KEY` in `backend/.env`. |
| **Gemini API key** | Alternative to OpenAI. Set `GEMINI_API_KEY` and `ACTIVE_LLM=gemini`. |
| **ElevenLabs / Azure key** | Optional. Enables spoken narration audio. |
| **S3 / R2 credentials** | Optional. Without them, uploaded files and audio are not persisted to cloud storage. |

---

## Running the App

### Option A — Docker Compose (recommended)

```bash
# 1. Clone the repository
git clone https://github.com/mohamedxyz1234213/visual-agentTeacher.git
cd visual-agentTeacher

# 2. Create the backend environment file
cp backend/.env.example backend/.env
# Open backend/.env and set at least OPENAI_API_KEY (or GEMINI_API_KEY)

# 3. Start all services
docker compose up --build
```

Services started:

| Service | URL | Notes |
|---|---|---|
| Frontend (Next.js) | http://localhost:3000 | Main student UI |
| Backend (FastAPI) | http://localhost:8000 | REST API |
| Swagger / OpenAPI docs | http://localhost:8000/docs | Interactive API explorer |
| ReDoc docs | http://localhost:8000/redoc | Alternative API docs |
| PostgreSQL | localhost:5432 | `ai_teacher` DB, user/pass: `postgres` |

> **Database tables** are created automatically on first startup via SQLAlchemy `create_all`. No manual migration step is needed.

To stop:
```bash
docker compose down          # stops containers
docker compose down -v       # stops containers AND deletes the DB volume
```

---

### Option B — Local Development (no Docker)

You need a running PostgreSQL 16 instance. Adjust the `DATABASE_URL` in `.env` accordingly.

#### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, OPENAI_API_KEY, etc.

# Start the API server (hot-reload enabled)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 npm run dev
```

Open http://localhost:3000.

#### Build for production (frontend only)

```bash
cd frontend
npm run build
npm start
```

---

## Configuration Reference

All backend configuration is read from `backend/.env` (loaded by Pydantic Settings). All keys are optional unless noted.

```bash
# ── Application ──────────────────────────────────────────────────
APP_ENV=development                 # development | production
SECRET_KEY=change-me-in-production  # used for future auth features
ALLOWED_ORIGINS=http://localhost:3000  # comma-separated list of allowed CORS origins

# ── Database ─────────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_teacher
# When running via Docker Compose this is overridden to point at the db container.

# ── AI — pick at least one ───────────────────────────────────────
ACTIVE_LLM=openai          # openai | gemini  (which provider to use)
OPENAI_API_KEY=sk-...      # Required for ACTIVE_LLM=openai
GEMINI_API_KEY=AIza...     # Required for ACTIVE_LLM=gemini

# ── Text-to-Speech (optional) ────────────────────────────────────
TTS_PROVIDER=none                               # elevenlabs | azure | none
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM       # Default: "Rachel" voice
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=eastus

# ── Cloud Storage (optional) ─────────────────────────────────────
# If not configured, source files and audio are not persisted outside the container.
STORAGE_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=your_access_key
STORAGE_SECRET_ACCESS_KEY=your_secret_key
STORAGE_BUCKET_NAME=ai-teacher-assets
STORAGE_PUBLIC_BASE_URL=https://assets.yourdomain.com
```

Frontend reads one environment variable:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Supported Input Formats

| Format | Extensions | Extraction method |
|---|---|---|
| PDF | `.pdf` | `pypdf` — text extracted page by page |
| Word document | `.docx`, `.doc` | `python-docx` — paragraphs concatenated |
| Plain text / Markdown | `.txt`, `.md` | Raw UTF-8 decode |
| Images | `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.tiff` | GPT-4o vision (or Gemini Flash) — OCR + diagram description |
| Other | any | UTF-8 decode attempted; error raised if unsupported |

> **Size limit:** 50 MB per upload.  
> **Text limit:** Only the first 12 000 characters of extracted text are sent to the LLM (to stay within context-window budgets).

---

## Project Structure

```
visual-agentTeacher/
├── docker-compose.yml
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py                   # FastAPI app entry point, CORS middleware, lifespan hook
│       ├── config.py                 # Pydantic Settings — reads all env vars
│       ├── database.py               # SQLAlchemy async engine + session factory
│       ├── models/
│       │   ├── lesson.py             # Lesson, LessonPart, StoryboardScene ORM models
│       │   └── quiz.py               # Quiz, QuizQuestion, QuizAttempt ORM models
│       ├── schemas/                  # Pydantic request/response schemas (API contracts)
│       ├── routers/
│       │   ├── upload.py             # POST /upload/ — accepts file, starts background task
│       │   ├── lessons.py            # GET/DELETE /lessons/
│       │   ├── storyboard.py         # GET /storyboard/part/{id}
│       │   └── quiz.py               # GET /quiz/part/{id}, POST /quiz/{id}/attempt
│       └── services/
│           ├── document_extractor.py # PDF / DOCX / image → plain text
│           ├── ai_planner.py         # Plain text → structured lesson JSON via LLM
│           ├── storyboard_generator.py # Lesson JSON → DB rows
│           ├── tts_service.py        # Narration text → MP3 bytes
│           ├── quiz_evaluator.py     # Student answers → score + AI feedback
│           └── storage_service.py    # Bytes → S3/R2 URL
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── app/
    │   ├── layout.tsx                # Root layout, global CSS
    │   ├── page.tsx                  # Home page: upload zone + lesson history list
    │   └── lesson/[id]/page.tsx      # Lesson viewer: whiteboard + nav + quiz
    ├── components/
    │   ├── Whiteboard/
    │   │   ├── Whiteboard.tsx        # SVG canvas — renders scenes based on elapsed time
    │   │   └── AnimationEngine.tsx   # Headless timer component — drives elapsed + audio
    │   ├── Quiz/
    │   │   └── QuizPanel.tsx         # Quiz UI: MCQ, fill-blank, short-answer
    │   ├── Navigation/
    │   │   └── NavigationControls.tsx # Play/pause, speed (0.5×–3×), zoom, skip, prev
    │   └── Upload/
    │       └── UploadZone.tsx        # Drag-and-drop, file picker, polling progress
    ├── store/
    │   └── lessonStore.ts            # Zustand store: lesson data + all playback state
    └── lib/
        ├── types.ts                  # Shared TypeScript interfaces for all API data
        └── api.ts                    # Typed fetch wrappers for every API endpoint
```

---

## Frontend Deep-Dive

### Page: `/` (Home)

- Shows a drag-and-drop `UploadZone` at the top.
- Lists all previously generated lessons below.
- After upload the component polls `/api/v1/upload/status/{id}` every 2 seconds until `status === "ready"`, then redirects to `/lesson/{id}`.

### Page: `/lesson/[id]`

- Fetches the full lesson (parts + scenes) from `/api/v1/lessons/{id}`.
- Renders the `Whiteboard`, `AnimationEngine`, `NavigationControls`, and (when needed) `QuizPanel`.

### Whiteboard (SVG)

- Pure SVG — 800 × 500 logical units, scaled by a `zoom` factor.
- A subtle 40 × 40 grid is drawn with a CSS pattern.
- Three coloured arrowhead markers are pre-defined (`arrowhead`, `arrowhead-red`, `arrowhead-blue`).
- On each render tick the component checks which scenes have `time_offset ≤ elapsed` and adds them to the visible list.
- Each scene type is rendered as a specific SVG element with a CSS `whiteboard-appear` entrance animation.
- A `clear` action wipes all visible elements.

### AnimationEngine (headless)

- Runs a `setInterval` at 100 ms intervals when `status === "playing"`.
- Each tick: `elapsed += 0.1 × speed`.
- Uses a `useRef` to avoid stale closures in the interval callback.
- When `elapsed ≥ part.duration_seconds` it calls `onPartComplete()`.
- Also controls an `HTMLAudioElement` when an `audio_url` is present.

### Zustand Store (`lessonStore.ts`)

The single source of truth for all playback state:

| State key | Type | Description |
|---|---|---|
| `lesson` | `Lesson \| null` | Full lesson data |
| `currentPartIndex` | `number` | Which part is active |
| `status` | `"idle" \| "playing" \| "paused" \| "quiz" \| "finished"` | Player state |
| `elapsed` | `number` | Seconds elapsed in current part |
| `speed` | `number` | Playback speed multiplier |
| `zoom` | `number` | Whiteboard zoom factor |
| `activeQuiz` | `Quiz \| null` | Quiz data for the current quiz part |
| `quizResult` | `QuizAttemptResult \| null` | Most recent quiz attempt result |

---

## Backend Deep-Dive

### Upload pipeline (`routers/upload.py`)

1. File bytes read into memory (max 50 MB).
2. A `Lesson` row is immediately written with `status="processing"`.
3. The response (202 Accepted) is sent to the client.
4. `asyncio.create_task` fires the `_process_lesson` coroutine in the background.
5. On success: `status="ready"`. On any exception: `status="error"`.

> ⚠️ **Note:** The background task runs inside the same Python process using `asyncio.create_task`. There is no persistent task queue. If the server restarts mid-processing, the task is lost and the lesson stays at `status="processing"` forever.

### AI Planner (`services/ai_planner.py`)

- Builds a detailed curriculum-design prompt with full JSON schema.
- Canvas is defined as 800 × 500. The AI is instructed to place actions every 3-6 seconds.
- GPT-4o is called with `response_format={"type":"json_object"}` to guarantee valid JSON.
- Gemini uses `response_mime_type: "application/json"`.
- If neither provider is configured, a static placeholder plan is returned (one content part + one quiz).

### Storyboard Generator (`services/storyboard_generator.py`)

Walks the AI plan JSON and creates:
- Updates `lesson` title/subject/summary.
- One `LessonPart` per part entry.
- One `StoryboardScene` per `visual_sequence` item (stores the whole visual action dict in a `payload` JSON column).
- One `Quiz` + `QuizQuestion` rows for every quiz/final_quiz part.

### Quiz Evaluator (`services/quiz_evaluator.py`)

| Question type | Evaluation method |
|---|---|
| `mcq` | Case-insensitive exact string match |
| `fill_blank` | Case-insensitive exact string match |
| `short_answer` | GPT-4o-mini / Gemini Flash AI judgment (`correct: bool, explanation: str`) |
| `graph_interpretation` | Same AI judgment path |
| Any (no AI key) | Keyword overlap heuristic |

Pass threshold: **70%** of questions correct.

---

## Database Schema

```
lessons
  id              UUID  PK
  title           VARCHAR(512)
  subject         VARCHAR(256)
  source_filename VARCHAR(512)
  source_file_url TEXT          -- S3/R2 URL, null if storage not configured
  raw_text        TEXT          -- full extracted text
  summary         TEXT
  status          VARCHAR(64)   -- processing | ready | error
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

lesson_parts
  id               UUID  PK
  lesson_id        UUID  FK → lessons.id  (CASCADE DELETE)
  order_index      INT
  title            VARCHAR(512)
  narration        TEXT
  duration_seconds INT
  audio_url        TEXT          -- TTS MP3 URL, null if TTS disabled
  part_type        VARCHAR(64)   -- content | quiz | final_quiz

storyboard_scenes
  id           UUID   PK
  part_id      UUID   FK → lesson_parts.id  (CASCADE DELETE)
  time_offset  FLOAT  -- seconds from start of part
  action_type  VARCHAR(64)
  payload      JSON   -- action-specific parameters

quizzes
  id       UUID  PK
  part_id  UUID  FK → lesson_parts.id  (CASCADE DELETE)

quiz_questions
  id             UUID  PK
  quiz_id        UUID  FK → quizzes.id  (CASCADE DELETE)
  order_index    INT
  question_type  VARCHAR(64)   -- mcq | fill_blank | short_answer | graph_interpretation
  question_text  TEXT
  options        JSON          -- {"choices": [...], "correct": "..."}  (MCQ only)
  correct_answer TEXT
  explanation    TEXT
  difficulty     VARCHAR(32)   -- easy | medium | hard

quiz_attempts
  id          UUID  PK
  quiz_id     UUID  FK → quizzes.id  (CASCADE DELETE)
  session_id  VARCHAR(256)  -- anonymous browser session, no auth yet
  answers     JSON          -- {"<question_id>": "<user_answer>"}
  score       INT
  feedback    JSON          -- {"<question_id>": {correct, correct_answer, explanation}}
  passed      BOOLEAN
  created_at  TIMESTAMP
```

---

## API Reference

Interactive documentation is available at **http://localhost:8000/docs** (Swagger UI) when the backend is running.

### Upload

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/v1/upload/` | `multipart/form-data`: `file` (required), `subject` (optional string) | `202` `{id, status, parts_count}` |
| `GET` | `/api/v1/upload/status/{lesson_id}` | — | `{id, status, title, parts_count}` |

Status values: `processing` → `ready` or `error`.

### Lessons

| Method | Endpoint | Response |
|---|---|---|
| `GET` | `/api/v1/lessons/` | Array of `{id, status, title, parts_count}` |
| `GET` | `/api/v1/lessons/{id}` | Full `Lesson` object with `parts[]` and `parts[].scenes[]` |
| `DELETE` | `/api/v1/lessons/{id}` | `204 No Content` |

### Storyboard

| Method | Endpoint | Response |
|---|---|---|
| `GET` | `/api/v1/storyboard/part/{part_id}` | `LessonPart` including `scenes[]` sorted by `time_offset` |

### Quiz

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `GET` | `/api/v1/quiz/part/{part_id}` | — | `{id, part_id, questions[]}` |
| `POST` | `/api/v1/quiz/{quiz_id}/attempt` | `{"answers": {"<q_id>": "<answer>"}, "session_id": "..."}` | `{id, quiz_id, score, passed, feedback}` |

### Health

| Method | Endpoint | Response |
|---|---|---|
| `GET` | `/health` | `{"status": "ok"}` |

---

## The Storyboard System

The storyboard is the core data structure that drives the whiteboard animation. The AI outputs a `visual_sequence` for each lesson part — an array of timed drawing commands.

### Supported Action Types

| Action | Required payload fields | Notes |
|---|---|---|
| `draw_text` | `content`, `position: [x, y]`, `style?` | `style`: `fontSize`, `color`, `fontWeight`, `fontStyle`, `textAnchor` |
| `draw_arrow` | `from: [x,y]`, `to: [x,y]`, `label?`, `style?` | `style`: `color`, `strokeWidth`. Animated draw-on using `strokeDasharray`. Three pre-built arrowhead colours: black, red (`#e63946`), blue (`#2563eb`). |
| `draw_circle` | `center: [x,y]`, `radius`, `label?`, `style?` | `style`: `fill`, `stroke`, `strokeWidth` |
| `draw_rect` | `x`, `y`, `width`, `height`, `label?`, `style?` | `style`: `fill`, `stroke`, `strokeWidth`. Rounded corners (`rx=4`). |
| `draw_graph` | `graph_type`, `data.values[]`, `data.labels?[]`, `position`, `size`, `title?` | Supports `bar` and `line`. `scatter` is defined in types but not yet rendered. |
| `show_equation` | `latex`, `position: [x,y]`, `style?` | Rendered as plain italic SVG text — **not** proper LaTeX. |
| `highlight` | `target`, `color?` | Defined in the type system but **renders nothing** currently. |
| `underline` | `target`, `color?` | Listed in `types.ts` but not in the AI prompt and not rendered. |
| `clear` | _(none)_ | Wipes the entire whiteboard. |

### Canvas Coordinates

The SVG viewBox is **800 × 500** units. Coordinates in the `payload` refer to this space. The `zoom` setting in the store scales the entire SVG without changing coordinate values.

---

## Authentication & Admin Panel

The app ships with a built-in authentication system, per-user data isolation, an AI request quota, and a full admin panel.

### Signup Flow

1. A new visitor opens **`/request-access`**, enters an email + username (and optional reason).
2. The request is stored as an `EarlyAccessRequest` (status `pending`).
3. An admin sees the request under **`/admin/early-access`** and approves it.
4. The admin receives a copy-able invite URL (or receives an email if SMTP is configured).
5. The invitee opens the URL, **`/signup/{token}`**. The page verifies the token and locks the email + username fields.
6. They set a password. The account is created.
7. From then on they sign in at **`/login`**.

If the email or username entered on the signup page does not match what the admin approved, signup is rejected and the user is bounced back to `/request-access`.

### Sessions

- Sessions are stored server-side in MongoDB (`Session` collection).
- The browser only holds an httpOnly cookie named `wb_session`.
- All API calls use `credentials: "include"`. CORS is configured to allow cookies from `ALLOWED_ORIGINS`.
- Sessions can be revoked by an admin (or by logging out).

### Per-User Data Isolation

- Every `Lesson` carries an `ownerId` field.
- `GET /lessons`, `GET /dashboard`, `GET /storyboard/*`, and `GET /quiz/*` only return data that belongs to the current user.
- Admin users (role `admin`) bypass this filter and can see everything.
- Attempts to access another user's data return `404` (existence is not leaked).

### AI Request Quota

- Each user has `max_ai_requests` (default **3**) and `ai_requests_used`.
- Every `POST /upload` and `POST /explain` reserves one slot atomically.
- If the user is at their limit, the request returns `429 Too Many Requests`.
- The dashboard header shows `used / max` and warns the user when exhausted.
- An admin can change a user's quota (and reset the used counter) from **`/admin/users`**.

### Admin Panel

The admin panel lives at **`/admin`** (sign in separately at `/admin/login`).

| Page | Purpose |
|---|---|
| `/admin` | Overview: counts of users, requests, lessons, 7-day activity, lesson status mix |
| `/admin/early-access` | Approve, reject, or delete early-access requests. Approved requests reveal a copy-able invite URL |
| `/admin/users` | Create users, edit quota / role / status / password, reset AI usage, view per-user lessons |
| `/admin/lessons` | Browse every lesson in the system, filter by status, open the full preview, or delete |
| `/admin/logs/login` | Login attempts (success and failure) with IP, user-agent, email |
| `/admin/logs/ai` | Every AI request (allow / block) with user, route, timestamp |
| `/admin/logs/pages` | Page views and admin actions (last 24h per IP, deduplicated 2s) |

Admin actions are auto-logged to the page-views collection. Every action taken in the admin panel is attributed to the admin's identity.

### Configuration

Add the following to `backend/.env`:

```bash
# ── First admin (auto-seeded on boot if the user collection is empty) ──
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-strong-password
# Force-reset the admin password on next boot (useful after a credential rotation)
ADMIN_PASSWORD_FORCE=false

# ── Optional SMTP for invite emails ──
# If unset, invite URLs are logged to the server console and shown in the admin UI.
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Whiteboard Teacher <no-reply@yourdomain.com>"
```

> The very first operator can also self-onboard by visiting `/login` while the database is still empty — the form switches into a "Create the first admin" mode.

### Smoke Test

A regression test for the full auth + admin flow is provided at `backend/scripts/smoke-auth.mjs`. It runs the entire request → approve → signup → login → quota flow against any MongoDB URI:

```bash
cd backend
MONGODB_URI="mongodb+srv://..." node scripts/smoke-auth.mjs
```

Expected output: `Result: 42 passed, 0 failed.`

---

## Known Limitations & What's Missing

This is a functional prototype. The following areas are incomplete or not yet implemented:

### Infrastructure / Production Readiness

| Issue | Detail |
|---|---|
| **No Alembic migrations** | Database schema is created with `SQLAlchemy create_all` on startup. Schema changes require manual `DROP TABLE` and restart. |
| **No task queue** | Background processing uses `asyncio.create_task`. If the server restarts mid-upload the task is lost and the lesson is stuck at `status="processing"`. Production use requires Celery, ARQ, or a similar queue. |
| **User authentication is in place** | ✅ The Node.js/MongoDB port of the backend adds an early-access signup flow, sessions, per-user data isolation, an AI quota, and a full admin panel. See [Authentication & Admin Panel](#authentication--admin-panel). |
| **No user progress tracking** | Quiz results are stored in the DB but there is no per-user history or progress dashboard. |
| **Storage is optional** | Without S3/R2 credentials, uploaded source files and TTS audio are not persisted outside the container. Audio narration will not work. |

### Frontend / UX

| Issue | Detail |
|---|---|
| **`highlight` action does nothing** | `renderScene` returns `null` for `highlight`. The action is planned by the AI but never drawn. |
| **`scatter` graph not rendered** | `draw_graph` with `graph_type: "scatter"` returns `null` from `renderGraph`. |
| **`underline` action not rendered** | Listed in `types.ts` but missing from the AI prompt and the renderer. |
| **Equations are plain text** | `show_equation` renders LaTeX as italic SVG text. KaTeX or MathJax is needed for proper rendering. |
| **No seek / scrub bar** | Users can play/pause/speed and skip parts, but cannot scrub to an arbitrary time within a part. |
| **Not mobile-responsive** | The 800 × 500 whiteboard and control layout are designed for desktop widths. |
| **No lesson sharing** | Lessons are only accessible from the same browser session on the same instance. |

### AI / Content Quality

| Issue | Detail |
|---|---|
| **12 000 character input cap** | Long documents are truncated. The AI never sees content beyond the first ~12 000 characters. |
| **No retry / resume on partial failure** | If the AI call succeeds but TTS fails, the lesson is still marked `ready`. No way to re-run only the failed step. |
| **No adaptive difficulty** | Quiz difficulty does not change based on student performance. |
| **No semantic search** | There is no way to search lesson content or find related lessons. |

---

## Troubleshooting

### Lesson stuck at "processing"

The background task may have crashed silently.
1. Check the backend logs: `docker compose logs backend`
2. Common causes: missing `OPENAI_API_KEY`, database connection failure, unsupported file content.
3. If the server restarted during processing, delete the stuck lesson and re-upload.

### "No AI provider configured" — placeholder lesson generated

Set `OPENAI_API_KEY` (or `GEMINI_API_KEY` + `ACTIVE_LLM=gemini`) in `backend/.env` and restart.

### Frontend cannot reach the backend

- Check that `NEXT_PUBLIC_API_URL` points to the correct host/port.
- In Docker Compose, the frontend container uses `http://localhost:8000` which maps to your host machine — this works for browser requests. Server-side fetches inside the Next.js container need `http://backend:8000`.

### Database tables not created

The `init_db()` call in the FastAPI lifespan runs `create_all`. If you see "table does not exist" errors:
1. Ensure the `db` container is healthy before the backend starts (`depends_on: db: condition: service_healthy` is set in `docker-compose.yml`).
2. Check backend startup logs for errors.

### Audio narration not playing

TTS requires:
1. `TTS_PROVIDER` set to `elevenlabs` or `azure` (default is `none`).
2. The corresponding API key set.
3. S3/R2 storage configured so the generated MP3 can be stored and served.

---

## Roadmap

- [ ] Alembic migrations (replace `create_all` shortcut)
- [ ] Persistent background task queue (Celery / ARQ)
- [x] User accounts & authentication _(implemented in the Node.js port)_
- [ ] Per-user progress tracking and lesson history
- [ ] Lesson sharing & embedding (public URLs)
- [ ] Implement `highlight` and `underline` visual actions
- [ ] Implement `scatter` graph rendering
- [ ] KaTeX integration for proper LaTeX equation rendering
- [ ] Seek / scrub bar for within-part navigation
- [ ] Mobile-responsive whiteboard layout
- [ ] Semantic search over lesson content (embeddings)
- [ ] Adaptive quiz difficulty based on student performance
- [ ] Export lesson as PDF summary
- [ ] Resume processing from last successful step after failure
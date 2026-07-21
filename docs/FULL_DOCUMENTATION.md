# CodeBuddy — AI Whiteboard Teacher Platform
## Complete System Documentation

---

# TABLE OF CONTENTS

1. [PROJECT OVERVIEW](#1-project-overview)
2. [SYSTEM ARCHITECTURE](#2-system-architecture)
3. [PROJECT STRUCTURE](#3-project-structure)
4. [FOUNDATIONS & FRAMEWORKS](#4-foundations--frameworks)
5. [BACKEND (Node.js/Express)](#5-backend)
6. [FRONTEND APPS](#6-frontend-apps)
7. [DATABASE (MongoDB)](#7-database)
8. [AUTHENTICATION & AUTHORIZATION](#8-authentication--authorization)
9. [WHITEBOARD SYSTEM](#9-whiteboard-system)
10. [AI PIPELINE](#10-ai-pipeline)
11. [CODING TEACHER PLATFORM](#11-coding-teacher-platform)
12. [API REFERENCE](#12-api-reference)
13. [ENVIRONMENT VARIABLES](#13-environment-variables)
14. [DEPLOYMENT](#14-deployment)
15. [DATA FLOWS](#15-data-flows)

---

# 1. PROJECT OVERVIEW

**CodeBuddy / AI Whiteboard Teacher** is an end-to-end AI-powered educational platform that turns PDFs, lecture slides, text, and images into structured, animated, interactive whiteboard lessons. It also includes a full coding teacher platform with gamification, student management, parent portals, and admin features.

### Core Purpose

Take any educational content (PDF textbook chapter, lecture slides, typed notes, or an image of a whiteboard) and automatically generate:
- A structured **multi-lesson course** with clear learning objectives
- Animated **whiteboard videos** that visually explain each concept
- **Interactive quizzes** to test understanding (MCQ, fill-in-blank, short answer, graph interpretation)
- **AI voice narration** (text-to-speech) for each scene
- A **coding teacher platform** for programming education with exercises, exams, and gamification

---

# 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                   │
│                                                                         │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐     │
│  │  Student App     │   │   Admin App      │   │  Teacher App     │     │
│  │  (Next.js:3000)  │   │  (Next.js:3001)  │   │  (Next.js:3002)  │     │
│  │                  │   │                  │   │                  │     │
│  │  • Whiteboard    │   │  • User Mgmt     │   │  • Class Mgmt    │     │
│  │  • Quiz          │   │  • Lesson Browse │   │  • Exercises     │     │
│  │  • Lessons       │   │  • Access Mgmt   │   │  • Analytics     │     │
│  │  • Dashboard     │   │  • Logs          │   │  • Submissions   │     │
│  │  • Coding Learn  │   │                  │   │  • Coding Teach  │     │
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘     │
│           │                      │                      │              │
│           └──────────┬───────────┴───────────┬──────────┘              │
│                      │                       │                         │
│               HTTP REST API           HTTP REST API                    │
│           (credentials: include)   (credentials: include)              │
└──────────────────────┼───────────────────────┼─────────────────────────┘
                       │                       │
                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                      │
│                                                                         │
│              ┌─────────────────────────────────┐                       │
│              │    Backend (Node.js/Express)     │                       │
│              │         Port: 8000               │                       │
│              │                                  │                       │
│  ┌───────────┴─────────────────────────────────┴───────────┐           │
│  │                     MIDDLEWARE                           │           │
│  │  helmet │ cors │ morgan │ cookie-parser │ rate-limit    │           │
│  │  loadUser │ requireAuth │ adminAuth                      │           │
│  └───────────────────────┬─────────────────────────────────┘           │
│                          │                                             │
│  ┌───────────────────────┴─────────────────────────────────┐           │
│  │                    ROUTES                                │           │
│  │  /api/v1/upload/*  │  /api/v1/lessons/*                 │           │
│  │  /api/v1/auth/*    │  /api/v1/admin/*                   │           │
│  │  /api/v1/quiz/*    │  /api/v1/student/*                 │           │
│  │  /api/v1/teacher/* │  /api/v1/parent/*                  │           │
│  │  /api/v1/ai/*      │  /api/v1/gamification/*            │           │
│  └───────────────────────┬─────────────────────────────────┘           │
│                          │                                             │
│  ┌───────────────────────┴─────────────────────────────────┐           │
│  │                   SERVICES                               │           │
│  │  aiPlanner │ documentExtractor │ storyboardGenerator    │           │
│  │  quizEvaluator │ ttsService │ storageService            │           │
│  │  whiteboard/pedagogyAdapter │ sceneComposer             │           │
│  └───────────────────────┬─────────────────────────────────┘           │
└──────────────────────────┼─────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                       │
│                                                                         │
│  ┌──────────────────────┐   ┌──────────────────────┐                   │
│  │      MongoDB         │   │   Cloud Storage      │                   │
│  │  (Primary Database)  │   │   (S3 / Cloudflare R2)│                  │
│  │                      │   │                      │                   │
│  │  • Users/Sessions    │   │  • Uploaded files    │                   │
│  │  • Lessons/Parts     │   │  • Generated audio   │                   │
│  │  • Storyboards       │   │                      │                   │
│  │  • Quizzes/Attempts  │   └──────────────────────┘                   │
│  │  • Coding Teacher    │                                              │
│  │  • Logs              │                                              │
│  └──────────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────┘

                           EXTERNAL SERVICES
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │   BlazeAI        │  │   ElevenLabs     │  │   SMTP Server    │     │
│  │  (LLM Provider)  │  │  (Text-to-Speech)│  │  (Email Delivery)│     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 3. PROJECT STRUCTURE

```
visual-agentTeacher/
│
├── backend/                          # Node.js/Express API server
│   ├── src/
│   │   ├── index.js                  # Express app entry point
│   │   ├── db.js                     # MongoDB connection setup
│   │   ├── admin/                    # Admin API routes & middleware
│   │   ├── auth/                     # Authentication system
│   │   ├── coding-teacher/           # Coding teacher platform
│   │   ├── models/                   # Mongoose schemas
│   │   ├── routes/                   # Whiteboard feature routes
│   │   ├── services/                 # Business logic services
│   │   ├── templates/                # Whiteboard SVG template definitions
│   │   └── utils/                    # Utility functions
│   ├── scripts/                      # Test/utility scripts
│   ├── preview/                      # Template preview tool
│   ├── .env                          # Environment variables (actual values)
│   ├── .env.example                  # Example env file
│   ├── Dockerfile                    # Container build for backend
│   ├── dev-start.js                  # Local dev startup script
│   └── package.json                  # Dependencies
│
├── Student-Main/                     # Student-facing Next.js app (port 3000)
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # Landing page
│   │   ├── upload/page.tsx           # File upload
│   │   ├── lesson/[id]/page.tsx      # Whiteboard lesson viewer
│   │   ├── login/page.tsx            # Login
│   │   ├── register/page.tsx         # Registration
│   │   ├── request-access/page.tsx   # Early access request
│   │   ├── signup/[token]/page.tsx   # Invite-based signup
│   │   ├── search/page.tsx           # Lesson search
│   │   ├── contact/page.tsx          # Contact page
│   │   ├── student/                  # Student platform pages
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── learn/page.tsx
│   │   │   ├── whiteboard/page.tsx
│   │   │   ├── avatar-teacher/page.tsx
│   │   │   ├── exercises/page.tsx
│   │   │   ├── exams/page.tsx
│   │   │   ├── progress/page.tsx
│   │   │   ├── leaderboard/page.tsx
│   │   │   ├── challenges/page.tsx
│   │   │   ├── achievements/page.tsx
│   │   │   └── onboarding/page.tsx
│   │   └── parent/                   # Parent portal pages
│   │       ├── child/[studentId]/page.tsx
│   │       └── search/page.tsx
│   ├── components/                   # React components
│   │   ├── Whiteboard/               # Whiteboard rendering engine
│   │   ├── Quiz/                     # Quiz UI components
│   │   ├── Navigation/              # Playback controls
│   │   ├── Lesson/                   # Lesson page orchestrator
│   │   ├── Upload/                   # Upload zone
│   │   ├── Dashboard/                # Lesson history dashboard
│   │   ├── Auth/                     # Authentication guards
│   │   ├── Admin/                    # Admin layout shell
│   │   ├── CodeEditor/               # Code editor for exercises
│   │   └── shared/                   # Shared UI components
│   ├── store/                        # Zustand state management
│   │   ├── lessonStore.ts
│   │   └── authStore.ts
│   ├── lib/                          # API client, types, utilities
│   │   ├── api.ts                    # API client (all endpoints)
│   │   ├── types.ts                  # TypeScript type definitions
│   │   └── utils.ts                  # Utility functions
│   ├── features/                     # Feature-specific API and hooks
│   ├── hooks/                        # Custom React hooks
│   ├── middleware.ts                 # Next.js auth middleware
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── Dockerfile
│   └── package.json
│
├── Admin/                            # Admin-facing Next.js app (port 3001)
│   ├── app/                          # Admin pages
│   │   ├── page.tsx                  # Home
│   │   ├── admin/login/page.tsx      # Admin login
│   │   ├── admin/page.tsx            # Dashboard
│   │   ├── admin/early-access/page.tsx
│   │   ├── admin/users/page.tsx
│   │   ├── admin/users/[id]/page.tsx
│   │   ├── admin/lessons/page.tsx
│   │   ├── admin/lessons/[id]/page.tsx
│   │   ├── admin/registration-requests/page.tsx
│   │   ├── admin/logs/login/page.tsx
│   │   ├── admin/logs/ai/page.tsx
│   │   └── admin/logs/pages/page.tsx
│   ├── components/                   # Shared admin components
│   ├── store/                        # Zustand stores
│   ├── lib/                          # API client
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── Dockerfile
│   └── package.json
│
├── Teachers-dashboard/               # Teacher-facing Next.js app (port 3002)
│   ├── app/                          # Teacher pages
│   │   ├── page.tsx                  # Home
│   │   ├── login/page.tsx            # Teacher login
│   │   ├── teacher/dashboard/page.tsx
│   │   ├── teacher/my-classes/page.tsx
│   │   ├── teacher/students/page.tsx
│   │   ├── teacher/lessons/page.tsx
│   │   ├── teacher/ai-lessons/page.tsx
│   │   ├── teacher/exercises/page.tsx
│   │   ├── teacher/exams/page.tsx
│   │   ├── teacher/submissions/page.tsx
│   │   ├── teacher/challenges/page.tsx
│   │   ├── teacher/lesson-paths/page.tsx
│   │   ├── teacher/registration-requests/page.tsx
│   │   └── teacher/analytics/page.tsx
│   ├── components/                   # Teacher components
│   ├── lib/
│   ├── Dockerfile
│   └── package.json
│
├── docs/                             # Documentation
├── docker-compose.yml                # Multi-service orchestration
├── README.md
├── IMPLEMENTATION_SUMMARY.md
├── IMPROVEMENTS.md
├── WHITEBOARD_IMPROVEMENTS.md
├── QUICK_START.md
└── svgs.md
```

---

# 4. FOUNDATIONS & FRAMEWORKS

## 4.1 Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 4.19 | HTTP server & routing framework |
| **Mongoose** | 9.6 | MongoDB ODM (Object Document Mapper) |
| **OpenAI SDK** | 4.52 | AI model calls (OpenAI-compatible) |
| **@google/generative-ai** | 0.15 | Gemini AI provider |
| **@anthropic-ai/sdk** | 0.96 | Anthropic Claude AI provider |
| **@aws-sdk/client-s3** | 3.600 | S3/R2 cloud storage |
| **Multer** | — | File upload handling |
| **pdf-parse** | — | PDF text extraction |
| **mammoth** | — | DOCX text extraction |
| **bcrypt** | — | Password hashing |
| **nodemailer** | — | Email delivery |
| **@dagrejs/dagre** | — | Graph layout engine |
| **helmet, cors, morgan** | — | Security, CORS, logging |
| **cookie-parser** | — | Session cookie parsing |
| **express-rate-limit** | 8.6 | Rate limiting |
| **dotenv** | — | Environment variable loading |

## 4.2 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2 | React framework with App Router |
| **React** | 18 | UI component library |
| **TypeScript** | 5 | Type safety |
| **Zustand** | 5 | State management |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **lucide-react** | — | Icon library |
| **d3** | 7.9 | Data visualization |
| **axios** | — | HTTP client |

---

# 5. BACKEND

## 5.1 Entry Point (`backend/src/index.js`)

The Express server starts on **port 8000** with the following middleware stack:

```
Request → helmet → cors → morgan → cookie-parser → rate-limit → json parser → loadUser → routes
```

- **CORS**: Allows origins from `ALLOWED_ORIGINS` env var (defaults to localhost:3000,3001,3002)
- **Rate Limiting**: 300 requests per 60 seconds on `/api/` paths
- **JSON Parser**: 10MB request body limit
- **Cookie Parser**: Reads session cookies
- **loadUser**: Non-blocking middleware that resolves session cookie → user for every request

## 5.2 Services (`backend/src/services/`)

This is the core business logic layer:

### documentExtractor.js
Extracts and processes text from various file formats:
- **PDF** → `pdf-parse` library extracts raw text
- **DOCX** → `mammoth` library converts to HTML, then strips tags
- **Images** → Send to BlazeAI vision API for OCR/description
- **TXT/MD** → Direct text extraction
- **PPTX** → Not implemented yet (returns "unsupported")
- Strips excessive whitespace, normalizes text, enforces max length

### aiPlanner.js (~5295 lines)
The **brain of the system**. This is the main AI orchestrator. See [Section 10 - AI Pipeline](#10-ai-pipeline) for full details.

### storyboardGenerator.js
Persists the AI-generated plan into MongoDB:
- Creates `Lesson` record with status and metadata
- Creates `LessonPart` records for each part in the lesson
- Creates `StoryboardScene` records for each scene in each part
- Creates `Quiz` and `QuizQuestion` records for each part that has a quiz
- Handles multi-lesson series scheduling in background

### quizEvaluator.js
Evaluates quiz submissions:
- **MCQ**: Exact answer matching
- **Fill-in-blank**: Case-insensitive exact match with tolerance
- **Short answer**: Uses AI to evaluate semantic correctness
- **Graph interpretation**: Uses AI to evaluate correctness
- Returns score, feedback, and pass/fail status

### ttsService.js
Generates voice narration audio for each scene:
- Primary: **ElevenLabs** API (high quality)
- Alternative: **Azure Speech** service
- Caches generated audio in cloud storage
- Returns URL of generated audio file

### storageService.js
Handles file uploads to cloud storage:
- Configurable provider (AWS S3 or Cloudflare R2)
- Uploads: files, generated audio
- Signed URLs for secure access

## 5.3 Whiteboard Engine (`services/whiteboard/`)

### pedagogyAdapter.js
Converts AI-generated lesson parts into pedagogically sequenced scenes:
- Maps each semantic intent (define, compare, process, etc.) to scene structure
- Ensures proper educational flow

### sceneComposer.js
Composes storyboard scenes by selecting templates and arranging elements:
- Template selection based on scene intent
- Collision-free layout
- Timing/duration calculation

### templateLibrary.js
Contains 60+ whiteboard templates organized by intent:
- define, compare, process, hierarchy, timeline, cause-effect, data, cluster, cycle, example, recap, formula, map

### svgShapeLibrary.js / svgShapes.js
200+ educational SVG shapes organized by category:
- Biology/Medicine, Mathematics, Physics, Chemistry, Engineering, Programming, Business, Weather, Nature

### Prompts (`services/prompts/index.js`)
AI prompt templates guiding the LLM behavior:
- `TUTOR_PHILOSOPHY`: Educational philosophy for the AI
- `COMPREHENSION`: Instructions for understanding source material
- `DECOMPOSITION`: Instructions for splitting into lessons
- `TEACHING`: Instructions for generating whiteboard scenes
- `VISUAL_COMPOSITION`: Instructions for visual layout
- `REFINEMENT`: Quality check criteria

---

# 6. FRONTEND APPS

## 6.1 Student-Main (Port 3000)

The main student-facing application with the whiteboard viewer.

### Key Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Landing page with hero, features, role selection, CTA |
| `/upload` | `app/upload/page.tsx` | File upload — drag-and-drop zone to start lesson generation |
| `/lesson/[id]` | `app/lesson/[id]/page.tsx` | Whiteboard lesson viewer (server-rendered, interactive) |
| `/login` | `app/login/page.tsx` | Login form (email/username + password) |
| `/register` | `app/register/page.tsx` | Registration form |
| `/request-access` | `app/request-access/page.tsx` | Early access request form |
| `/signup/[token]` | `app/signup/[token]/page.tsx` | Invite-based signup (from admin approval) |
| `/search` | `app/search/page.tsx` | Search/filter all lessons |
| `/contact` | `app/contact/page.tsx` | Contact page |
| `/student/dashboard` | `app/student/dashboard/page.tsx` | Student overview dashboard |
| `/student/learn` | `app/student/learn/page.tsx` | Learning path / curriculum |
| `/student/whiteboard` | `app/student/whiteboard/page.tsx` | Alternative whiteboard viewer |
| `/student/avatar-teacher` | `app/student/avatar-teacher/page.tsx` | AI avatar teacher (interactive) |
| `/student/exercises` | `app/student/exercises/page.tsx` | Coding exercises |
| `/student/exams` | `app/student/exams/page.tsx` | Exams |
| `/student/progress` | `app/student/progress/page.tsx` | Progress tracking & stats |
| `/student/leaderboard` | `app/student/leaderboard/page.tsx` | Gamification leaderboard |
| `/student/challenges` | `app/student/challenges/page.tsx` | Weekly coding challenges |
| `/student/achievements` | `app/student/achievements/page.tsx` | Badges and achievements |
| `/student/onboarding` | `app/student/onboarding/page.tsx` | Student onboarding flow |
| `/parent/child/[studentId]` | `app/parent/child/[studentId]/page.tsx` | Parent view of a child |
| `/parent/search` | `app/parent/search/page.tsx` | Search for children |

### Key Components

#### Whiteboard (`components/Whiteboard/Whiteboard.tsx`)
The core visual engine — a large (~1200+ line) React component that:
- Renders SVG scenes from `StoryboardScene` data
- Supports camera animations (zoom, pan) controlled by `camera` action type
- Draws SVG shapes from the shape library
- Shows text with write-on animation (stroke-dasharray)
- Draws arrows, lines, circles, rectangles, paths, badges, callouts
- Shows math equations as styled SVG text
- Renders bar/line graphs and coordinate systems
- Supports `clear` action that wipes the board between sections
- Handles `highlight`, `caption`, `draw_object` actions

#### AnimationEngine (`components/Whiteboard/AnimationEngine.tsx`)
A headless timer component that:
- Tracks `elapsed` time
- Drives scene progression (auto-advance based on scene duration)
- Handles play/pause/reset/speed controls
- Syncs with audio playback (if TTS audio exists)
- Emits time-update events to Whiteboard

#### NavigationControls (`components/Navigation/NavigationControls.tsx`)
Playback control bar:
- Play / Pause button
- Speed control (0.5x, 1x, 1.5x, 2x)
- Previous / Next scene
- Part selector dropdown
- Zoom controls
- Progress indicator (scene X of Y)

#### QuizPanel (`components/Quiz/QuizPanel.tsx`)
Interactive quiz UI:
- Displays MCQs, fill-in-blank, short answer, graph interpretation questions
- Handles answer submission
- Shows results with score and feedback
- Animates transitions between question types

#### UploadZone (`components/Upload/UploadZone.tsx`)
File upload interface:
- Drag-and-drop zone
- File type validation (PDF, DOCX, TXT, MD, images)
- Progress indicator (polling status endpoint)
- Error handling display

#### LessonPageClient (`components/Lesson/LessonPageClient.tsx`)
**The main orchestrator** for the lesson viewing page:
1. Fetches lesson data from API
2. Passes data to Whiteboard
3. Connects AnimationEngine to Whiteboard
4. Handles playlist logic (next part, quiz mode, finish)
5. Shows quiz after each part
6. Manages lesson-level state transitions

### State Management (Zustand)

#### lessonStore.ts
Single source of truth for everything playback-related:

```typescript
interface LessonState {
  lesson: Lesson | null;           // Full lesson data (parts, scenes, quiz)
  currentPartIndex: number;        // Which part we're on
  status: 'idle' | 'playing' | 'paused' | 'quiz' | 'finished';
  elapsed: number;                 // Current time in seconds
  speed: number;                   // Playback speed multiplier
  zoom: number;                    // Camera zoom level
  activeQuiz: Quiz | null;        // Current quiz if in quiz mode
  quizResult: QuizResult | null;  // Last quiz result
  error: string | null;
  
  // Actions
  play(): void;
  pause(): void;
  togglePlay(): void;
  reset(): void;
  nextPart(): void;
  prevPart(): void;
  setSpeed(speed: number): void;
  setZoom(zoom: number): void;
  setElapsed(time: number): void;
  loadLesson(lesson: Lesson): void;
}
```

#### authStore.ts
Authentication state:

```typescript
interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
}
```

## 6.2 Admin App (Port 3001)

The administration dashboard for managing the platform.

| Route | Purpose |
|-------|---------|
| `/` | Home / landing |
| `/admin/login` | Separate admin login |
| `/admin` | Main dashboard with platform stats |
| `/admin/early-access` | Manage early access requests (approve/reject) |
| `/admin/users` | User management (list, create, edit, delete) |
| `/admin/users/[id]` | Single user detail/editing |
| `/admin/lessons` | Browse all lessons across all users |
| `/admin/lessons/[id]` | Preview a specific lesson |
| `/admin/registration-requests` | Student registration requests |
| `/admin/logs/login` | View login attempt logs |
| `/admin/logs/ai` | View AI request logs |
| `/admin/logs/pages` | View page view logs |

## 6.3 Teacher Dashboard (Port 3002)

For teachers managing classes, exercises, and students.

| Route | Purpose |
|-------|---------|
| `/` | Home |
| `/login` | Teacher login |
| `/teacher/dashboard` | Overview with class stats |
| `/teacher/my-classes` | Class management (create, edit, roster) |
| `/teacher/students` | View and manage students |
| `/teacher/lessons` | Manage lessons |
| `/teacher/ai-lessons` | Browse AI-generated lessons |
| `/teacher/exercises` | Create/manage programming exercises |
| `/teacher/exams` | Create/manage exams |
| `/teacher/submissions` | View student submissions |
| `/teacher/challenges` | Manage weekly challenges |
| `/teacher/lesson-paths` | Design lesson paths |
| `/teacher/registration-requests` | Approve student registrations |
| `/teacher/analytics` | Detailed analytics dashboard |

## 6.4 Frontend ↔ Backend Connection

All three frontend apps connect to the **same backend** at `http://localhost:8000/api/v1`:

```
┌─────────────┐     credentials: "include"     ┌──────────────┐
│  Frontend   │ ──────────────────────────────▶ │   Backend    │
│  (Next.js)  │ ◀────────────────────────────── │  (Express)   │
│             │        JSON responses           │  Port 8000   │
│  Port 3000  │                                 │              │
│  3001,3002  │     Cookie: wb_session=...      │  MongoDB     │
└─────────────┘                                 └──────────────┘
```

- **API Client** (`lib/api.ts`): Typed fetch/wrapper functions for every endpoint
- **Auth**: Session cookie (`wb_session`) is httpOnly, sent automatically with `credentials: "include"`
- **SSR**: On server-rendered pages, Next.js reads cookies from the incoming request and forwards them to the backend
- **Environment Variable**: `NEXT_PUBLIC_API_URL` configures the API base URL

---

# 7. DATABASE

## 7.1 MongoDB Connection (`backend/src/db.js`)

MongoDB is the single database. Connection is established at startup using `MONGODB_URI` environment variable with retry logic.

## 7.2 Whiteboard Models

### Lesson
```
{
  _id: ObjectId,
  title: String,
  subject: String,
  sourceFilename: String,       // Original uploaded file name
  rawText: String,              // Extracted text from document
  status: String,               // 'processing' | 'ready' | 'error' | 'running' | 'pending'
  processingStep: String,       // Current step in pipeline
  seriesId: ObjectId,           // References LessonSeries if part of a series
  lessonIndex: Number,          // Index within series
  ownerId: ObjectId,            // References User
  createdAt: Date,
  updatedAt: Date
}
```

### LessonPart
```
{
  _id: ObjectId,
  lessonId: ObjectId,           // References Lesson
  orderIndex: Number,
  title: String,
  narration: String,            // Narration text for voiceover
  durationSeconds: Number,      // Estimated duration
  audioUrl: String,             // URL to TTS audio file
  partType: String,             // 'introduction' | 'content' | 'summary'
  createdAt: Date
}
```

### StoryboardScene
```
{
  _id: ObjectId,
  partId: ObjectId,             // References LessonPart
  timeOffset: Number,           // Seconds from start of part
  actionType: String,           // 'draw_text' | 'draw_arrow' | 'draw_circle' | 'draw_rect' | etc.
  payload: Mixed,               // Scene-specific data (content, position, style)
  createdAt: Date
}
```

### Quiz
```
{
  _id: ObjectId,
  partId: ObjectId,             // References LessonPart (can be null for standalone quiz)
  title: String,
  createdAt: Date
}
```

### QuizQuestion
```
{
  _id: ObjectId,
  quizId: ObjectId,             // References Quiz
  questionType: String,         // 'mcq' | 'fill_blank' | 'short_answer' | 'graph_interpretation'
  questionText: String,
  options: [String],            // For MCQ
  correctAnswer: String,
  orderIndex: Number,
  createdAt: Date
}
```

### QuizAttempt
```
{
  _id: ObjectId,
  quizId: ObjectId,
  sessionId: ObjectId,          // References Session
  answers: [{
    questionId: ObjectId,
    answer: String,
    correct: Boolean,
    feedback: String
  }],
  score: Number,                // 0-100
  feedback: String,
  passed: Boolean,
  createdAt: Date
}
```

### LessonSeries
```
{
  _id: ObjectId,
  title: String,
  ownerId: ObjectId,
  remainingSpecs: [Mixed],      // Background processing queue
  status: String,               // 'active' | 'completed'
  createdAt: Date
}
```

## 7.3 Auth Models

### User
```
{
  _id: ObjectId,
  email: String,                // Unique
  username: String,             // Unique
  passwordHash: String,         // bcrypt hashed
  role: String,                 // 'user' | 'admin' | 'super-admin' | 'teacher' | 'student' | 'parent'
  status: String,               // 'active' | 'suspended'
  inviteToken: String,          // For invite-based signup
  maxAiRequests: Number,        // AI quota (default 3)
  aiRequestsUsed: Number,
  profile: Mixed,               // Additional profile data
  createdAt: Date,
  updatedAt: Date
}
```

### Session
```
{
  _id: ObjectId,
  token: String,                // Unique session token
  userId: ObjectId,             // References User
  role: String,
  expiresAt: Date,              // 30-day TTL
  createdAt: Date
}
```

### EarlyAccessRequest
```
{
  _id: ObjectId,
  email: String,
  username: String,
  status: String,               // 'pending' | 'approved' | 'rejected' | 'completed' | 'expired'
  inviteToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 7.4 Log Models

### LoginLog
```
{
  _id: ObjectId,
  userId: ObjectId,
  email: String,
  success: Boolean,
  failureReason: String,
  ip: String,
  userAgent: String,
  createdAt: Date
}
```

### AiRequestLog
```
{
  _id: ObjectId,
  userId: ObjectId,
  type: String,                 // 'upload' | 'explain'
  provider: String,
  model: String,
  status: String,               // 'success' | 'error'
  lessonId: ObjectId,
  createdAt: Date
}
```

### PageViewLog
```
{
  _id: ObjectId,
  userId: ObjectId,
  path: String,
  method: String,
  statusCode: Number,
  ip: String,
  createdAt: Date
}
```

## 7.5 Coding Teacher Models (17 models)

| Model | Purpose |
|-------|---------|
| **Student** | Student profile and enrollment |
| **Teacher** | Teacher profile and classes |
| **School** | School/organization |
| **Subject** | Academic subjects |
| **Lesson** | Coding lesson content |
| **LessonPath** | Curated learning path |
| **Exercise** | Programming exercise |
| **ExerciseBlock** | Exercise problem definition |
| **Progress** | Student progress tracking |
| **Submission** | Student code submissions |
| **Exam** | Exam definition |
| **Achievement** | Achievement definitions |
| **Badge** | Badge definitions |
| **WeeklyChallenge** | Weekly coding challenges |
| **AIConversation** | AI avatar conversation history |
| **StudentRegistrationRequest** | Student signup requests |
| **Notification** | Notifications |
| **SchoolYear** | Academic year definition |

---

# 8. AUTHENTICATION & AUTHORIZATION

## 8.1 Authentication Flow

```
User → Login Form → POST /api/v1/auth/login
                       ↓
                 Validate credentials (bcrypt compare)
                       ↓
                 Create Session document in MongoDB
                       ↓
                 Set httpOnly cookie: wb_session=<token>
                       ↓
                 Return user data (no password)
```

## 8.2 Session Management

- **Storage**: MongoDB `Session` collection
- **Cookie**: `wb_session` — httpOnly, not accessible to JavaScript
- **TTL**: 30 days (MongoDB TTL index auto-deletes expired sessions)
- **Logout**: Deletes session from DB + clears cookie
- **Middleware**:
  - `loadUser` — non-blocking, reads cookie, attaches `req.user` if valid
  - `requireAuth` — blocks with 401 if no valid session

## 8.3 Early Access Flow

```
1. User fills form → POST /api/v1/auth/request-access
2. Admin sees request → GET /api/v1/admin/early-access
3. Admin approves → POST /api/v1/admin/early-access/:id/approve
   → System generates invite token, sends email with signup link
4. User clicks link → GET /api/v1/auth/verify-invite/:token
5. User completes signup → POST /api/v1/auth/complete-signup
   → User account created, early access request marked 'completed'
```

## 8.4 First Admin Bootstrap

On first launch with an empty database:
1. Check `GET /api/v1/auth/bootstrap-info` — returns `hasAdmin: false`
2. Create admin via `POST /api/v1/auth/bootstrap-first-admin`
3. Or automatically from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)

## 8.5 Role-Based Access

| Role | Permissions |
|------|-------------|
| **user** | Upload, view own lessons, take quizzes |
| **admin** | All user permissions + manage users, view all lessons, view logs, manage early access |
| **super-admin** | All admin permissions + elevated system access |
| **teacher** | Manage classes, create exercises, view student submissions |
| **student** | Take lessons, complete exercises, participate in gamification |
| **parent** | View child's progress |

## 8.6 Data Isolation

- Lessons are filtered by `ownerId` for regular users
- Admins can view all lessons across all users
- Admin routes use `adminAuth` middleware for protection

## 8.7 AI Quota

Each user has:
- `maxAiRequests`: Configurable limit (default: 3)
- `aiRequestsUsed`: Atomic MongoDB increment on each AI call
- Returns HTTP 429 when quota is exhausted
- Admins can reset/increase quota per user

---

# 9. WHITEBOARD SYSTEM

## 9.1 Architecture Overview

```
StoryboardScene (from DB)
       ↓
Scene Parser
       ↓
Template Selector (matches actionType + intent)
       ↓
Element Layout Engine (collision-free)
       ↓
SVG Renderer (shape library)
       ↓
Animation Engine (timeline)
       ↓
Whiteboard (on screen)
```

## 9.2 Canvas

- **Dimensions**: 800 × 500 logical units
- **Camera**: Supports zoom and pan animations
  - `enter`: Zoom to 1.0 (fit board)
  - `focus`: Zoom to 1.18 (zoom in on content)
  - `reset`: Zoom back to 1.0
- **Clear Between Sections**: `clear` action wipes the board

## 9.3 SVG Action Types

| Action Type | Description |
|-------------|-------------|
| `draw_text` | Render text with optional write-on animation |
| `draw_arrow` | Draw an animated arrow (stroke-dasharray) |
| `draw_circle` | Draw a circle shape |
| `draw_rect` | Draw a rectangle |
| `draw_path` | Draw a custom SVG path |
| `draw_badge` | Draw a badge/pill shape |
| `draw_callout` | Draw a callout/speech bubble |
| `draw_line` | Draw a line |
| `show_equation` | Display mathematical equation (SVG text) |
| `draw_graph` | Render bar or line chart |
| `draw_coordinate_system` | Render coordinate axes |
| `draw_physics_shape` | Physics-specific shape |
| `draw_object` | Any of 200+ predefined educational SVG shapes |
| `draw_table` | Render a data table |
| `draw_highlight` | Draw highlight overlay |
| `draw_caption` | Draw caption text |
| `camera` | Camera zoom/pan animation |
| `clear` | Clear the board |

## 9.4 Animation Types

| Animation | Description |
|-----------|-------------|
| `write-on` | Text appears character by character |
| `draw` | Shape draws itself (stroke-dasharray) |
| `scale` | Element scales in |
| `glow-reveal` | Element glows then appears |
| `diagram-build` | Diagram parts build sequentially |
| `stagger-draw` | Multiple elements draw in sequence |

## 9.5 Template Library (60+ templates)

Templates are grouped by **semantic intent**:

| Intent | Purpose | Example Templates |
|--------|---------|-------------------|
| **define** | Introduce a concept | Definition card, term + description |
| **compare** | Compare/contrast | Venn diagram, comparison table, T-chart |
| **process** | Show a flow | Flowchart, step sequence, pipeline |
| **hierarchy** | Show structure | Tree diagram, org chart, nesting |
| **timeline** | Chronological order | Timeline, sequence, history bar |
| **cause** | Cause and effect | Fishbone, cause→effect chain |
| **data** | Present data | Bar chart, pie chart, data table |
| **cluster** | Group related items | Mind map, concept cluster |
| **cycle** | Show a cycle | Circular flow, cycle diagram |
| **example** | Show an example | Example box, code snippet, case study |
| **recap** | Summarize | Summary card, key takeaways |
| **formula** | Show equations | Formula card, equation + explanation |
| **map** | Geographic/location | Concept map, diagram |

## 9.6 SVG Shape Library (200+ shapes)

```
Biology/Medicine:
  dna_advanced, cell_animal, neuron_detailed, heart_organ, brain,
  eye_diagram, leaf_structure, skeleton, virus, bacteria

Mathematics:
  coordinate_plane, number_line, pie_chart, set_venn, bar_chart,
  histogram, graph_paper, protractor, compass, fraction_circles

Physics:
  spring, pendulum, inclined_plane, free_body_diagram, wave_pulse,
  circuit_resistor, lens_diagram, pulley_system, magnet_field

Chemistry:
  beaker, flask, molecule_water, benzene_ring, ph_scale, periodic_table,
  distillation_apparatus, titration_setup, atomic_model

Engineering:
  gear, motor, generator, transformer, arduino, sensor, robot_arm,
  bridge_truss, lever_types

Programming:
  flowchart_process, server_icon, database_icon, linked_list,
  stack_diagram, queue_diagram, binary_tree, network_topology

Business:
  funnel, org_chart, swot_matrix, kpi, growth_chart, pyramid

And many more: weather icons, nature elements, general shapes
```

## 9.7 Lesson Player Flow

```
User navigates to /lesson/[id]
       ↓
1. Fetch lesson (GET /api/v1/lessons/:id)
   Returns: lesson metadata + all parts + all scenes + quizzes
       ↓
2. Render first part
   Whiteboard renders scenes for Part[0]
   AnimationEngine starts timeline
       ↓
3. Part plays
   Scenes animate in sequence based on time_offset
   Audio narration plays if available
   User can pause/resume/skip/speed-up
       ↓
4. Part ends
   If Part has a quiz → QuizPanel appears
   If no quiz → next part starts
       ↓
5. Quiz mode
   User answers questions
   Submits → quiz evaluated → feedback shown
       ↓
6. Next part or finished
   Continue to next part → Go to step 2
   All parts done → Status = 'finished'
```

---

# 10. AI PIPELINE

## 10.1 Pipeline Overview

This is the core intelligence of the system — a sophisticated multi-stage AI pipeline implemented in `backend/src/services/aiPlanner.js` (~5295 lines).

```
                    ┌─────────────────┐
                    │  User Uploads   │
                    │  File or Text   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Document       │
                    │  Extraction     │
                    └────────┬────────┘
                             │
                             ▼
          ┌─────────────────────────────────────┐
          │         STAGE 1: COMPREHEND        │
          │  AI reads entire document and       │
          │  extracts key topics, definitions,  │
          │  relationships, and structure       │
          └────────────────┬────────────────────┘
                           │
                           ▼
          ┌─────────────────────────────────────┐
          │         STAGE 2: DECOMPOSE          │
          │  Split into pedagogically meaningful│
          │  lessons (1-10+ lessons depending   │
          │  on document size)                  │
          └────────────────┬────────────────────┘
                           │
                           ▼
          ┌─────────────────────────────────────┐
          │         STAGE 3: REFINE             │
          │  Quality check against 5 dimensions │
          │  • Teaching quality                 │
          │  • Visual meaning                   │
          │  • Cognitive clarity                │
          │  • Scene cleanliness                │
          │  • Teacher realism                  │
          └────────────────┬────────────────────┘
                           │
                           ▼
          ┌─────────────────────────────────────┐
          │         STAGE 4: TEACH              │
          │  For each lesson, generate          │
          │  board_scenes with semantic intents │
          │  + "say" narration text             │
          └────────────────┬────────────────────┘
                           │
                           ▼
          ┌─────────────────────────────────────┐
          │         STAGE 5: VISUALIZE          │
          │  Generate SVG scenes via template   │
          │  library with collision-free layout │
          └────────────────┬────────────────────┘
                           │
                           ▼
          ┌─────────────────────────────────────┐
          │         PERSIST TO MONGODB          │
          │  Lesson → Parts → Scenes → Quiz     │
          │                                     │
          │  If multi-lesson series:            │
          │  Schedule remaining lessons in      │
          │  background (3 concurrent tasks)    │
          └─────────────────────────────────────┘
```

## 10.2 Stage Details

### STAGE 1: COMPREHEND
- Input: Full extracted text from document
- Process: AI analyzes the text to identify:
  - Main topics and subtopics
  - Key definitions and concepts
  - Relationships between concepts
  - Prerequisite knowledge
  - Learning objectives
- Output: Structured comprehension data

### STAGE 2: DECOMPOSE
- Input: Comprehension data
- Process: AI divides content into lessons:
  - Each lesson covers 1-3 related concepts
  - Lessons are ordered pedagogically
  - 1-10+ lessons depending on document size
  - Each lesson gets a title, introduction, and summary
- Output: Lesson plan with titles and scope

### STAGE 3: REFINE
- Input: Lesson plan
- Process: AI evaluates against 5 quality dimensions:
  1. **Teaching quality**: Is the explanation effective?
  2. **Visual meaning**: Can concepts be visualized?
  3. **Cognitive clarity**: Is the progression logical?
  4. **Scene cleanliness**: Are scenes focused?
  5. **Teacher realism**: Does it feel like a real lesson?
- Output: Refined lesson plan (or retry with feedback)

### STAGE 4: TEACH
- Input: Refined lesson plan for one lesson
- Process: For each lesson, AI generates:
  - Multiple parts (introduction, content sections, summary)
  - Each part has `board_scenes` (what to draw)
  - Each part has `say` text (narration for voiceover)
  - Each scene has a semantic intent (define, compare, etc.)
  - Quiz questions at designated points
- Output: Complete lesson specification with scenes

### STAGE 5: VISUALIZE
- Input: Lesson specification
- Process: Template library maps scenes to actual SVG rendering:
  - Selects best template matching scene intent
  - Generates collision-free element layout
  - Assigns animations (write-on, draw, scale, etc.)
  - Calculates scene timing/duration
- Output: Renderable storyboard scenes

## 10.3 AI Providers

The system supports multiple AI providers with runtime switching:

| Provider | Config Key | Models Available |
|----------|-----------|------------------|
| **BlazeAI** (primary) | `ACTIVE_LLM=blaze` | deepseek-v4-flash, deepseek-v4-pro, qwen3.6-plus, grok-4.20-fast |
| **BlazeAPI** | `BLAZE_API_KEY` + `BLAZE_BASE_URL` | Alternative gateway to same models |
| **OpenAI** (legacy) | `OPENAI_API_KEY` | GPT-4, GPT-3.5-turbo |
| **Gemini** (legacy) | `GEMINI_API_KEY` | Gemini Pro |

Configuration per model tier:
- `BLAZE_MODEL` — primary model (default: qwen3.6-plus)
- `BLAZE_FAST_MODEL` — for simple tasks (default: z-ai/glm-5.1)
- `BLAZE_DEEP_MODEL` — for complex reasoning (default: qwen3.6-plus-thinking)

## 10.4 Quiz Generation

Quizzes are generated as part of the TEACH stage:
- **MCQ**: Multiple choice with 4 options, one correct
- **Fill-in-blank**: Missing word/phrase in a sentence
- **Short answer**: Open-ended question, AI-evaluated
- **Graph interpretation**: Questions about visual data

Each question is stored with its correct answer for automatic MCQ/fill-blank grading. Short answer and graph interpretation use the AI for semantic evaluation.

---

# 11. CODING TEACHER PLATFORM

A full sub-platform for programming education, running alongside the whiteboard system.

## 11.1 Components

### Student Features
- **Learning Dashboard**: Overview of progress, current courses, achievements
- **Learning Path**: Structured curriculum through coding topics
- **Interactive Whiteboard**: Coding concept visualization
- **AI Avatar Teacher**: An AI instructor that can explain concepts interactively
- **Code Exercises**: Programming challenges with auto-grading
- **Exams**: Timed coding assessments
- **Progress Tracking**: Visual progress charts and statistics
- **Leaderboard**: Gamified competition among students
- **Weekly Challenges**: Time-limited coding challenges
- **Achievements & Badges**: Gamification rewards system

### Teacher Features
- **Class Management**: Create and manage classes, add/remove students
- **Exercise Management**: Create, edit, organize coding exercises
- **Exam Management**: Create and schedule exams
- **Submission Review**: View and grade student submissions
- **Analytics Dashboard**: Class performance metrics, student progress
- **Lesson Paths**: Design curriculum learning paths
- **Challenges**: Create weekly challenges
- **Registration Requests**: Approve student signups

### Parent Features
- **Child Progress**: View individual child's progress
- **Search**: Link to multiple children's accounts

## 11.2 Gamification System

- **XP Points**: Earned through exercises, quizzes, challenges
- **Badges**: Awarded for achievements (e.g., "First Exercise", "Perfect Score", "Streak Master")
- **Leaderboards**: Weekly, monthly, all-time rankings
- **Weekly Challenges**: Special time-limited challenges with bonus XP
- **Levels**: Based on cumulative XP

## 11.3 API Routes (Coding Teacher)

| Prefix | Purpose |
|--------|---------|
| `/api/v1/student/*` | Student CRUD and progress |
| `/api/v1/teacher/*` | Teacher CRUD and class management |
| `/api/v1/parent/*` | Parent portal |
| `/api/v1/ai/*` | AI avatar teacher interactions |
| `/api/v1/gamification/*` | XP, badges, leaderboards, challenges |
| `/api/v1/registration/*` | Student registration |

---

# 12. API REFERENCE

## 12.1 Upload & Explain

### `POST /api/v1/upload/`
Upload a file to generate a lesson.

- **Content-Type**: `multipart/form-data`
- **Body**: `file` (PDF/DOCX/TXT/MD/Image, max 50MB)
- **Response**: `{ lessonId, status: "processing" }`
- **Notes**: Returns immediately. Processing happens in background. Poll `GET /api/v1/upload/status/:lessonId` for completion.

### `GET /api/v1/upload/providers`
List available AI providers.

- **Response**: `{ providers: [{ name, model, active }] }`

### `GET /api/v1/upload/test-ai`
Test AI connectivity (health check).

- **Response**: `{ success: true, provider, model }`

### `GET /api/v1/upload/status/:lessonId`
Poll the processing status of an uploaded lesson.

- **Response**: `{ status, processingStep, progress: 0-100 }`

### `POST /api/v1/explain/`
Direct text input (no file upload).

- **Body**: `{ text: string }`
- **Response**: `{ lessonId, status: "processing" }`

## 12.2 Lessons

### `GET /api/v1/lessons/`
List all lessons for the current user.

- **Query**: `page`, `limit`, `search`, `sort`
- **Response**: `{ lessons: [...], total, page, limit }`

### `GET /api/v1/lessons/series/:seriesId`
List all lessons in a series.

- **Response**: `{ series, lessons: [...] }`

### `GET /api/v1/lessons/:id`
Get full lesson detail including all parts, scenes, and quizzes.

- **Response**: `{ lesson, parts: [{ ...part, scenes: [...], quiz: {...questions: [...]} }] }`

### `DELETE /api/v1/lessons/:id`
Delete a lesson and all related data (parts, scenes, quizzes, attempts).

- **Response**: `{ success: true }`

### `GET /api/v1/dashboard/`
Get paginated lesson dashboard with stats.

- **Response**: `{ lessons: [...], stats: { total, bySubject, recent } }`

## 12.3 Storyboard & Quiz

### `GET /api/v1/storyboard/part/:partId`
Get storyboard scenes for a specific part.

- **Response**: `{ part, scenes: [...] }`

### `GET /api/v1/quiz/part/:partId`
Get quiz for a specific part.

- **Response**: `{ quiz, questions: [...] }` (questions include options but NOT correct answer)

### `POST /api/v1/quiz/:quizId/attempt`
Submit a quiz attempt.

- **Body**: `{ answers: [{ questionId, answer }] }`
- **Response**: `{ score, passed, feedback, answers: [{ correct, feedback }] }`

## 12.4 Authentication

### `POST /api/v1/auth/request-access`
Request early access (public, no auth required).

- **Body**: `{ email, username }`
- **Response**: `{ success: true, message }`

### `GET /api/v1/auth/verify-invite/:token`
Check if an invite token is valid.

- **Response**: `{ valid, email, username }`

### `POST /api/v1/auth/complete-signup`
Complete registration with invite token.

- **Body**: `{ token, password }`
- **Response**: `{ user, session }`

### `POST /api/v1/auth/login`
Login with email or username.

- **Body**: `{ login: string (email or username), password: string }`
- **Response**: `{ user }` (sets httpOnly cookie)

### `POST /api/v1/auth/logout`
Logout (destroys session).

- **Response**: `{ success: true }`

### `GET /api/v1/auth/me`
Get current authenticated user.

- **Response**: `{ user }` (or 401 if not authenticated)

### `GET /api/v1/auth/bootstrap-info`
Check if system has any admin account.

- **Response**: `{ hasAdmin: boolean }`

### `POST /api/v1/auth/bootstrap-first-admin`
Create the first admin account (only works when DB has no admins).

- **Body**: `{ email, username, password }`
- **Response**: `{ user, session }`

## 12.5 Admin

### `GET /api/v1/admin/stats`
Platform-wide statistics.

- **Response**: `{ users, lessons, quizzes, aiRequests, ... }`

### `GET /api/v1/admin/email-mode`
Check email provider configuration.

- **Response**: `{ configured, provider }`

### `POST /api/v1/admin/test-email`
Send a test email.

- **Body**: `{ email }`
- **Response**: `{ success, message }`

### `GET /api/v1/admin/early-access`
List all early access requests.

- **Query**: `status` (pending/approved/rejected/completed)
- **Response**: `{ requests: [...] }`

### `POST /api/v1/admin/early-access`
Create a manual early access request.

- **Body**: `{ email, username }`

### `POST /api/v1/admin/early-access/:id/approve`
Approve an early access request (sends invite email).

- **Response**: `{ success, inviteLink }`

### `POST /api/v1/admin/early-access/:id/reject`
Reject an early access request.

- **Response**: `{ success }`

### `GET /api/v1/admin/users`
List all users.

- **Query**: `page`, `limit`, `search`, `role`
- **Response**: `{ users: [...], total }`

### `POST /api/v1/admin/users`
Create a user manually.

- **Body**: `{ email, username, password, role }`

### `PATCH /api/v1/admin/users/:id`
Update a user (role, status, quota, etc.).

### `DELETE /api/v1/admin/users/:id`
Delete a user.

### `GET /api/v1/admin/users/:id/lessons`
Get all lessons for a specific user.

### `GET /api/v1/admin/lessons`
List all lessons across all users.

### `GET /api/v1/admin/logs/login`
Get login attempt logs.

### `GET /api/v1/admin/logs/ai-requests`
Get AI request logs.

### `GET /api/v1/admin/logs/pages`
Get page view logs.

## 12.6 Coding Teacher API

All under `/api/v1/`:

| Route Prefix | Methods | Purpose |
|------------|---------|---------|
| `student/*` | GET, POST, PATCH | Student profile, progress, exercises |
| `teacher/*` | GET, POST, PATCH, DELETE | Teacher profile, classes |
| `parent/*` | GET | Parent views |
| `ai/*` | POST | AI avatar teacher conversations |
| `gamification/*` | GET, POST | XP, badges, leaderboard, challenges |
| `registration/*` | POST | Student registration requests |

---

# 13. ENVIRONMENT VARIABLES

## 13.1 Backend (`backend/.env`)

```bash
# ─── Server ───────────────────────────────────────
PORT=8000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# ─── Database ─────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/ai_teacher

# ─── AI Provider ──────────────────────────────────
ACTIVE_LLM=blaze                 # Options: blaze, blazeapi, openai, gemini

# BlazeAI (primary, OpenAI-compatible)
BLAZE_API_KEY=<key>
BLAZE_BASE_URL=https://blazeai.boxu.dev/api
BLAZE_MODEL=qwen3.6-plus        # Primary model
BLAZE_FAST_MODEL=z-ai/glm-5.1  # Fast/cheap model
BLAZE_DEEP_MODEL=qwen3.6-plus-thinking  # Deep reasoning model

# BlazeAPI (alternative gateway)
BLAZEAPI_API_KEY=<key>
BLAZEAPI_BASE_URL=https://gateway.blazeapi.boxu.dev/v1

# OpenAI (legacy)
OPENAI_API_KEY=<key>

# Gemini (legacy)
GEMINI_API_KEY=<key>

# ─── Text-to-Speech ───────────────────────────────
# ElevenLabs (primary)
ELEVENLABS_API_KEY=<key>
ELEVENLABS_VOICE_ID=<voice_id>

# Azure Speech (alternative)
AZURE_SPEECH_KEY=<key>
AZURE_SPEECH_REGION=<region>

# ─── Storage (S3 / Cloudflare R2) ────────────────
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=us-east-1
S3_BUCKET=<bucket-name>

# ─── Admin Bootstrap ──────────────────────────────
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<password>
ADMIN_PASSWORD_FORCE=true        # Force reset on startup

# ─── Email (SMTP) ────────────────────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=<user>
SMTP_PASS=<pass>
SMTP_FROM=noreply@example.com
```

## 13.2 Frontend

Each frontend app uses:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

# 14. DEPLOYMENT

## 14.1 Docker Compose (`docker-compose.yml`)

The entire system runs as 5 services:

```yaml
services:
  mongo:          # MongoDB 7 database
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongo-data:/data/db]

  backend:        # Node.js API server
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
    depends_on: [mongo]

  frontend-student:   # Next.js app (port 3000)
    build: ./Student-Main
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000/api/v1
    depends_on: [backend]

  frontend-admin:     # Next.js app (port 3001)
    build: ./Admin
    ports: ["3001:3001"]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000/api/v1
    depends_on: [backend]

  frontend-teacher:   # Next.js app (port 3002)
    build: ./Teachers-dashboard
    ports: ["3002:3002"]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000/api/v1
    depends_on: [backend]
```

## 14.2 Quick Start

```bash
# Development
cd backend && npm install && npm start    # Starts on port 8000
cd Student-Main && npm install && npm run dev  # Starts on port 3000

# Production (Docker)
docker compose up --build
```

---

# 15. DATA FLOWS

## 15.1 File Upload → Lesson Generation Flow

```
User drags file onto UploadZone
       ↓
Frontend sends multipart POST /api/v1/upload/
       ↓
Backend saves file to temp directory via multer
       ↓
Backend extracts text from file:
  PDF → pdf-parse
  DOCX → mammoth
  Image → AI vision API
       ↓
Backend creates Lesson document (status: "processing")
       ↓
Backend returns { lessonId } immediately
       ↓
─── Background Processing (fire-and-forget with setImmediate) ───
       ↓
AI Pipeline Stage 1: COMPREHEND
       ↓
AI Pipeline Stage 2: DECOMPOSE
       ↓
AI Pipeline Stage 3: REFINE
       ↓
If single lesson:
  → Stage 4: TEACH
  → Stage 5: VISUALIZE
  → storyboardGenerator creates Lesson + Parts + Scenes + Quiz
  → ttsService generates audio for each scene
  → Lesson status = "ready"

If multi-lesson series:
  → First lesson: Same as above
  → Remaining lessons: Queued in LessonSeries.remainingSpecs
  → Background processor handles 3 at a time
       ↓
Frontend polls GET /api/v1/upload/status/:lessonId every 2 seconds
       ↓
When status = "ready", frontend navigates to /lesson/[id]
```

## 15.2 Lesson Viewing Flow

```
User navigates to /lesson/[id]
       ↓
Server component fetches lesson data (SSR)
       ↓
LessonPageClient mounts with data
       ↓
Part[0] loads:
  → Scenes passed to Whiteboard component
  → AnimationEngine starts timeline
  → Playback begins
       ↓
Whiteboard renders scenes in order by timeOffset:
  Scene 0: clear → camera animation → draw elements...
  Scene 1: camera focus → more elements...
  Scene 2: camera reset → new section...
  ...
       ↓
Each scene has:
  • actionType → which SVG operation to perform
  • payload → data for that operation (position, content, style)
  • animation → entrance effect (write-on, draw, scale, etc.)
  • duration → how long scene lasts
       ↓
Part ends → Check for quiz:
  If quiz exists → Show QuizPanel
  If no quiz → Auto-advance to next part
       ↓
Quiz: User answers → Submit → Backend evaluates → Show results
       ↓
Next part → Repeat
After all parts → status = "finished" → Summary screen
```

## 15.3 Authentication Flow

```
User visits protected page
       ↓
Next.js middleware.ts checks for session cookie
       ↓
If no cookie → Redirect to /login
If cookie exists → Forward to page (cookie validated server-side)
       ↓
Login page: User submits email + password
       ↓
POST /api/v1/auth/login:
  → Find user by email or username
  → bcrypt.compare(password, user.passwordHash)
  → If match: Create Session, set httpOnly cookie
  → If no match: Return 401, log attempt
       ↓
Browser stores cookie automatically
All subsequent API calls include credentials: "include"
```

## 15.4 Quiz Flow

```
During lesson: Part ends
       ↓
If Part has quiz_id → Frontend fetches quiz data
  (questions WITHOUT correct answers)
       ↓
QuizPanel renders questions:
  MCQ → Radio buttons
  Fill-blank → Text input
  Short answer → Textarea
  Graph interpretation → Image + text input
       ↓
User submits answers
       ↓
POST /api/v1/quiz/:quizId/attempt
       ↓
Backend quizEvaluator:
  MCQ: exact match
  Fill-blank: case-insensitive match
  Short answer: AI semantic evaluation
  Graph interpretation: AI evaluation
       ↓
Returns { score, passed, feedback, per-question results }
       ↓
QuizPanel shows results with correct answers
User can proceed to next part
```

---

# DIAGRAMS (Text-Based)

## System Interaction Diagram

```
┌─────────┐    HTTP/JSON     ┌──────────┐    Mongoose     ┌────────────┐
│  Next.js ├────────────────▶│ Express  ├────────────────▶│  MongoDB   │
│  Apps    │◀────────────────│  API     │◀────────────────│            │
│          │    Cookies +    │  Server  │     Queries     │  Lessons   │
│  3000    │    JSON Resp    │  :8000   │                 │  Users     │
│  3001    │                 │          │                 │  Sessions  │
│  3002    │                 │          │                 │  Logs      │
└─────────┘                 └────┬─────┘                 └────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
           ┌─────────────┐          ┌──────────────┐
           │   BlazeAI   │          │  ElevenLabs  │
           │   (LLM)     │          │  (TTS)       │
           └─────────────┘          └──────────────┘
```

## Page Load Data Flow (SSR)

```
Browser Request
       │
       ▼
Next.js Server
       │
       ├── Reads "wb_session" cookie from request headers
       │
       ├── Fetches lesson data from backend (forwards cookie)
       │   GET /api/v1/lessons/:id
       │       │
       │       ▼
       │   Express: loadUser middleware validates cookie
       │   → Looks up Session in MongoDB
       │   → Attaches user to req
       │   → Route handler queries Lesson, Parts, Scenes, Quiz
       │   → Returns complete lesson data
       │
       ├── Renders page HTML with data
       │
       └── Sends HTML to browser
               │
               ▼
          Browser hydrates React components
          → LessonPageClient, Whiteboard, AnimationEngine
          → Playback begins
```

---

# KNOWN LIMITATIONS

1. **No persistent task queue**: Background processing uses `setImmediate()`. If the server restarts while processing, lessons are stuck at "processing" status.

2. **No database migrations**: Schema changes require manual updates.

3. **Highlight/underline actions**: These action types are defined but not rendered by the whiteboard.

4. **Equations**: Rendered as styled SVG text only (no KaTeX or MathJax integration).

5. **No seek/scrub**: Users can't seek to a specific point within a part — only skip entire scenes.

6. **Not mobile-responsive**: The whiteboard is designed for desktop screens.

7. **12,000 character limit**: The original input cap is removed in code but documented in some places.

8. **No WebSocket**: Uses polling for status updates instead of real-time connections.

---

*Document generated on 2026-07-22. For questions, report issues at the project repository.*

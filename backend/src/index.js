import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './db.js';

// ── Existing Whiteboard Routes ────────────────────────────────────────────────
import uploadRouter from './routes/upload.js';
import explainRouter from './routes/explain.js';
import lessonsRouter from './routes/lessons.js';
import storyboardRouter from './routes/storyboard.js';
import quizRouter from './routes/quiz.js';
import dashboardRouter from './routes/dashboard.js';

// ── Auth & Admin (existing, enhanced) ─────────────────────────────────────────
import authRouter from './auth/routes/auth.js';
import adminRouter from './admin/routes/admin.js';

// ── New: Coding Teacher Routes ────────────────────────────────────────────────
import {
  studentRoutes,
  teacherRoutes,
  parentRoutes,
  aiRoutes,
  gamificationRoutes,
  registrationRoutes,
} from './coding-teacher/routes/index.js';

import { loadUser } from './auth/middleware/auth.js';
import { bootstrapAdmin } from './auth/services/bootstrap.js';
import { toErrorResponse } from './utils/errors.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Only trust the reverse proxy's X-Forwarded-For when explicitly configured —
// otherwise clients could spoof their IP and bypass rate limiting.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((o) => o.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// General API rate limit — auth routes additionally enforce their own
// tighter, action-specific limits.
app.use(
  '/api/',
  rateLimit({
    windowMs: 60_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Resolve the current user (if any) on every request — non-blocking
app.use(loadUser);

// ── Routes ────────────────────────────────────────────────────────────────────
// Auth & Admin
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);

// Existing Whiteboard Feature (accessible to all authenticated users)
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/explain', explainRouter);
app.use('/api/v1/lessons', lessonsRouter);
app.use('/api/v1/storyboard', storyboardRouter);
app.use('/api/v1/quiz', quizRouter);
app.use('/api/v1/dashboard', dashboardRouter);

// New: Coding Teacher Platform
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/teacher', teacherRoutes);
app.use('/api/v1/parent', parentRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/gamification', gamificationRoutes);
app.use('/api/v1/registration', registrationRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0', features: ['whiteboard', 'coding-teacher'] }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  const { status, message } = toErrorResponse(err);
  res.status(status).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB()
  .then(async () => {
    await bootstrapAdmin();
    app.listen(PORT, () => {
      console.log(`\n Server running on port ${PORT}`);
      console.log(` Whiteboard features: /api/v1/upload, /api/v1/explain, /api/v1/lessons`);
      console.log(`Coding teacher:     /api/v1/student, /api/v1/teacher, /api/v1/ai`);
      console.log(` Parent portal:       /api/v1/parent`);
      console.log(` Gamification:       /api/v1/gamification`);
      console.log(` Admin enhanced:     /api/v1/admin\n`);
    });
  })
  .catch((err) => {
    console.error('[FATAL] MongoDB connection failed:', err.message);
    process.exit(1);
  });

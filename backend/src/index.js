import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from './db.js';
import uploadRouter from './routes/upload.js';
import explainRouter from './routes/explain.js';
import lessonsRouter from './routes/lessons.js';
import storyboardRouter from './routes/storyboard.js';
import quizRouter from './routes/quiz.js';
import dashboardRouter from './routes/dashboard.js';
import authRouter from './auth/routes/auth.js';
import adminRouter from './admin/routes/admin.js';
import { loadUser } from './auth/middleware/auth.js';
import { bootstrapAdmin } from './auth/services/bootstrap.js';
import { toErrorResponse } from './utils/errors.js';

const app = express();
const PORT = process.env.PORT || 8000;

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
// Resolve the current user (if any) on every request — non-blocking
app.use(loadUser);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/explain', explainRouter);
app.use('/api/v1/lessons', lessonsRouter);
app.use('/api/v1/storyboard', storyboardRouter);
app.use('/api/v1/quiz', quizRouter);
app.use('/api/v1/dashboard', dashboardRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

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
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('[FATAL] MongoDB connection failed:', err.message);
    process.exit(1);
  });

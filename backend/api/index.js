// Vercel serverless entry point
import app from '../src/index.js';

export default function handler(req, res) {
  // Catch any synchronous throw during request handling
  try {
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Handler] Uncaught error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

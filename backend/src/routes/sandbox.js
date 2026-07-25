import { Router } from 'express';
import { StoryboardScene } from '../models/Lesson.js';
import { executeCode, calculateScore, determineStatus } from '../coding-teacher/services/code-execution/sandbox.service.js';
import { requireAuth } from '../auth/middleware/auth.js';

const router = Router();
router.use(requireAuth);

// POST /api/v1/sandbox/submit — run student code against a sandbox question
router.post('/submit', async (req, res, next) => {
  try {
    const { sceneId, code, language } = req.body;
    if (!sceneId || !code) {
      return res.status(400).json({ error: 'sceneId and code are required' });
    }

    const scene = await StoryboardScene.findById(sceneId).lean();
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    if (scene.actionType !== 'sandbox_question') {
      return res.status(400).json({ error: 'Scene is not a sandbox question' });
    }

    const payload = scene.payload || {};
    const testCases = payload.testCases || [];
    const lang = language || payload.language || 'javascript';

    if (!testCases.length) {
      return res.status(400).json({ error: 'No test cases defined for this question' });
    }

    const results = await executeCode(code, lang, testCases);
    const score = calculateScore(results);
    const status = determineStatus(results);

    res.json({
      passed: status === 'passed',
      score,
      status,
      results: results.map(r => ({
        passed: r.passed,
        output: r.output,
        expectedOutput: r.expectedOutput,
        executionTime: r.executionTime,
        error: r.error,
        description: r.testCaseId,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;

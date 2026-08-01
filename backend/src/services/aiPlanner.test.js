import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldUseLocalPlanning } from './aiPlanner.js';

test('uses local planning when OpenRouter credentials are missing', () => {
  delete process.env.OPENROUTER_API_KEY;
  process.env.ACTIVE_LLM = 'openrouter';

  assert.equal(shouldUseLocalPlanning('openrouter'), true);
});

test('does not force local planning when OpenRouter credentials are configured', () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.ACTIVE_LLM = 'openrouter';

  assert.equal(shouldUseLocalPlanning('openrouter'), false);
});
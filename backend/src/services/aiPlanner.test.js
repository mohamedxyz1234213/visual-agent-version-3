import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldUseLocalPlanning, shouldUseTopicLocalOnlyFallback } from './aiPlanner.js';

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

test('does not use the topic local-only fallback when the lesson can use the live AI path', () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.ACTIVE_LLM = 'openrouter';
  delete process.env.TOPIC_LOCAL_ONLY;
  delete process.env.TOPIC_LOCAL_ONLY_MAX_CHARS;

  assert.equal(shouldUseTopicLocalOnlyFallback({
    source_mode: 'topic',
    topic_request: 'BFS vs DFS traversal on a graph and when each is preferred.',
  }, 'openrouter'), false);
});
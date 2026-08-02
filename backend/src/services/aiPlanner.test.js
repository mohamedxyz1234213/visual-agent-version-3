import test from 'node:test';
import assert from 'node:assert/strict';

import { callAIRace, shouldUseLocalPlanning, shouldUseTopicLocalOnlyFallback } from './aiPlanner.js';

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

test('retries when the provider returns an empty payload', async () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.ACTIVE_LLM = 'openrouter';
  delete process.env.FASTAPI_BASE_URL;
  delete process.env.FASTAPI_API_KEY;

  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return {
        ok: true,
        text: async () => JSON.stringify({ choices: [{ message: { content: '' } }] }),
        headers: { get: () => 'application/json' },
      };
    }

    return {
      ok: true,
      text: async () => JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }),
      headers: { get: () => 'application/json' },
    };
  };

  try {
    const result = await callAIRace('test prompt', 128, 90_000, 'openrouter', 'nvidia/nemotron-3-ultra-550b-a55b:free');
    assert.deepEqual(result, { ok: true });
    assert.equal(calls, 2);
  } finally {
    global.fetch = originalFetch;
  }
});
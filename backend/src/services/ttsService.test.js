import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLessonAudioArtifacts } from './ttsService.js';

test('generateLessonAudioArtifacts resolves for an empty part list', async () => {
  const result = await generateLessonAudioArtifacts([]);
  assert.deepEqual(result, []);
});

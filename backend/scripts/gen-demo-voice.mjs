// Generate the real teacher voice for the homepage whiteboard demo using
// the exact same pipeline as real lessons: enhanceNarrationForSpeech + Speechify.
// https://nodejs.org/api/cli.html --env-file
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { config } from 'dotenv';

if (existsSync('.env')) config({ path: '.env' });
if (existsSync('.env.local')) config({ path: '.env.local' });

const { synthesize } = await import('../src/services/ttsService.js');

const narration = [
  'A loop lets us repeat a block of code without writing it twice. Here, a for loop runs the same body many times.',
  'range five gives us zero, one, two, three, and four.',
  'Each pass, the body runs and i moves to the next number.',
].join(' ');

const audio = await synthesize(narration, 'home-demo');
if (!audio) {
  console.error('No audio returned — check TTS_PROVIDER + SPEECHIFY_API_KEY');
  process.exit(1);
}
await writeFile(new URL('../../Student-Main/public/intro-loops-demo.mp3', import.meta.url), audio);
console.log('Wrote intro-loops-demo.mp3 bytes:', audio.length);
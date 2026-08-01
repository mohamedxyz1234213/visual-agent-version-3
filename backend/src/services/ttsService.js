import axios from 'axios';
import { SpeechifyClient } from '@speechify/api';
import { uploadAudio } from './storageService.js';

let speechifyQueue = Promise.resolve();
let speechifyLastCallAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runSpeechifySerialized(task) {
  const minIntervalMs = Math.max(1000, Number(process.env.SPEECHIFY_MIN_INTERVAL_MS ?? 1300));
  speechifyQueue = speechifyQueue
    .catch(() => undefined)
    .then(async () => {
      const elapsed = Date.now() - speechifyLastCallAt;
      if (elapsed < minIntervalMs) {
        await sleep(minIntervalMs - elapsed);
      }
      speechifyLastCallAt = Date.now();
      return task();
    });
  return speechifyQueue;
}

function isRetryableSpeechifyError(error) {
  const msg = String(error?.message || '').toLowerCase();
  return /429|rate_limited|concurrency_limit_reached|too many requests/.test(msg);
}

async function withSpeechifyRetry(task) {
  const maxAttempts = Math.max(1, Number(process.env.SPEECHIFY_MAX_RETRIES ?? 3));
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await runSpeechifySerialized(task);
    } catch (error) {
      lastError = error;
      if (!isRetryableSpeechifyError(error) || attempt === maxAttempts) {
        throw error;
      }
      const backoffMs = Math.min(8000, 1200 * attempt);
      await sleep(backoffMs);
    }
  }
  throw lastError;
}

function captionTtsEnabled() {
  // Captions are visual timing cues, not separate pieces of narration. A
  // clip per caption makes the voice restart between every board action.
  // Keep exactly one complete audio track for each lesson part.
  return false;
}

/**
 * Synthesize narration text to audio bytes.
 * Returns null when TTS is not configured.
 * @param {string} text
 * @param {string} partId
 * @returns {Promise<Buffer|null>}
 */
/**
 * Generate per-caption TTS audio for all draw_caption scenes in a part.
 * Each caption gets its own short MP3 clip so the voice reads exactly
 * what appears under the whiteboard.
 */
export async function generateCaptionAudio(partId) {
  if (!captionTtsEnabled()) return;

  const { StoryboardScene } = await import('../models/Lesson.js');
  const captionScenes = await StoryboardScene.find({
    partId,
    actionType: 'draw_caption',
  }).sort({ timeOffset: 1, _id: 1 });
  for (let index = 0; index < captionScenes.length; index += 1) {
    const scene = captionScenes[index];
    const text = String(scene.payload?.narrationText || scene.payload?.content || '').trim();
    if (!text || scene.payload?.audioUrl) continue;
    try {
      const audio = await synthesizeCaptionText(text);
      if (audio) {
        const url = await uploadAudio(audio, `cap-${scene._id}`);
        if (url) {
          scene.payload.content = text;
          scene.payload.narrationText = text;
          scene.payload.sequenceIndex = index;
          scene.payload.total = captionScenes.length;
          scene.payload.estimatedDurationSeconds = estimateSpeechDurationSeconds(text);
          scene.payload.audioUrl = url;
          scene.markModified('payload');
          await scene.save();
        }
      }
    } catch (err) {
      console.warn(`[tts] Caption TTS failed scene ${scene._id}: ${err.message}`);
    }
  }
}

export async function generateLessonAudioArtifacts(parts = []) {
  const results = [];
  for (const part of parts) {
    if (part?.narration && part?.partType === 'content') {
      try {
        const audio = await Promise.race([
          synthesize(part.narration, part._id.toString()),
          new Promise((_, reject) => setTimeout(() => reject(new Error('TTS timeout')), 15000)),
        ]);
        if (audio) {
          const url = await uploadAudio(audio, part._id.toString());
          if (url) {
            part.audioUrl = url;
            await part.save();
          }
        }
        results.push({ partId: part._id.toString(), status: 'ok' });
      } catch (ttsErr) {
        console.warn(`[tts] Part narration failed for ${part._id}:`, ttsErr.message);
        results.push({ partId: part._id.toString(), status: 'skipped', error: ttsErr.message });
      }
    }
  }

  for (const part of parts) {
    if (part?.partType === 'content') {
      try {
        await generateCaptionAudio(part._id.toString());
        results.push({ partId: part._id.toString(), captionStatus: 'ok' });
      } catch (capErr) {
        console.warn(`[tts] Caption audio failed for ${part._id}:`, capErr.message);
        results.push({ partId: part._id.toString(), captionStatus: 'skipped', error: capErr.message });
      }
    }
  }

  return results;
}

function estimateSpeechDurationSeconds(text) {
  const words = String(text || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1.2, Math.round(((words / 145) * 60) * 10) / 10);
}

/** Synthesize a single short caption text (no speech enhancement — already conversational). */
async function synthesizeCaptionText(text) {
  const provider = process.env.TTS_PROVIDER || 'none';
  const tts = String(text || '').trim().slice(0, 500);
  if (!tts) return null;
  if (provider === 'speechify' && process.env.SPEECHIFY_API_KEY) {
    return synthesizeSpeechify(tts);
  }
  if (provider === 'elevenlabs' && process.env.ELEVENLABS_API_KEY) {
    return synthesizeElevenLabs(tts);
  }
  if (provider === 'azure' && process.env.AZURE_SPEECH_KEY) {
    return synthesizeAzure(tts);
  }
  return null;
}

export async function synthesize(text, partId) {
  const provider = process.env.TTS_PROVIDER || 'none';

  // Enhance the narration for speech before passing to any TTS provider
  const enhanced = enhanceNarrationForSpeech(text);

  // A content part is authored as one continuous teacher explanation. Keep it
  // as one Speechify request/audio file rather than cutting it at 2,000
  // characters, which was the source of narration ending mid-explanation.
  const maxCharacters = Math.max(500, Number(process.env.TTS_MAX_CHARACTERS ?? 5000));
  const tts = truncateToLimit(enhanced, maxCharacters);
  if (tts.length < enhanced.length) {
    console.warn(`[tts] Narration truncated from ${enhanced.length} to ${tts.length} chars for TTS`);
  }

  if (provider === 'speechify' && process.env.SPEECHIFY_API_KEY) {
    return synthesizeSpeechify(tts);
  }
  if (provider === 'elevenlabs' && process.env.ELEVENLABS_API_KEY) {
    return synthesizeElevenLabs(tts);
  }
  if (provider === 'azure' && process.env.AZURE_SPEECH_KEY) {
    return synthesizeAzure(tts);
  }
  return null;
}

/**
 * Truncate text to fit within a character limit, breaking at the last
 * sentence boundary ( . ! ? ) within the limit so speech doesn't cut off
 * mid-sentence. If no sentence boundary is found, breaks at last space.
 */
function truncateToLimit(text, limit) {
  if (!text || text.length <= limit) return text || '';
  const sliced = text.slice(0, limit);
  // Try to find the last sentence-ending punctuation within the slice
  const lastSentenceEnd = Math.max(
    sliced.lastIndexOf('. '),
    sliced.lastIndexOf('! '),
    sliced.lastIndexOf('? '),
    sliced.lastIndexOf('.\n'),
    sliced.lastIndexOf('!\n'),
    sliced.lastIndexOf('?\n'),
    // Also catch punctuation at the very end of the slice boundary
    sliced.endsWith('.') ? limit - 1 : -1,
    sliced.endsWith('!') ? limit - 1 : -1,
    sliced.endsWith('?') ? limit - 1 : -1,
  );
  if (lastSentenceEnd > limit * 0.5) {
    return sliced.slice(0, lastSentenceEnd + 1);
  }
  // Fallback: break at the last space
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > limit * 0.5) {
    return sliced.slice(0, lastSpace) + '...';
  }
  // Last resort: hard break
  return sliced + '...';
}

/**
 * Enhance narration text for spoken delivery — adds teacher-like conversational
 * framing so the TTS output sounds like a real teacher explaining, not a text
 * block being read verbatim.
 *
 * Transformations applied (rule-based — no extra AI call):
 *   - Conversational openers if the text starts cold
 *   - Expand bullet-list / colon-delineated patterns into flowing prose
 *   - Insert natural transition phrases between sentences
 *   - Expand common abbreviations for better speech clarity
 *
 * @param {string} text - The original narration / caption text
 * @param {object} [ctx] - Optional context { topic, segment, isFirstBoard }
 * @returns {string} Enhanced narration suitable for TTS
 */
export function enhanceNarrationForSpeech(text, ctx = {}) {
  if (!text || typeof text !== 'string') return text || '';

  let t = text.trim();
  if (!t) return t;

  const { topic } = ctx;

  // ── 1. Expand common abbreviations ───────────────────────────────────────────
  const ABBREVIATIONS = {
    'e\\.g\\.': 'for example',
    'i\\.e\\.': 'in other words',
    'etc\\.?': 'and so on',
    'vs\\.?': 'versus',
    'w\\/': 'with',
    'w\\/o': 'without',
    'aka ': 'also known as ',
    'a\\.k\\.a\\.': 'also known as',
  };
  for (const [pattern, replacement] of Object.entries(ABBREVIATIONS)) {
    t = t.replace(new RegExp(pattern, 'gi'), replacement);
  }

  // ── 2. Turn "Key: value" / "Term: definition" patterns into spoken sentences
  //     e.g. "Inheritance: a mechanism…" → "Inheritance is a mechanism…"
  t = t.replace(/^([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?):\s+/gm, '$1 is ');

  // ── 3. Convert numbered / bullet lists into flowing prose
  //     "1. First step. 2. Second step." → "First, first step. Second, second step."
  if (/^\d+\.\s/m.test(t)) {
    t = t.replace(/^(\d+)\.\s+/gm, (_m, n) => {
      const words = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
      const idx = parseInt(n, 10) - 1;
      return idx < words.length ? `${words[idx]}, ` : `Next, `;
    });
  }

  // ── 4. Convert dash/asterisk bullet lists into flowing prose
  t = t.replace(/^[-*]\s+/gm, '• ');

  // ── 5. Add conversational opener if text starts cold (no greeting/transition)
  //     Openers ending with sentence punctuation (. ! ?) keep the original
  //     capitalisation — a new sentence starts. Openers ending with a comma /
  //     colon / dash flow into the clause, so the first letter is lowercased.
  if (!startsConversationally(t)) {
    const openers = [
      topic ? `Let me explain ${topic}. ` : null,
      'Here\'s what you need to know. ',
      'Let me break this down. ',
      'So here\'s the key idea. ',
    ].filter(Boolean);
    const lead = openers[Math.abs(hashStr(t)) % openers.length];
    if (/[.!?]$/.test(lead.trim())) {
      t = lead + t.charAt(0).toUpperCase() + t.slice(1);
    } else {
      t = lead + t.charAt(0).toLowerCase() + t.slice(1);
    }
  }

  // ── 6. Ensure text ends with sentence-ending punctuation for natural pause
  if (!/[.!?]/.test(t.charAt(t.length - 1))) {
    t += '.';
  }

  return t;
}

function startsConversationally(s) {
  return /^(first|okay|ok\\b|so\\b|now\\b|let'?s|let’s|here'?s|here’s|think|imagine|notice|remember|to (recap|wrap|sum)|next\\b|finally|alright|right,|well,|picture|consider|say\\b|suppose|let me|i\'?ll|what|how|why|in this)/i.test(
    String(s || '').trim()
  );
}

function hashStr(s) {
  let h = 0;
  const str = String(s || '');
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

// ── Speechify TTS ─────────────────────────────────────────────────────────────
async function synthesizeSpeechify(text) {
  const apiKey = process.env.SPEECHIFY_API_KEY;
  // Henry is the requested teacher voice. Speechify's voice catalogue for this
  // account supports Henry through simba-3.0 (not simba-3.2), so use the newest
  // compatible model instead of sending a request that fails with HTTP 400.
  const voiceId = 'henry';
  const model = 'simba-3.0';
  const audioFormat = process.env.SPEECHIFY_AUDIO_FORMAT || 'mp3';

  // Use the Speechify SDK
  const client = new SpeechifyClient({ token: apiKey });

  const response = await withSpeechifyRetry(() =>
    client.audio.speech({
      input: text,
      voice_id: voiceId,
      model: model,
      audio_format: audioFormat,
    })
  );

  // The SDK returns base64-encoded audio_data; decode to Buffer
  return Buffer.from(response.audio_data, 'base64');
}

// ── ElevenLabs TTS (unchanged) ────────────────────────────────────────────────
async function synthesizeElevenLabs(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await axios.post(
    url,
    {
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    },
    {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeout: 60000,
    }
  );
  return Buffer.from(response.data);
}

// ── Azure TTS (unchanged) ─────────────────────────────────────────────────────
async function synthesizeAzure(text) {
  const region = process.env.AZURE_SPEECH_REGION || 'eastus';
  const tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
  const tokenResp = await axios.post(tokenUrl, null, {
    headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY },
    timeout: 30000,
  });
  const token = tokenResp.data;

  const ssml = `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='en-US-JennyNeural'>${text}</voice></speak>`;
  const ttsUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const resp = await axios.post(ttsUrl, ssml, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
    },
    responseType: 'arraybuffer',
    timeout: 60000,
  });
  return Buffer.from(resp.data);
}

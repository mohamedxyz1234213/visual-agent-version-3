export const BLAZEAPI_DEFAULT_MODEL = 'deepseek-v4-flash';
export const BLAZEAPI_DEFAULT_DEEP_MODEL = 'deepseek-v4-pro';
export const BLAZEAPI_VOICE_MODEL = 'deepseek-v4-flash';
export const BLAZEAPI_SEARCH_MODEL = 'deepseek-v4-flash';
export const BLAZEAPI_MODELS = [
  { id: BLAZEAPI_DEFAULT_MODEL, label: 'DeepSeek V4 Flash', desc: 'Fast & accurate', badge: 'Recommended' },
  { id: BLAZEAPI_DEFAULT_DEEP_MODEL, label: 'DeepSeek V4 Pro', desc: 'Deepest analysis', badge: null },
];

/**
 * Prioritised fallback chain for BlazeAPI calls.
 * Models proven to be healthy on the upstream are tried first;
 * if one returns a gateway error the next is tried automatically.
 */
export const BLAZEAPI_FALLBACK_MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'deepseek-v4-flash',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'gemma-4',
];

/**
 * Build a deduplicated chain of models to try:
 *   1. The caller's preferred model (if any)
 *   2. Any cached working model (optional, caller may pass it as preferredModel)
 *   3. The fallback priority list
 */
export function buildBlazeAPIModelChain(preferred) {
  const seen = new Set();
  const chain = [];
  const add = (m) => { const s = (m || '').trim(); if (s && !seen.has(s)) { chain.push(s); seen.add(s); } };
  add(preferred);
  BLAZEAPI_FALLBACK_MODELS.forEach(add);
  return chain;
}

export function getBlazeAPIConfig() {
  const baseURL = (process.env.BLAZEAPI_BASE_URL || process.env.BLAZE_BASE_URL || 'https://api.blazeapi.org/paid/v1').trim().replace(/\/+$/, '');
  const apiKey = (process.env.BLAZEAPI_API_KEY || process.env.BLAZE_API_KEY || '').trim();
  return {
    baseURL,
    apiKey,
    chatCompletionsUrl: `${baseURL}/chat/completions`,
    messagesUrl: `${baseURL}/messages`,
    audioSpeechUrl: `${baseURL}/audio/speech`,
    audioTranscriptionsUrl: `${baseURL}/audio/transcriptions`,
    modelsUrl: `${baseURL}/models`,
    defaultModel: BLAZEAPI_DEFAULT_MODEL,
    defaultDeepModel: BLAZEAPI_DEFAULT_DEEP_MODEL,
  };
}

export function resolveBlazeAPIModel(requested) {
  const model = String(requested || '').trim();
  if (!model) return BLAZEAPI_DEFAULT_MODEL;
  return model;
}

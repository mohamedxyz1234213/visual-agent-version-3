export const BLAZEAPI_DEFAULT_MODEL = 'deepseek-v4-flash';
export const BLAZEAPI_DEFAULT_DEEP_MODEL = 'deepseek-v4-flash';
export const BLAZEAPI_VOICE_MODEL = 'tts-1';
export const BLAZEAPI_SEARCH_MODEL = 'tavily-search';
export const BLAZEAPI_MODELS = [
  { id: BLAZEAPI_DEFAULT_MODEL, label: 'DeepSeek V4 Flash', desc: 'Fast & accurate', badge: 'Recommended' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', desc: 'Deepest analysis', badge: null },
  { id: 'tavily-search', label: 'Web Search', desc: 'Real-time web search with sources', badge: null },
  { id: 'tavily-extract', label: 'Web Extract', desc: 'Extract content from URLs', badge: null },
  { id: 'tavily-research', label: 'Deep Research', desc: 'Multi-source research', badge: null },
];

export function getBlazeAPIConfig() {
  const baseURL = (process.env.BLAZEAPI_BASE_URL || 'https://api.blazeapi.org/paid/v1').trim().replace(/\/+$/, '');
  const apiKey = (process.env.BLAZEAPI_API_KEY || '').trim();
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

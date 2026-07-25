const BASE_URL = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').trim().replace(/\/+$/, '');
const API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();

export const OPENROUTER_DEFAULT_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

export const OPENROUTER_MODELS = [
  { id: OPENROUTER_DEFAULT_MODEL, label: 'Nemotron 3 Ultra', desc: 'Fast & capable (free)', badge: 'Recommended' },
  { id: 'deepseek/deepseek-v4-flash:free', label: 'DeepSeek V4 Flash (free)', desc: 'Fast & accurate', badge: null },
  { id: 'google/gemma-4-27b-it:free', label: 'Gemma 4 27B (free)', desc: 'Google model', badge: null },
  { id: 'meta-llama/llama-4-maverick:free', label: 'Llama 4 Maverick (free)', desc: 'Meta latest', badge: null },
  { id: 'qwen/qwen3-235b-a22b:free', label: 'Qwen3 235B (free)', desc: 'Alibaba, strong reasoning', badge: null },
];

export function getOpenRouterConfig() {
  return {
    baseURL: BASE_URL,
    apiKey: API_KEY,
    chatCompletionsUrl: `${BASE_URL}/chat/completions`,
    defaultModel: OPENROUTER_DEFAULT_MODEL,
  };
}

export function resolveOpenRouterModel(requested) {
  const model = String(requested || '').trim();
  if (!model) return OPENROUTER_DEFAULT_MODEL;
  return model;
}

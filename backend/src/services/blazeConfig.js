export const BLAZE_DEFAULT_MODEL = 'qwen3.6-plus';
export const BLAZE_DEFAULT_DEEP_MODEL = 'qwen3.6-plus-thinking';

export const BLAZE_MODELS = [
  { id: BLAZE_DEFAULT_DEEP_MODEL, label: 'Premium', desc: 'Deepest analysis', badge: 'Recommended' },
  { id: BLAZE_DEFAULT_MODEL, label: 'Standard', desc: 'Fast & accurate', badge: null },
  { id: 'grok-4.20-fast', label: 'Grok 4.20 Fast', desc: 'Low-latency reasoning', badge: null },
  { id: 'qwen3.6-max-preview-thinking', label: 'Qwen 3.6 Max Preview', desc: 'Extended thinking preview', badge: null },
  { id: 'moonshotai/kimi-k2.6', label: 'Kimi K2.6', desc: 'Long-context generalist', badge: null },
];

function sanitizeConfiguredModel(configured, hardDefault) {
  const model = String(configured || '').trim();
  if (!model) return hardDefault;
  if (/^(?:z-ai\/)?glm-5\.1$/i.test(model)) return BLAZE_DEFAULT_MODEL;
  if (/deepseek|claude/i.test(model)) return hardDefault;
  return model;
}

function getConfiguredDefaultModel() {
  return sanitizeConfiguredModel(process.env.BLAZE_MODEL, BLAZE_DEFAULT_MODEL);
}

function getConfiguredDefaultDeepModel() {
  const defaultModel = getConfiguredDefaultModel();
  return sanitizeConfiguredModel(
    process.env.BLAZE_DEEP_MODEL,
    process.env.BLAZE_MODEL ? defaultModel : BLAZE_DEFAULT_DEEP_MODEL,
  );
}

export function getBlazeConfig() {
  const baseURL = (process.env.BLAZE_BASE_URL || 'https://blazeai.boxu.dev/api').trim().replace(/\/+$/, '');
  const apiKey = (process.env.BLAZE_API_KEY || '').trim();
  const defaultModel = getConfiguredDefaultModel();
  const defaultDeepModel = getConfiguredDefaultDeepModel();

  return {
    baseURL,
    apiKey,
    chatCompletionsUrl: `${baseURL}/chat/completions`,
    defaultModel,
    defaultDeepModel,
  };
}

export function resolveBlazeModel(requested, fallbackModel = null) {
  const model = String(requested || '').trim();
  const fallback = sanitizeConfiguredModel(fallbackModel, getConfiguredDefaultDeepModel());

  if (!model) return fallback;
  if (/^(?:z-ai\/)?glm-5\.1$/i.test(model)) return getConfiguredDefaultModel();
  if (/deepseek|claude/i.test(model)) return fallback;
  return model;
}
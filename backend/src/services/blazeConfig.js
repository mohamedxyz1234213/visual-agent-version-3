export const BLAZE_DEFAULT_MODEL = 'deepseek-v4-flash';
export const BLAZE_DEFAULT_DEEP_MODEL = 'deepseek-v4-pro';

export const BLAZE_MODELS = [
  { id: BLAZE_DEFAULT_MODEL, label: 'DeepSeek V4 Flash', desc: 'Fast & accurate', badge: 'Recommended' },
  { id: BLAZE_DEFAULT_DEEP_MODEL, label: 'DeepSeek V4 Pro', desc: 'Deepest analysis', badge: null },
];

function sanitizeConfiguredModel(configured, hardDefault) {
  const model = String(configured || '').trim();
  if (!model) return hardDefault;
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
  return model;
}
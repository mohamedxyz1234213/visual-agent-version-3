/**
 * AgentRouter — OpenAI-compatible API at https://agentrouter.org/v1
 * Model: deepseek-v4-pro (OpenAI chat/completions)
 */
export const AGENTROUTER_MODEL = 'deepseek-v4-pro';

export const AGENTROUTER_MODELS = [
  { id: AGENTROUTER_MODEL, label: 'DeepSeek v4 Pro', badge: 'Recommended' },
];

export function getAgentRouterConfig() {
  // Optional local forward proxy (you run it) — e.g. http://localhost:8318/v1
  const raw = (
    process.env.AGENTROUTER_PROXY_URL
    || process.env.DEEPSEEK_BASE_URL
    || process.env.OPENAI_BASE_URL
    || 'https://agentrouter.org/v1'
  ).trim().replace(/\/+$/, '');

  const baseURL = /\/v1$/i.test(raw) ? raw : `${raw.replace(/\/v1\/?$/, '')}/v1`;

  const apiKey = (
    process.env.DEEPSEEK_API_KEY
    || process.env.OPENAI_API_KEY
    || ''
  ).trim();

  return {
    baseURL,
    apiKey,
    chatCompletionsUrl: `${baseURL}/chat/completions`,
    defaultModel: resolveAgentRouterModel(),
  };
}

export function resolveAgentRouterModel(requested) {
  const m = String(requested || '').trim();
  if (m && !/qwen|glm|blaze|claude/i.test(m)) return m;
  return process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || AGENTROUTER_MODEL;
}

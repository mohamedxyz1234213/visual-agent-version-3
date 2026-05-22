/**
 * AgentRouter DeepSeek — OpenAI-compatible POST /v1/chat/completions
 */
import OpenAI from 'openai';
import { getAgentRouterConfig, resolveAgentRouterModel } from './agentRouterConfig.js';

export async function callAgentRouterJSON({
  model,
  systemPrompt,
  userPrompt,
  maxTokens,
  timeoutMs,
  temperature = 0.5,
}) {
  const { baseURL, apiKey, chatCompletionsUrl } = getAgentRouterConfig();
  if (!apiKey) {
    throw new Error(
      'AgentRouter API key missing — set DEEPSEEK_API_KEY or OPENAI_API_KEY (https://agentrouter.org/console/token)',
    );
  }

  const resolvedModel = resolveAgentRouterModel(model);
  console.log(`[agentRouter] >>> POST ${chatCompletionsUrl} model=${resolvedModel} max_tokens=${maxTokens}`);

  const client = new OpenAI({
    apiKey,
    baseURL,
    timeout: timeoutMs,
  });

  try {
    const response = await client.chat.completions.create({
      model: resolvedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    const text = response.choices?.[0]?.message?.content || '';
    console.log(
      `[agentRouter] <<< OK model=${resolvedModel} finish=${response.choices?.[0]?.finish_reason} usage=${JSON.stringify(response.usage || {})}`,
    );
    return { text, raw: response };
  } catch (err) {
    const status = err?.status ?? err?.statusCode;
    const detail = err?.error
      ? JSON.stringify(err.error)
      : (err?.message || String(err));
    console.error(`[agentRouter] <<< FAIL status=${status} detail=${detail.slice(0, 400)}`);

    if (/unauthorized client|unauthorized_client/i.test(detail)) {
      const blocked = new Error(
        'AgentRouter client allowlist: server apps are blocked (only official CLIs like Codex/Claude Code). '
        + 'Set BLAZE_API_KEY for automatic fallback, or point DEEPSEEK_BASE_URL at a local forward proxy you run.',
      );
      blocked.code = 'AGENTROUTER_CLIENT_BLOCKED';
      throw blocked;
    }
    if (status === 401 || /unauthenticated|invalid.*key/i.test(detail)) {
      throw new Error(
        `AgentRouter auth failed (HTTP ${status || 401}). Check DEEPSEEK_API_KEY in backend/.env`,
      );
    }
    throw new Error(`AgentRouter error${status ? ` HTTP ${status}` : ''}: ${detail.slice(0, 300)}`);
  }
}

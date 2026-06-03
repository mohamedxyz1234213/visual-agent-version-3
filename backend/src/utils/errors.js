// -----------------------------------------------------------------------------
// User-facing error sanitization
// -----------------------------------------------------------------------------
// Internal errors (gateway sentinels, stack traces, model names, timeouts) must
// never reach the end user verbatim — they're confusing and leak internals. The
// real error is still logged server-side; this maps it to one clear, friendly
// sentence the UI can show. One sanitizer, applied at every boundary where an
// error becomes visible to the user.
// -----------------------------------------------------------------------------

const PATTERNS = [
  {
    // Upstream AI gateway returned prose instead of JSON, or a model fell over.
    re: /gateway|sentinel|simplified prompt|upstream|all models? (failed|unavailable)|blazeai|grok|qwen|moonshot|kimi/i,
    message: 'The AI service is temporarily busy. Please try again in a moment.',
  },
  {
    re: /timeout|timed out|etimedout|deadline|aborted|esockettimedout/i,
    message: 'Generating this lesson took too long. Try a shorter topic or try again.',
  },
  {
    re: /\b429\b|rate.?limit|too many requests|quota|capacity/i,
    message: 'The AI service is receiving a lot of requests right now. Please try again shortly.',
  },
  {
    re: /econnrefused|enotfound|econnreset|network|fetch failed|socket hang up|getaddrinfo/i,
    message: "We couldn't reach the AI service. Check your connection and try again.",
  },
  {
    re: /json|parse|unexpected token|malformed|schema|invalid (plan|response)/i,
    message: 'The AI returned an unexpected format. Please try generating the lesson again.',
  },
  {
    re: /\b401\b|\b403\b|unauthorized|forbidden|api key|authentication/i,
    message: 'The AI service rejected the request. Please verify the service configuration.',
  },
  {
    re: /pdf|extract|ocr|corrupt|unsupported file|no text/i,
    message: "We couldn't read that document. Try a different file or paste the text directly.",
  },
];

const GENERIC = 'Something went wrong while generating your lesson. Please try again.';

/**
 * Map any internal error to a single, safe, user-facing sentence.
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function toUserFacingError(err, fallback = GENERIC) {
  const raw = String(err?.message ?? err ?? '');
  if (!raw) return fallback;
  for (const { re, message } of PATTERNS) {
    if (re.test(raw)) return message;
  }
  // Unknown error: if it's short and already reads like a clean sentence
  // (no stack frames, no code-y noise), surface it; otherwise stay generic.
  const looksClean = raw.length <= 140 && !/[{}<>]|\bat \/|node_modules|\n|Error:|stack/i.test(raw);
  return looksClean ? raw : fallback;
}

/**
 * Shape an error for an HTTP JSON response, preserving an explicit status code.
 * @param {unknown} err
 * @returns {{ status: number, message: string }}
 */
export function toErrorResponse(err) {
  const status = Number(err?.status || err?.statusCode) || 500;
  // Client errors (4xx) that aren't auth can keep their own message if clean.
  const message = toUserFacingError(err);
  return { status, message };
}

export function getClientIp(req) {
  // req.ip already resolves X-Forwarded-For safely when (and only when)
  // Express's `trust proxy` is enabled — never parse the header ourselves,
  // otherwise a client could spoof it to bypass IP-based rate limiting.
  return req.ip || req.socket?.remoteAddress || null;
}

export function getUserAgent(req) {
  return req.headers?.['user-agent'] || null;
}

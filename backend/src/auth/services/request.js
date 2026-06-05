export function getClientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (xff) {
    const first = String(xff).split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || null;
}

export function getUserAgent(req) {
  return req.headers?.['user-agent'] || null;
}

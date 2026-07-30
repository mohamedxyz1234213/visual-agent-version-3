/**
 * Schedule work that continues after the HTTP response is sent.
 * On Vercel serverless, uses waitUntil so the invocation stays alive.
 */
let waitUntilFn = null;

async function loadWaitUntil() {
  if (waitUntilFn !== null) return waitUntilFn;
  if (process.env.VERCEL === '1') {
    try {
      const mod = await import('@vercel/functions');
      waitUntilFn = mod.waitUntil;
      return waitUntilFn;
    } catch (err) {
      console.warn('[backgroundTask] @vercel/functions unavailable:', err.message);
    }
  }
  waitUntilFn = false;
  return waitUntilFn;
}

export function scheduleBackgroundTask(label, task) {
  const run = () =>
    Promise.resolve()
      .then(task)
      .catch((err) => {
        console.error(`[backgroundTask] Failed: ${label}`, err);
      });

  if (process.env.VERCEL === '1') {
    loadWaitUntil().then((waitUntil) => {
      if (waitUntil) {
        waitUntil(run());
      } else {
        setImmediate(run);
      }
    });
    return;
  }

  setImmediate(run);
}

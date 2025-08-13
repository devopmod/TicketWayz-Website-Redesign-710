const EVENT_THROTTLE_MS = 1000;
let lastEventTime = 0;

const MAX_BACKOFF_MS = 60000;
let backoffMs = 0;
let nextAttempt = 0;

export async function initSentry() {
  const isLocalhost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (import.meta.env.DEV || isLocalhost || Date.now() < nextAttempt) {
    if (Date.now() < nextAttempt) {
      console.warn('Sentry initialization skipped due to rate limiting');
    }
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  let Sentry;
  let makeFetchTransport;
  try {
    Sentry = await import('@sentry/react');
    ({ makeFetchTransport } = await import('@sentry/browser'));
  } catch (e) {
    console.warn('Sentry SDK not available', e);
    return;
  }

  const baseTransport = makeFetchTransport({ dsn });
  const transport = {
    send: async (request) => {
      if (Date.now() < nextAttempt) {
        console.warn('Sentry event skipped due to rate limiting');
        return { statusCode: 429 };
      }
      const response = await baseTransport.send(request);
      if (response && response.statusCode === 429) {
        backoffMs = backoffMs ? Math.min(backoffMs * 2, MAX_BACKOFF_MS) : 1000;
        nextAttempt = Date.now() + backoffMs;
        console.warn(`Sentry rate limited. Backing off for ${backoffMs}ms`);
      } else {
        backoffMs = 0;
      }
      return response;
    },
  };

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    maxBreadcrumbs: 50,
    environment: import.meta.env.MODE,
    transport,
    beforeSend(event) {
      const now = Date.now();
      if (now - lastEventTime < EVENT_THROTTLE_MS) {
        return null;
      }
      lastEventTime = now;
      return event;
    },
  });
}

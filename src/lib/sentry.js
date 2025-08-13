const EVENT_THROTTLE_MS = 1000;
let lastEventTime = 0;

export async function initSentry() {
  if (import.meta.env.MODE === 'development') {
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  let Sentry;
  try {
    Sentry = await import('@sentry/react');
  } catch (e) {
    console.warn('Sentry SDK not available', e);
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    maxBreadcrumbs: 50,
    environment: import.meta.env.MODE,
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

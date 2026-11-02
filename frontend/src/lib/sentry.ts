/**
 * Lightweight Sentry error reporter that stays completely dormant unless VITE_SENTRY_DSN is configured.
 * Automatically scrubs PII (emails, tokens, passwords) before dispatching error events.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const SENSITIVE_REGEX = /(?:bearer\s+[A-Za-z0-9\-._~+/]+=*|token[=:]\s*['"]?[A-Za-z0-9\-._~+/]+|password[=:]\s*['"]?[^\s,'"]+|secret[=:]\s*['"]?[^\s,'"]+)/gi;

function scrub(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(SENSITIVE_REGEX, '[REDACTED_SECRET]');
}

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string' || !dsn.trim()) {
    return; // Dormant when no DSN provided
  }

  let ingestUrl: string | null = null;
  let publicKey: string | null = null;

  try {
    const url = new URL(dsn.trim());
    publicKey = url.username;
    const pathParts = url.pathname.split('/').filter(Boolean);
    const projectId = pathParts[pathParts.length - 1];
    ingestUrl = `${url.protocol}//${url.host}/api/${projectId}/store/`;
  } catch (err) {
    console.warn('Failed to parse VITE_SENTRY_DSN:', err);
    return;
  }

  const sendEvent = (message: string, stack?: string) => {
    if (!ingestUrl || !publicKey) return;

    const payload = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: 'error',
      logger: 'brackit-frontend',
      exception: {
        values: [
          {
            type: 'Error',
            value: scrub(message),
            stacktrace: stack ? { frames: [{ filename: scrub(stack) }] } : undefined,
          },
        ],
      },
    };

    fetch(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=brackit-frontend/1.0, sentry_key=${publicKey}`,
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Ignore background transmission errors
    });
  };

  window.addEventListener('error', (event) => {
    sendEvent(event.message || 'Script error', event.error?.stack);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    sendEvent(msg, stack);
  });
}

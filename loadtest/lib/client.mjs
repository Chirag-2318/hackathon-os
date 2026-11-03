/**
 * High-performance lightweight HTTP and SSE client for load testing virtual users.
 */

export class VirtualUserClient {
  constructor({ baseUrl, sessionId, csrfToken, user, metrics }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.sessionId = sessionId;
    this.csrfToken = csrfToken;
    this.user = user;
    this.metrics = metrics;
    this.activeSse = [];
  }

  getHeaders(extra = {}) {
    const headers = {
      'Accept': 'application/json',
      'Cookie': `JSESSIONID=${this.sessionId}; XSRF-TOKEN=${this.csrfToken}`,
      ...extra
    };
    if (this.csrfToken) {
      headers['X-XSRF-TOKEN'] = this.csrfToken;
    }
    return headers;
  }

  async request(method, path, body = null, options = {}) {
    const metricName = options.metricName || `${method} ${path.replace(/\/[a-f0-9-]{36}/gi, '/:id')}`;
    const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    const headers = this.getHeaders(options.headers || {});

    const init = {
      method,
      headers
    };

    if (body !== null && method !== 'GET' && method !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const start = performance.now();
    let status = 0;
    let ok = false;
    let data = null;
    let error = null;

    try {
      const res = await fetch(url, init);
      status = res.status;
      ok = res.ok;

      const duration = performance.now() - start;
      const isExpectedError = options.allowedErrorCodes && options.allowedErrorCodes.includes(status);
      const isError = !ok && !isExpectedError;

      this.metrics?.record(metricName, duration, status, isError);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        data = await res.text().catch(() => null);
      }

      return { status, ok, data, headers: res.headers, durationMs: duration };
    } catch (err) {
      const duration = performance.now() - start;
      this.metrics?.record(metricName, duration, 0, true);
      return { status: 0, ok: false, error: err.message, durationMs: duration };
    }
  }

  get(path, options = {}) {
    return this.request('GET', path, null, options);
  }

  post(path, body = {}, options = {}) {
    return this.request('POST', path, body, options);
  }

  put(path, body = {}, options = {}) {
    return this.request('PUT', path, body, options);
  }

  patch(path, body = {}, options = {}) {
    return this.request('PATCH', path, body, options);
  }

  delete(path, options = {}) {
    return this.request('DELETE', path, null, options);
  }

  /**
   * Opens an SSE connection using native Fetch streaming reader.
   * Resolves when stream opens, streams data events to onEvent callback.
   */
  async openSse(path, onEvent, onError) {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    const headers = this.getHeaders({
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache'
    });

    const controller = new AbortController();
    const handle = {
      closed: false,
      close: () => {
        handle.closed = true;
        controller.abort();
      }
    };
    this.activeSse.push(handle);

    const connectStart = performance.now();
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      const connectDuration = performance.now() - connectStart;
      this.metrics?.record('SSE Connect', connectDuration, res.status, !res.ok);

      if (!res.ok) {
        if (onError) onError(new Error(`SSE connect failed with HTTP ${res.status}`));
        return handle;
      }

      // Read stream asynchronously in background
      (async () => {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = 'message';

        try {
          while (!handle.closed) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // save incomplete line

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('event:')) {
                currentEvent = trimmed.slice(6).trim();
              } else if (trimmed.startsWith('data:')) {
                const dataStr = trimmed.slice(5).trim();
                let parsed = dataStr;
                try {
                  parsed = JSON.parse(dataStr);
                } catch (_) {}
                if (onEvent) {
                  onEvent({
                    event: currentEvent,
                    data: parsed,
                    raw: dataStr,
                    receivedAt: Date.now()
                  });
                }
                currentEvent = 'message';
              }
            }
          }
        } catch (streamErr) {
          if (!handle.closed && onError) {
            onError(streamErr);
          }
        }
      })();

      return handle;
    } catch (err) {
      if (onError && !handle.closed) onError(err);
      return handle;
    }
  }

  closeAllSse() {
    for (const h of this.activeSse) {
      h.close();
    }
    this.activeSse = [];
  }
}

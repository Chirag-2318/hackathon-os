/**
 * System and container metrics monitor for load testing.
 * Scrapes /actuator/prometheus and /actuator/metrics with METRICS_TOKEN.
 */

export class SystemMonitor {
  constructor({ baseUrl, metricsToken, intervalMs = 2000 }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.metricsToken = metricsToken;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.samples = [];
  }

  async fetchMetrics() {
    const headers = { 'Accept': 'text/plain' };
    if (this.metricsToken) {
      headers['Authorization'] = `Bearer ${this.metricsToken}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}/actuator/prometheus`, { headers });
      if (!res.ok) {
        return null;
      }
      const text = await res.text();
      return this.parsePrometheus(text);
    } catch (_) {
      return null;
    }
  }

  parsePrometheus(text) {
    const metrics = {};
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      const spaceIdx = line.lastIndexOf(' ');
      if (spaceIdx === -1) continue;

      const keyWithTags = line.slice(0, spaceIdx).trim();
      const val = parseFloat(line.slice(spaceIdx + 1).trim());
      if (isNaN(val)) continue;

      // Extract specific metrics
      if (keyWithTags.startsWith('hikaricp_connections_active')) {
        metrics.hikariActive = val;
      } else if (keyWithTags.startsWith('hikaricp_connections_idle')) {
        metrics.hikariIdle = val;
      } else if (keyWithTags.startsWith('hikaricp_connections_pending')) {
        metrics.hikariPending = val;
      } else if (keyWithTags.startsWith('hikaricp_connections_max')) {
        metrics.hikariMax = val;
      } else if (keyWithTags.startsWith('jvm_memory_used_bytes{area="heap"')) {
        metrics.jvmHeapUsedMb = Math.round((val / (1024 * 1024)) * 10) / 10;
      } else if (keyWithTags.startsWith('jvm_memory_max_bytes{area="heap"')) {
        metrics.jvmHeapMaxMb = Math.round((val / (1024 * 1024)) * 10) / 10;
      } else if (keyWithTags.startsWith('hackathonos_sse_room_emitters_active')) {
        metrics.sseRoomStreams = val;
      } else if (keyWithTags.startsWith('hackathonos_sse_notification_emitters_active')) {
        metrics.sseNotificationStreams = val;
      } else if (keyWithTags.startsWith('hackathonos_sse_connections_total')) {
        metrics.sseTotal = val;
      } else if (keyWithTags.startsWith('hackathonos_ai_circuit_breaker_state')) {
        metrics.circuitBreakerState = val;
      } else if (keyWithTags.startsWith('jvm_gc_pause_seconds_sum')) {
        metrics.gcPauseSec = Math.round(val * 1000) / 1000;
      }
    }

    metrics.timestamp = Date.now();
    return metrics;
  }

  start() {
    this.samples = [];
    this.timer = setInterval(async () => {
      const sample = await this.fetchMetrics();
      if (sample) {
        this.samples.push(sample);
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  summary() {
    if (this.samples.length === 0) {
      return {
        sampleCount: 0,
        maxHikariActive: 0,
        maxHikariPending: 0,
        maxHeapMb: 0,
        maxSseConnections: 0
      };
    }

    let maxHikariActive = 0;
    let maxHikariPending = 0;
    let maxHeapMb = 0;
    let maxSseConnections = 0;
    let minHikariIdle = 9999;

    for (const s of this.samples) {
      if (s.hikariActive != null) maxHikariActive = Math.max(maxHikariActive, s.hikariActive);
      if (s.hikariPending != null) maxHikariPending = Math.max(maxHikariPending, s.hikariPending);
      if (s.hikariIdle != null) minHikariIdle = Math.min(minHikariIdle, s.hikariIdle);
      if (s.jvmHeapUsedMb != null) maxHeapMb = Math.max(maxHeapMb, s.jvmHeapUsedMb);
      if (s.sseTotal != null) maxSseConnections = Math.max(maxSseConnections, s.sseTotal);
    }

    return {
      sampleCount: this.samples.length,
      maxHikariActive,
      minHikariIdle: minHikariIdle === 9999 ? 0 : minHikariIdle,
      maxHikariPending,
      maxHeapMb,
      maxSseConnections,
      lastSample: this.samples[this.samples.length - 1]
    };
  }
}

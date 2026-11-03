/**
 * Statistical analysis and latency percentile calculator for load testing.
 */

export class MetricsCollector {
  constructor() {
    this.measurements = new Map(); // name -> array of numbers (ms)
    this.statusCodes = new Map();  // name -> Map of code -> count
    this.errors = new Map();        // name -> count
    this.customEvents = [];
  }

  record(name, durationMs, statusCode = 200, isError = false) {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
      this.statusCodes.set(name, new Map());
      this.errors.set(name, 0);
    }
    this.measurements.get(name).push(durationMs);

    const codes = this.statusCodes.get(name);
    codes.set(statusCode, (codes.get(statusCode) || 0) + 1);

    if (isError) {
      this.errors.set(name, this.errors.get(name) + 1);
    }
  }

  recordCustom(event, data) {
    this.customEvents.push({ timestamp: Date.now(), event, data });
  }

  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
  }

  summary(name) {
    const list = this.measurements.get(name) || [];
    const count = list.length;
    if (count === 0) return null;

    const sum = list.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = Math.min(...list);
    const max = Math.max(...list);
    const p50 = this.percentile(list, 50);
    const p90 = this.percentile(list, 90);
    const p95 = this.percentile(list, 95);
    const p99 = this.percentile(list, 99);
    const errCount = this.errors.get(name) || 0;
    const errRate = (errCount / count) * 100;

    return {
      name,
      count,
      avg: Math.round(avg * 10) / 10,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      p50: Math.round(p50 * 10) / 10,
      p90: Math.round(p90 * 10) / 10,
      p95: Math.round(p95 * 10) / 10,
      p99: Math.round(p99 * 10) / 10,
      errorCount: errCount,
      errorRate: Math.round(errRate * 100) / 100,
      codes: Object.fromEntries(this.statusCodes.get(name) || new Map())
    };
  }

  allSummaries() {
    const results = [];
    for (const name of this.measurements.keys()) {
      results.push(this.summary(name));
    }
    return results;
  }

  formatMarkdownTable() {
    const summaries = this.allSummaries();
    if (summaries.length === 0) return 'No measurements recorded.';

    let md = '| Operation / Target | Requests | Avg (ms) | Min (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Errors (%) |\n';
    md += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';

    for (const s of summaries) {
      md += `| \`${s.name}\` | ${s.count} | ${s.avg} | ${s.min} | ${s.p50} | **${s.p95}** | ${s.p99} | ${s.max} | ${s.errorRate}% |\n`;
    }
    return md;
  }
}

#!/usr/bin/env node
/**
 * Master Load Test Runner for Brackit (Render Hardening Verification).
 * Usage: node run.mjs <scenario|all> <profile: 512mb|1gb|2gb>
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MetricsCollector } from './lib/metrics.mjs';
import { VirtualUserClient } from './lib/client.mjs';
import { SystemMonitor } from './lib/monitor.mjs';

import { runBrowseScenario } from './scenarios/browse.mjs';
import { runLiveScenario } from './scenarios/live.mjs';
import { runWriteScenario } from './scenarios/write.mjs';
import { runAiBurstScenario } from './scenarios/ai_burst.mjs';
import { runRestartResilienceScenario } from './scenarios/restart.mjs';
import { runSpikeScenario } from './scenarios/spike.mjs';

const TARGET_URL = (process.env.TARGET_URL || process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '');
const METRICS_TOKEN = process.env.METRICS_TOKEN || 'loadtest-metrics-token';

const scenarioArg = (process.argv[2] || 'all').toLowerCase();
const profileArg = (process.argv[3] || '512mb').toLowerCase();

console.log('================================================================================');
console.log(' BRACKIT LOAD TESTING SUITE (Render Scalability Verification)');
console.log(` Target Backend:  ${TARGET_URL}`);
console.log(` Active Scenario: ${scenarioArg}`);
console.log(` Target Profile:  ${profileArg}`);
console.log('================================================================================\n');

async function main() {
  const metrics = new MetricsCollector();
  const monitor = new SystemMonitor({ baseUrl: TARGET_URL, metricsToken: METRICS_TOKEN, intervalMs: 1500 });

  // 1. Check health
  console.log('[setup] Checking backend health...');
  try {
    const res = await fetch(`${TARGET_URL}/api/v1/health`);
    if (!res.ok) throw new Error(`Health check failed with HTTP ${res.status}`);
    const health = await res.json();
    console.log('[setup] Backend is ONLINE:', JSON.stringify(health));
  } catch (err) {
    console.error(`[setup] ERROR: Could not connect to backend at ${TARGET_URL}: ${err.message}`);
    process.exit(1);
  }

  // 2. Seed realistic load test data and obtain pre-authenticated sessions
  console.log('\n[setup] Requesting synthetic load test seeding (500 users, 100 rooms)...');
  let seedData;
  try {
    const seedRes = await fetch(`${TARGET_URL}/api/v1/loadtest/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userCount: 500,
        roomCount: 100,
        tasksPerRoom: 20,
        docsPerRoom: 10,
        ideasPerRoom: 15
      })
    });
    if (!seedRes.ok) {
      throw new Error(`Seed failed with HTTP ${seedRes.status}: ${await seedRes.text()}`);
    }
    seedData = await seedRes.json();
    console.log(`[setup] Seeding successful! Created/resolved ${seedData.userCount} users and ${seedData.roomCount} rooms.`);
  } catch (err) {
    console.error(`[setup] ERROR: Load-test seed failed: ${err.message}`);
    process.exit(1);
  }

  // 3. Initialize virtual user clients
  const clients = seedData.users.map(u => new VirtualUserClient({
    baseUrl: TARGET_URL,
    sessionId: u.sessionId,
    csrfToken: u.csrfToken,
    user: u,
    metrics
  }));
  const rooms = seedData.rooms;

  // 4. Start system monitor
  monitor.start();

  const results = {};
  const runAll = scenarioArg === 'all';

  // 5. Execute Scenarios
  try {
    if (runAll || scenarioArg === 'browse') {
      console.log('\n--- SCENARIO 1: BROWSE ---');
      results.browse = await runBrowseScenario({
        clients,
        rooms,
        durationSeconds: 25,
        concurrency: Math.min(300, clients.length)
      });
    }

    if (runAll || scenarioArg === 'live') {
      console.log('\n--- SCENARIO 2: LIVE SSE ---');
      results.live = await runLiveScenario({
        clients,
        rooms,
        durationSeconds: 30,
        totalConnections: Math.min(400, clients.length),
        metrics
      });
    }

    if (runAll || scenarioArg === 'write') {
      console.log('\n--- SCENARIO 3: WRITE ---');
      results.write = await runWriteScenario({
        clients,
        rooms,
        durationSeconds: 25,
        targetRps: 30
      });
    }

    if (runAll || scenarioArg === 'ai_burst') {
      console.log('\n--- SCENARIO 4: AI BURST ---');
      results.ai_burst = await runAiBurstScenario({
        clients,
        rooms,
        monitor,
        userCount: Math.min(60, clients.length)
      });
    }

    if (runAll || scenarioArg === 'restart' || scenarioArg === 'restart_resilience') {
      console.log('\n--- SCENARIO 5: RESTART RESILIENCE ---');
      results.restart = await runRestartResilienceScenario({
        clients,
        rooms,
        baseUrl: TARGET_URL
      });
    }

    if (runAll || scenarioArg === 'spike') {
      console.log('\n--- SCENARIO 6: SPIKE ---');
      results.spike = await runSpikeScenario({
        clients,
        rooms,
        totalDurationSec: 30,
        maxUsers: Math.min(500, clients.length)
      });
    }
  } catch (err) {
    console.error(`\n[run] ERROR during scenario execution: ${err.message}`);
    results.error = err.message;
  } finally {
    monitor.stop();
    for (const c of clients) {
      c.closeAllSse();
    }
  }

  // 6. Collect final metrics and evaluate thresholds
  const systemSummary = monitor.summary();
  const opSummaries = metrics.allSummaries();

  console.log('\n================================================================================');
  console.log(' LOAD TEST EXECUTION RESULTS');
  console.log('================================================================================\n');
  console.log(metrics.formatMarkdownTable());

  console.log('\n--- SYSTEM RESOURCE UTILIZATION ---');
  console.log(`Peak Hikari Active Connections:  ${systemSummary.maxHikariActive}`);
  console.log(`Min Hikari Idle Connections:    ${systemSummary.minHikariIdle}`);
  console.log(`Peak Hikari Waiting Requests:   ${systemSummary.maxHikariPending}`);
  console.log(`Peak JVM Heap Allocated:        ${systemSummary.maxHeapMb} MB`);
  console.log(`Peak SSE Stream Connections:    ${systemSummary.maxSseConnections}`);

  // Threshold evaluations:
  // p95 < 800ms for normal reads, p95 < 1500ms for writes, error rate < 1%
  const thresholdFailures = [];
  for (const s of opSummaries) {
    const isWrite = s.name.startsWith('POST') || s.name.startsWith('PUT') || s.name.startsWith('PATCH') || s.name.startsWith('DELETE');
    const isAi = s.name.includes('/ai/') || s.name.includes('mock-ai');
    const targetP95 = isWrite ? 1500 : 800;

    if (!isAi && s.p95 > targetP95) {
      thresholdFailures.push(`${s.name} p95 exceeded threshold: ${s.p95}ms > ${targetP95}ms`);
    }
    if (!isAi && s.errorRate > 1.0) {
      thresholdFailures.push(`${s.name} error rate exceeded threshold: ${s.errorRate}% > 1.0%`);
    }
  }

  const passed = thresholdFailures.length === 0 && !results.error;

  console.log('\n--- THRESHOLD VERIFICATION ---');
  if (passed) {
    console.log('>>> [PASS] All operations met SLA thresholds (p95 < 800ms read, p95 < 1500ms write, error rate < 1%).');
  } else {
    console.log('>>> [WARN / FAIL] Threshold warnings:');
    for (const f of thresholdFailures) {
      console.log(`  - ${f}`);
    }
  }

  // 7. Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsDir = resolve('loadtest/results', timestamp);
  mkdirSync(resultsDir, { recursive: true });

  const reportData = {
    timestamp,
    scenario: scenarioArg,
    profile: profileArg,
    targetUrl: TARGET_URL,
    passed,
    systemSummary,
    scenarioResults: results,
    operationSummaries: opSummaries,
    thresholdFailures
  };

  writeFileSync(resolve(resultsDir, 'report.json'), JSON.stringify(reportData, null, 2));

  let mdReport = `# Load Test Run: ${timestamp}\n\n`;
  mdReport += `- **Profile:** \`${profileArg}\`\n`;
  mdReport += `- **Scenario:** \`${scenarioArg}\`\n`;
  mdReport += `- **Target Backend:** \`${TARGET_URL}\`\n`;
  mdReport += `- **Overall Status:** **${passed ? 'PASSED' : 'NEEDS ATTENTION'}**\n\n`;
  mdReport += `## Operational Metrics Table\n\n${metrics.formatMarkdownTable()}\n\n`;
  mdReport += `## System Resource Highlights\n\n`;
  mdReport += `- Peak Hikari Active Connections: **${systemSummary.maxHikariActive}**\n`;
  mdReport += `- Min Hikari Idle: **${systemSummary.minHikariIdle}**\n`;
  mdReport += `- Peak Hikari Pending: **${systemSummary.maxHikariPending}**\n`;
  mdReport += `- Peak JVM Heap Memory: **${systemSummary.maxHeapMb} MB**\n`;
  mdReport += `- Peak Live SSE Streams: **${systemSummary.maxSseConnections}**\n`;

  writeFileSync(resolve(resultsDir, 'report.md'), mdReport);
  console.log(`\n[report] Results saved to: ${resolve(resultsDir, 'report.md')}\n`);
}

main().catch(err => {
  console.error('Fatal load test failure:', err);
  process.exit(1);
});


/**
 * Scenario 4: AI Burst Workload
 * 60 virtual users trigger AI generation actions within 30 seconds.
 * Verifies that:
 * 1. Normal GET endpoints stay fast (< 800ms) during the burst (proves Step 2 transaction isolation).
 * 2. Excess requests return HTTP 503 SERVER_BUSY rather than socket timeouts.
 * 3. Database connection pool never starves.
 */

export async function runAiBurstScenario({ clients, rooms, monitor, userCount = 60 }) {
  console.log(`[ai_burst] Launching burst of ${userCount} concurrent AI requests...`);

  const activeClients = clients.slice(0, userCount);
  let serverBusyCount = 0;
  let successAiCount = 0;
  let timeoutCount = 0;

  // 1. Concurrently run normal background GET requests to test if normal traffic degrades
  let bgReadCount = 0;
  const bgReadDurations = [];
  let burstFinished = false;

  const backgroundReadProbe = async () => {
    while (!burstFinished) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      if (client && room) {
        const start = performance.now();
        const res = await client.get(`/api/v1/rooms/${room.id}/board`, {
          metricName: 'GET /api/v1/rooms/:id/board (During AI Burst)'
        });
        const duration = performance.now() - start;
        if (res.ok) {
          bgReadDurations.push(duration);
          bgReadCount++;
        }
      }
      await new Promise(r => setTimeout(r, 100));
    }
  };

  const bgPromise = backgroundReadProbe();

  // 2. Fire 60 AI requests within 30s
  const fireAiRequest = async (client, idx) => {
    const room = rooms[idx % rooms.length] || rooms[0];
    if (!room) return;

    // Small stagger: spread 60 requests over first 10-15 seconds
    const staggerMs = Math.floor(Math.random() * 8000);
    await new Promise(r => setTimeout(r, staggerMs));

    const res = await client.post(`/api/v1/rooms/${room.id}/ai/generate-plan`, {
      prompt: 'Load testing synthetic plan generation request'
    }, {
      metricName: 'POST /api/v1/rooms/:id/ai/generate-plan',
      allowedErrorCodes: [503, 429]
    });

    if (res.status === 503 || (res.data && res.data.code === 'SERVER_BUSY')) {
      serverBusyCount++;
    } else if (res.ok) {
      successAiCount++;
    } else if (res.status === 504 || res.durationMs > 15000) {
      timeoutCount++;
    }
  };

  await Promise.all(activeClients.map((client, i) => fireAiRequest(client, i)));
  burstFinished = true;
  await bgPromise;

  console.log(`[ai_burst] AI Burst finished. Successes: ${successAiCount}, SERVER_BUSY: ${serverBusyCount}, Timeouts: ${timeoutCount}`);
  console.log(`[ai_burst] Background reads completed during AI burst: ${bgReadCount}`);

  // Calculate background read p95
  const sortedBg = [...bgReadDurations].sort((a, b) => a - b);
  const p95Bg = sortedBg.length > 0 ? sortedBg[Math.ceil(0.95 * sortedBg.length) - 1] : 0;
  console.log(`[ai_burst] Background read p95 during AI burst: ${Math.round(p95Bg)}ms`);

  const monitorSummary = monitor ? monitor.summary() : {};
  console.log(`[ai_burst] Hikari pool peak active: ${monitorSummary.maxHikariActive}, min idle: ${monitorSummary.minHikariIdle}`);

  return {
    successAiCount,
    serverBusyCount,
    timeoutCount,
    bgReadCount,
    bgReadP95Ms: Math.round(p95Bg),
    maxHikariActive: monitorSummary.maxHikariActive,
    minHikariIdle: monitorSummary.minHikariIdle
  };
}

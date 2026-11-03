/**
 * Scenario 6: Spike Workload
 * Ramps from 50 to 500 virtual users in 60 seconds.
 * Measures latency degradation curve, throughput, and error rates during aggressive traffic spikes.
 */

export async function runSpikeScenario({ clients, rooms, totalDurationSec = 60, maxUsers = 500 }) {
  console.log(`[spike] Starting spike test: ramping from 50 to ${maxUsers} users over ${totalDurationSec}s...`);

  const startTime = Date.now();
  const stages = [
    { targetUsers: Math.min(50, clients.length), durationSec: 10 },
    { targetUsers: Math.min(100, clients.length), durationSec: 10 },
    { targetUsers: Math.min(200, clients.length), durationSec: 10 },
    { targetUsers: Math.min(300, clients.length), durationSec: 10 },
    { targetUsers: Math.min(400, clients.length), durationSec: 10 },
    { targetUsers: Math.min(maxUsers, clients.length), durationSec: 10 }
  ];

  let totalRequests = 0;
  let activeWorkers = 0;
  let stopRequested = false;

  const runUserWorker = async (client, workerId) => {
    activeWorkers++;
    const userRooms = client.user.roomIds || [];
    const rId = userRooms[0] || (rooms[0] ? rooms[0].id : null);

    while (!stopRequested) {
      // Mixed realistic user activity: reads + occasional write
      await client.get('/api/v1/home', { metricName: 'GET /api/v1/home (Spike)' });

      if (rId) {
        await client.get(`/api/v1/rooms/${rId}/board`, { metricName: 'GET /api/v1/rooms/:id/board (Spike)' });
        await client.get(`/api/v1/rooms/${rId}/tasks`, { metricName: 'GET /api/v1/rooms/:id/tasks (Spike)' });

        // Occasional light mutation
        if (Math.random() < 0.15) {
          await client.post(`/api/v1/rooms/${rId}/ideas`, {
            text: `Spike idea from worker ${workerId} at ${Date.now()}`
          }, { metricName: 'POST /api/v1/rooms/:id/ideas (Spike)' });
        }
      }

      totalRequests++;
      await new Promise(r => setTimeout(r, 150 + Math.random() * 200));
    }
    activeWorkers--;
  };

  const spawnedWorkers = new Set();

  for (let sIdx = 0; sIdx < stages.length; sIdx++) {
    const stage = stages[sIdx];
    console.log(`[spike] Stage ${sIdx + 1}/${stages.length}: targeting ${stage.targetUsers} concurrent users for ${stage.durationSec}s...`);

    // Spawn up to stage.targetUsers
    while (spawnedWorkers.size < stage.targetUsers && spawnedWorkers.size < clients.length) {
      const idx = spawnedWorkers.size;
      spawnedWorkers.add(idx);
      runUserWorker(clients[idx], idx).catch(() => {});
    }

    await new Promise(r => setTimeout(r, stage.durationSec * 1000));
  }

  stopRequested = true;
  await new Promise(r => setTimeout(r, 2000)); // wait for workers to drain

  const elapsedSec = Math.round((Date.now() - startTime) / 1000);
  const rps = Math.round(totalRequests / Math.max(1, elapsedSec));
  console.log(`[spike] Spike test completed: ${totalRequests} requests over ${elapsedSec}s (~${rps} req/sec, peak ${spawnedWorkers.size} VUs).`);

  return {
    totalRequests,
    elapsedSec,
    rps,
    peakVUs: spawnedWorkers.size
  };
}

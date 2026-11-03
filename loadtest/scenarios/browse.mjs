/**
 * Scenario 1: Browse Workload
 * 300 virtual users loading home, entering a room, reading board/docs/ideas/overview with realistic think times.
 * Threshold: p95 < 800ms for normal reads, error rate < 1%.
 */

export async function runBrowseScenario({ clients, rooms, durationSeconds = 30, concurrency = 300 }) {
  console.log(`[browse] Starting scenario with ${clients.length} users (concurrency: ${concurrency}, duration: ${durationSeconds}s)...`);

  const activeClients = clients.slice(0, Math.min(clients.length, concurrency));
  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;

  let totalRounds = 0;

  async function userBrowseLoop(client, index) {
    // Pick an assigned room or fallback to first room
    const userRoomIds = client.user.roomIds || [];
    const targetRoomId = userRoomIds.length > 0
      ? userRoomIds[index % userRoomIds.length]
      : (rooms[0] ? rooms[0].id : null);

    while (Date.now() < endTime) {
      // 1. Load home dashboard
      await client.get('/api/v1/home', { metricName: 'GET /api/v1/home' });
      await client.get('/api/v1/notifications', { metricName: 'GET /api/v1/notifications' });

      if (targetRoomId) {
        // 2. Enter room
        await client.get(`/api/v1/rooms/${targetRoomId}`, { metricName: 'GET /api/v1/rooms/:id' });
        await client.get(`/api/v1/rooms/${targetRoomId}/board`, { metricName: 'GET /api/v1/rooms/:id/board' });
        await client.get(`/api/v1/rooms/${targetRoomId}/tasks`, { metricName: 'GET /api/v1/rooms/:id/tasks' });
        await client.get(`/api/v1/rooms/${targetRoomId}/docs`, { metricName: 'GET /api/v1/rooms/:id/docs' });
        await client.get(`/api/v1/rooms/${targetRoomId}/ideas`, { metricName: 'GET /api/v1/rooms/:id/ideas' });
        await client.get(`/api/v1/rooms/${targetRoomId}/overview`, { metricName: 'GET /api/v1/rooms/:id/overview' });
      }

      totalRounds++;
      // Realistic think time between dashboard navigation (100-300ms in load test)
      const thinkTime = 100 + Math.floor(Math.random() * 200);
      await new Promise(r => setTimeout(r, thinkTime));
    }
  }

  // Run all virtual users in parallel
  await Promise.all(activeClients.map((client, i) => userBrowseLoop(client, i)));
  console.log(`[browse] Completed ${totalRounds} browse cycles across ${activeClients.length} virtual users.`);
}


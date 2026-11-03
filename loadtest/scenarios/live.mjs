/**
 * Scenario 2: Live Real-Time (SSE) Workload
 * 400 concurrent SSE connections (room stream + notification stream) held open with periodic reconnects.
 * Measures event delivery latency between mutation completion and SSE reception on a separate user in the same room.
 * Reports p50 / p95 / p99 delivery latency.
 */

export async function runLiveScenario({ clients, rooms, durationSeconds = 60, totalConnections = 400, metrics }) {
  console.log(`[live] Starting SSE scenario: ${totalConnections} concurrent streams over ${durationSeconds}s...`);

  const deliveryLatencies = [];
  const sseHandles = [];
  const roomUsersMap = new Map(); // roomId -> array of clients

  for (const client of clients) {
    for (const rId of (client.user.roomIds || [])) {
      if (!roomUsersMap.has(rId)) roomUsersMap.set(rId, []);
      roomUsersMap.get(rId).push(client);
    }
  }

  // Pending mutation tracking: roomId:topic -> mutationFinishedTimestamp
  const pendingMutations = new Map();

  // 1. Establish 400 concurrent connections across available clients
  let connectionsEstablished = 0;
  for (let i = 0; i < clients.length && connectionsEstablished < totalConnections; i++) {
    const client = clients[i];
    const userRooms = client.user.roomIds || [];
    const targetRoomId = userRooms[0] || (rooms[0] ? rooms[0].id : null);

    // Stream 1: Room events
    if (targetRoomId) {
      const handle = await client.openSse(
        `/api/v1/rooms/${targetRoomId}/events`,
        (event) => {
          const key = `${targetRoomId}:${event.event}`;
          const commitTime = pendingMutations.get(key);
          if (commitTime) {
            const latency = Date.now() - commitTime;
            deliveryLatencies.push(latency);
            metrics?.record('SSE Event Delivery Latency', latency, 200, false);
          }
        },
        () => {}
      );
      sseHandles.push(handle);
      connectionsEstablished++;
    }

    // Stream 2: Notification stream (if we still need more to reach 400)
    if (connectionsEstablished < totalConnections) {
      const handleNotif = await client.openSse(
        '/api/v1/notifications/stream',
        () => {},
        () => {}
      );
      sseHandles.push(handleNotif);
      connectionsEstablished++;
    }
  }

  console.log(`[live] Established ${connectionsEstablished} concurrent SSE streams across virtual users.`);

  // 2. Perform periodic background mutations while streams are held open
  const endTime = Date.now() + durationSeconds * 1000;
  let mutationCount = 0;

  const mutationLoop = async () => {
    while (Date.now() < endTime) {
      for (const room of rooms.slice(0, 5)) {
        const roomUsers = roomUsersMap.get(room.id) || [];
        if (roomUsers.length >= 2) {
          const sender = roomUsers[0];
          const key = `${room.id}:ideas`;
          pendingMutations.set(key, Date.now());

          // Post a new idea to trigger room change event
          await sender.post(`/api/v1/rooms/${room.id}/ideas`, {
            text: `Real-time latency check at ${Date.now()}`
          }, { metricName: 'POST /api/v1/rooms/:id/ideas' });

          mutationCount++;
        }
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  };

  // 3. Periodic reconnect simulation (5% of clients disconnect and reconnect with jitter)
  const reconnectLoop = async () => {
    while (Date.now() < endTime) {
      await new Promise(r => setTimeout(r, 8000));
      const idx = Math.floor(Math.random() * sseHandles.length);
      const handle = sseHandles[idx];
      if (handle && !handle.closed) {
        handle.close();
        const client = clients[idx % clients.length];
        const rId = (client.user.roomIds && client.user.roomIds[0]) || (rooms[0] ? rooms[0].id : null);
        if (rId) {
          const newHandle = await client.openSse(`/api/v1/rooms/${rId}/events`, () => {}, () => {});
          sseHandles[idx] = newHandle;
        }
      }
    }
  };

  await Promise.race([
    Promise.all([mutationLoop(), reconnectLoop()]),
    new Promise(r => setTimeout(r, durationSeconds * 1000))
  ]);

  // Clean up all open SSE connections
  for (const h of sseHandles) {
    try { h.close(); } catch (_) {}
  }

  console.log(`[live] Live SSE scenario finished. Total mutations: ${mutationCount}, delivery latencies measured: ${deliveryLatencies.length}`);

  const p50 = metrics ? metrics.percentile(deliveryLatencies, 50) : 0;
  const p95 = metrics ? metrics.percentile(deliveryLatencies, 95) : 0;
  const p99 = metrics ? metrics.percentile(deliveryLatencies, 99) : 0;

  console.log(`[live] SSE Event Delivery Latency -> p50: ${p50}ms, p95: ${p95}ms, p99: ${p99}ms`);
  return { p50, p95, p99, sampleCount: deliveryLatencies.length };
}

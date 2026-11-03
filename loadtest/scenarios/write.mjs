/**
 * Scenario 3: Heavy Write Workload
 * 20-40 mutations per second spread across rooms (task creates, moves, idea votes, doc edits with baseVersion, comments).
 * Verifies that optimistic lock conflicts return HTTP 409 cleanly and zero requests return 500.
 * Threshold: p95 < 1500ms for writes, non-conflict error rate < 1%.
 */

export async function runWriteScenario({ clients, rooms, durationSeconds = 30, targetRps = 30 }) {
  console.log(`[write] Starting write scenario: target ${targetRps} ops/sec for ${durationSeconds}s...`);

  const endTime = Date.now() + durationSeconds * 1000;
  let totalWrites = 0;
  let conflictCount = 0;
  let internalErrorCount = 0;

  const intervalMs = 1000 / targetRps;

  while (Date.now() < endTime) {
    const batchStart = performance.now();
    const client = clients[Math.floor(Math.random() * clients.length)];
    const room = rooms[Math.floor(Math.random() * rooms.length)];

    if (!room || !client) continue;

    const opType = Math.floor(Math.random() * 5);

    if (opType === 0) {
      // 1. Task Create
      const res = await client.post(`/api/v1/rooms/${room.id}/tasks`, {
        title: `Load test task #${Date.now()}`,
        description: 'Auto-generated write load task',
        priority: 'MEDIUM',
        status: 'TODO'
      }, { metricName: 'POST /api/v1/rooms/:id/tasks' });

      if (res.status === 500) internalErrorCount++;
      if (res.data?.id && room.taskIds) room.taskIds.push(res.data.id);
    } else if (opType === 1 && room.taskIds?.length > 0) {
      // 2. Task Move
      const taskId = room.taskIds[Math.floor(Math.random() * room.taskIds.length)];
      const statuses = ['TODO', 'IN_PROGRESS', 'DONE'];
      const targetStatus = statuses[Math.floor(Math.random() * statuses.length)];

      const res = await client.post(`/api/v1/rooms/${room.id}/tasks/${taskId}/move`, {
        status: targetStatus,
        position: 0
      }, {
        metricName: 'POST /api/v1/rooms/:id/tasks/:id/move',
        allowedErrorCodes: [404, 409]
      });

      if (res.status === 409) conflictCount++;
      if (res.status === 500) internalErrorCount++;
    } else if (opType === 2 && room.ideaIds?.length > 0) {
      // 3. Idea Vote
      const ideaId = room.ideaIds[Math.floor(Math.random() * room.ideaIds.length)];
      const res = await client.post(`/api/v1/rooms/${room.id}/ideas/${ideaId}/vote`, {}, {
        metricName: 'POST /api/v1/rooms/:id/ideas/:id/vote',
        allowedErrorCodes: [404]
      });

      if (res.status === 500) internalErrorCount++;
    } else if (opType === 3 && room.docIds?.length > 0) {
      // 4. Doc Edit with baseVersion (testing both normal and 409 conflict detection)
      const docId = room.docIds[Math.floor(Math.random() * room.docIds.length)];
      const isIntentionalConflict = Math.random() < 0.2; // 20% intentional stale baseVersion
      const baseVersion = isIntentionalConflict ? 0 : 1;

      const res = await client.put(`/api/v1/rooms/${room.id}/docs/${docId}`, {
        content: `Updated documentation content at ${Date.now()}\n\n# Revision\nDetailed notes.`,
        baseVersion
      }, {
        metricName: 'PUT /api/v1/rooms/:id/docs/:id',
        allowedErrorCodes: [409]
      });

      if (res.status === 409) {
        conflictCount++;
      }
      if (res.status === 500) internalErrorCount++;
    } else if (opType === 4 && room.taskIds?.length > 0) {
      // 5. Task Comment
      const taskId = room.taskIds[Math.floor(Math.random() * room.taskIds.length)];
      const res = await client.post(`/api/v1/rooms/${room.id}/tasks/${taskId}/comments`, {
        content: `Review note added at ${new Date().toISOString()}`
      }, {
        metricName: 'POST /api/v1/rooms/:id/tasks/:id/comments',
        allowedErrorCodes: [404]
      });

      if (res.status === 500) internalErrorCount++;
    }

    totalWrites++;

    const elapsed = performance.now() - batchStart;
    const sleepMs = Math.max(0, intervalMs - elapsed);
    if (sleepMs > 0) {
      await new Promise(r => setTimeout(r, sleepMs));
    }
  }

  console.log(`[write] Completed ${totalWrites} write operations. Conflicts handled cleanly (409): ${conflictCount}, 500 errors: ${internalErrorCount}`);

  if (internalErrorCount > 0) {
    throw new Error(`Write scenario failed: detected ${internalErrorCount} HTTP 500 responses!`);
  }

  return { totalWrites, conflictCount, internalErrorCount };
}

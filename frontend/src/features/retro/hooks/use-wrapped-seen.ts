/**
 * useWrappedSeen — M13 Hackathon Wrapped first-open tracking.
 * PRD 5b §5 (OQ-17).
 *
 * OQ-17 is BLOCKING: the persistent tracking mechanism (server vs browser flag)
 * is not decided. This hook exposes a minimal interface so the timing can
 * change in one place once OQ-17 is resolved.
 *
 * Current implementation: IN-MEMORY TEST DOUBLE.
 * - Does NOT persist across page reloads.
 * - Does NOT use localStorage or sessionStorage (T §4.4).
 * - Does NOT call any endpoint (OQ-21).
 *
 * Interface contract:
 *   seen === undefined  → still resolving (show skeleton, do not play)
 *   seen === false      → play M13 once
 *   seen === true       → show final card, no motion
 *   markSeen()          → call on start/finish/skip (timing is OQ-18)
 */
import { useState } from 'react';

interface WrappedSeenState {
  /** undefined = resolving, false = not seen, true = seen */
  seen: boolean | undefined;
  markSeen: () => void;
}

/**
 * In-memory store keyed by roomId.
 * Cleared on page reload — acceptable until OQ-17 is answered.
 * _test_double note: swap this Map with a server call or localStorage
 * once the persistence decision is made.
 */
const _inMemoryStore = new Map<string, boolean>();

export function useWrappedSeen(roomId: string): WrappedSeenState {
  const [seen, setSeen] = useState<boolean | undefined>(() => {
    // _test_double: simulate a brief "resolving" phase
    // In a real implementation this would be an async server/storage read.
    if (_inMemoryStore.has(roomId)) {
      return _inMemoryStore.get(roomId);
    }
    // Not in store yet — treat as not-seen (false).
    // A server implementation would return undefined here until the request resolves.
    return false;
  });

  const markSeen = () => {
    // OQ-18: the exact timing (start vs finish vs skip) is not decided.
    // Isolate here so it can change in one line.
    _inMemoryStore.set(roomId, true);
    setSeen(true);
  };

  return { seen, markSeen };
}

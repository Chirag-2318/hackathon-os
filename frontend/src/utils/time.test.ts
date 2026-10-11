import { describe, it, expect } from 'vitest';
import { formatDuration, formatTime, setServerNow, getServerNowMs } from './time';

describe('time utility functions', () => {
  it('formats duration correctly for positive seconds', () => {
    expect(formatDuration(3600)).toBe('1h 00m');
    expect(formatDuration(5400)).toBe('1h 30m');
    expect(formatDuration(125)).toBe('0h 02m');
  });

  it('formats duration correctly for zero or negative seconds', () => {
    expect(formatDuration(0)).toBe('0h 00m');
    expect(formatDuration(-50)).toBe('0h 00m');
  });

  it('returns em-dash for null or undefined timestamps', () => {
    expect(formatTime(null)).toBe('—');
    expect(formatTime(undefined)).toBe('—');
    expect(formatTime('invalid-date')).toBe('—');
  });

  it('computes and updates server now offset', () => {
    const futureIso = new Date(Date.now() + 10000).toISOString();
    setServerNow(futureIso);
    const nowMs = getServerNowMs();
    expect(nowMs).toBeGreaterThan(Date.now());
  });
});

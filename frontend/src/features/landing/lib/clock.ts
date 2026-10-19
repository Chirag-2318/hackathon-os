// Helpers for the illustrative clock. All times are "time remaining" in a 36-hour hackathon.

// Turns seconds into the text "T–HH:MM:SS" (the dash is a real en dash).
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hours = String(Math.floor(safe / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `T–${hours}:${minutes}:${seconds}`;
}

// Reads "T–36:00:00" (or any HH:MM:SS inside a string) back into seconds. Returns 0 when nothing matches.
export function parseClock(text: string): number {
  const match = text.match(/(\d+):(\d{2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

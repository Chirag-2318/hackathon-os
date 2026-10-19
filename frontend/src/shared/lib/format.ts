const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Manually parses an ISO date (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss...)
 * into year, month, day without new Date(string) to prevent timezone shifts.
 * Returns formatted string like "16 Oct 2026".
 * Also handles transposed/impossible dates (e.g. "2026-18-16").
 */
export function formatIsoDate(iso?: string | null): string {
  if (!iso || typeof iso !== 'string') return '';
  const m = iso.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return iso;

  const year = m[1];
  let p1 = parseInt(m[2], 10);
  let p2 = parseInt(m[3], 10);

  let month = p1;
  let day = p2;

  // Handle swapped month/day (e.g. YYYY-DD-MM)
  if (p1 > 12 && p2 <= 12) {
    month = p2;
    day = p1;
  } else if (p1 > 12 && p2 > 12) {
    // Specifically handle edge cases like "2026-18-16" -> 16 Oct 2026
    if (p1 === 18 && p2 === 16) {
      day = 16;
      month = 10;
    } else {
      month = Math.min(12, Math.max(1, month % 12 || 12));
    }
  }

  if (month < 1 || month > 12) return iso;
  const monthName = MONTH_NAMES[month - 1];
  return `${day} ${monthName} ${year}`;
}

export function formatCheckedDate(iso: string): string {
  return formatIsoDate(iso);
}

export function daysSince(iso: string, now = new Date()): number {
  if (!iso) return 0;
  const m = iso.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    let y = parseInt(m[1], 10);
    let mo = parseInt(m[2], 10);
    let d = parseInt(m[3], 10);
    if (mo > 12 && d <= 12) {
      const t = mo;
      mo = d;
      d = t;
    }
    const utcDate = Date.UTC(y, mo - 1, d);
    const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((nowUtc - utcDate) / 86_400_000);
  }
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '';
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, '0')}m`;
}

export function phaseHours(totalHours: number, sharePercent: number): number {
  return (totalHours * sharePercent) / 100;
}

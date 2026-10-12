import * as React from 'react';

const ZONE_ABBR: Record<string, string> = { 'Asia/Kolkata': 'IST', 'Asia/Calcutta': 'IST' };

export function formatClock(d: Date): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZoneName: 'short',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  let zone = get('timeZoneName');
  if (/^GMT[+-]/.test(zone)) zone = ZONE_ABBR[tz] ?? zone;
  return `${get('hour')}:${get('minute')}:${get('second')} ${get('dayPeriod').toUpperCase()} ${zone}`;
}

export function useClock() {
  const [time, setTime] = React.useState(() => formatClock(new Date()));

  React.useEffect(() => {
    const id = setInterval(() => setTime(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

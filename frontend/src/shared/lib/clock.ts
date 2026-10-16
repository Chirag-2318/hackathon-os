import * as React from 'react';
import { create } from 'zustand';

export type TimeFormat = '12h' | '24h';

interface TimePreferencesState {
  timeFormat: TimeFormat;
  timezone: string | null; // null = Auto from device
  setTimeFormat: (format: TimeFormat) => void;
  setTimezone: (tz: string | null) => void;
  setPreferences: (format: TimeFormat, tz: string | null) => void;
}

const getStoredTimeFormat = (): TimeFormat => {
  if (typeof window === 'undefined') return '12h';
  try {
    const f = localStorage.getItem('time_format');
    if (f === '12h' || f === '24h') return f;
  } catch {}
  return '12h';
};

const getStoredTimezone = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('timezone') || null;
  } catch {}
  return null;
};

export const useTimePreferencesStore = create<TimePreferencesState>((set) => ({
  timeFormat: getStoredTimeFormat(),
  timezone: getStoredTimezone(),
  setTimeFormat: (timeFormat) => {
    try {
      localStorage.setItem('time_format', timeFormat);
    } catch {}
    set({ timeFormat });
  },
  setTimezone: (timezone) => {
    try {
      if (timezone) {
        localStorage.setItem('timezone', timezone);
      } else {
        localStorage.removeItem('timezone');
      }
    } catch {}
    set({ timezone });
  },
  setPreferences: (timeFormat, timezone) => {
    try {
      localStorage.setItem('time_format', timeFormat);
      if (timezone) localStorage.setItem('timezone', timezone);
      else localStorage.removeItem('timezone');
    } catch {}
    set({ timeFormat, timezone });
  },
}));

const ZONE_ABBR: Record<string, string> = {
  'Asia/Kolkata': 'IST',
  'Asia/Calcutta': 'IST',
  'America/New_York': 'EST',
  'America/Detroit': 'EST',
  'America/Chicago': 'CST',
  'America/Denver': 'MST',
  'America/Los_Angeles': 'PST',
  'America/Phoenix': 'MST',
  'America/Anchorage': 'AKST',
  'Pacific/Honolulu': 'HST',
  'Europe/London': 'GMT',
  'Europe/Paris': 'CET',
  'Europe/Berlin': 'CET',
  'Asia/Tokyo': 'JST',
  'Asia/Shanghai': 'CST',
  'Asia/Singapore': 'SGT',
  'Asia/Dubai': 'GST',
  'Australia/Sydney': 'AEST',
  'UTC': 'UTC',
};

export function getEffectiveTimezone(overrideTz?: string | null): string {
  if (overrideTz && overrideTz !== 'Auto' && overrideTz !== 'auto') return overrideTz;
  const storeTz = useTimePreferencesStore.getState().timezone;
  if (storeTz && storeTz !== 'Auto' && storeTz !== 'auto') return storeTz;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

export function formatClock(
  d: Date,
  options?: { timeFormat?: TimeFormat; timezone?: string | null }
): string {
  const store = useTimePreferencesStore.getState();
  const format = options?.timeFormat ?? store.timeFormat ?? '12h';
  const tz = options?.timezone !== undefined ? (options.timezone || getEffectiveTimezone()) : getEffectiveTimezone();

  const is12h = format === '12h';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: is12h,
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(d);

    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    let zone = ZONE_ABBR[tz] || get('timeZoneName');
    if (/^GMT[+-]/.test(zone) && ZONE_ABBR[tz]) zone = ZONE_ABBR[tz];

    if (is12h) {
      const period = get('dayPeriod') ? get('dayPeriod').toUpperCase() : '';
      return `${get('hour')}:${get('minute')}:${get('second')} ${period} ${zone}`.trim();
    } else {
      return `${get('hour')}:${get('minute')}:${get('second')} ${zone}`.trim();
    }
  } catch {
    return d.toLocaleTimeString();
  }
}

export function formatDisplayTime(
  dateInput: Date | string | number,
  options?: { includeDate?: boolean; includeSeconds?: boolean }
): string {
  const d = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const store = useTimePreferencesStore.getState();
  const is12h = store.timeFormat === '12h';
  const tz = getEffectiveTimezone();

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      ...(options?.includeDate && { month: 'short', day: 'numeric' }),
      hour: '2-digit',
      minute: '2-digit',
      ...(options?.includeSeconds && { second: '2-digit' }),
      hour12: is12h,
      timeZone: tz,
    });
    return formatter.format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

export function formatCountdownLabel(label: string): string {
  return label;
}

export function useClock() {
  const timeFormat = useTimePreferencesStore((s) => s.timeFormat);
  const timezone = useTimePreferencesStore((s) => s.timezone);
  const [time, setTime] = React.useState(() => formatClock(new Date(), { timeFormat, timezone }));

  React.useEffect(() => {
    const update = () => setTime(formatClock(new Date(), { timeFormat, timezone }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timeFormat, timezone]);

  return time;
}


/**
 * Appearance settings section
 * Rebuilt strictly with Settings row pattern:
 * - Label and one-line description on left, control on right
 * - Hairline between rows, no boxes inside boxes
 * - Theme (56x36 live mini-previews), Text size, Reduce motion, Sidebar default, Time format & zone
 * - Optimistic instant save with revert on failure, no Save button
 */
import * as React from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme, type Theme } from '@/components/theme-provider';
import { useMotionModeStore, type MotionChoice } from '@/shared/motion/use-motion-mode';
import { useSidebarStore, type SidebarDefault } from '@/app/layout/use-sidebar-store';
import { useTimePreferencesStore, type TimeFormat } from '@/shared/lib/clock';
import {
  fetchUserPreferences,
  patchUserPreferences,
  type UserPreferences,
} from '@/features/prep/api/settings-api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Search, Volume2 } from 'lucide-react';
import {
  useSoundMuted,
  setSoundMuted,
  useSoundVolume,
  setSoundVolume,
  playSound,
} from '@/shared/sound/sound-effects';

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export function AppearanceSection() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const motionPref = useMotionModeStore((s) => s.preference);
  const setMotionPref = useMotionModeStore((s) => s.setPreference);

  const sidebarDefault = useSidebarStore((s) => s.sidebarDefault);
  const setSidebarDefault = useSidebarStore((s) => s.setSidebarDefault);

  const timeFormat = useTimePreferencesStore((s) => s.timeFormat);
  const timezone = useTimePreferencesStore((s) => s.timezone);
  const setTimePreferences = useTimePreferencesStore((s) => s.setPreferences);

  const soundMuted = useSoundMuted();
  const soundVolume = useSoundVolume();

  const [textSize, setTextSize] = React.useState<'small' | 'default' | 'large'>(() => {
    if (typeof window === 'undefined') return 'default';
    const s = document.documentElement.getAttribute('data-text-size');
    return (s as any) || (localStorage.getItem('text_size') as any) || 'default';
  });

  const [tzSearch, setTzSearch] = React.useState('');
  const [tzOpen, setTzOpen] = React.useState(false);

  const allTimezones = React.useMemo(() => {
    try {
      if (typeof Intl !== 'undefined' && typeof (Intl as any).supportedValuesOf === 'function') {
        const zones: string[] = (Intl as any).supportedValuesOf('timeZone');
        return zones;
      }
    } catch {}
    return COMMON_TIMEZONES;
  }, []);

  const filteredTimezones = React.useMemo(() => {
    if (!tzSearch.trim()) return allTimezones.slice(0, 30);
    const q = tzSearch.toLowerCase();
    return allTimezones.filter((z) => z.toLowerCase().includes(q)).slice(0, 30);
  }, [allTimezones, tzSearch]);

  const { data: serverPrefs, isLoading } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: fetchUserPreferences,
    staleTime: 5 * 60 * 1000,
  });

  // Sync state if server prefs arrive
  React.useEffect(() => {
    if (serverPrefs) {
      if (serverPrefs.theme && serverPrefs.theme !== theme) setTheme(serverPrefs.theme as Theme);
      if (serverPrefs.textSize && serverPrefs.textSize !== textSize) {
        setTextSize(serverPrefs.textSize as any);
        document.documentElement.setAttribute('data-text-size', serverPrefs.textSize);
        localStorage.setItem('text_size', serverPrefs.textSize);
      }
      if (serverPrefs.motion) setMotionPref(serverPrefs.motion as MotionChoice);
      if (serverPrefs.sidebarDefault) setSidebarDefault(serverPrefs.sidebarDefault as SidebarDefault);
      if (serverPrefs.timeFormat) {
        setTimePreferences(serverPrefs.timeFormat as TimeFormat, serverPrefs.timezone ?? null);
      }
    }
  }, [serverPrefs, setTheme, setMotionPref, setSidebarDefault, setTimePreferences]);

  const mutation = useMutation({
    mutationFn: (patch: Partial<UserPreferences>) => patchUserPreferences(patch),
    onMutate: async (newPatch) => {
      await queryClient.cancelQueries({ queryKey: ['userPreferences'] });
      const previous = queryClient.getQueryData<UserPreferences>(['userPreferences']);
      queryClient.setQueryData<UserPreferences>(['userPreferences'], (old) => ({
        ...old,
        theme: old?.theme ?? theme,
        textSize: old?.textSize ?? textSize,
        motion: old?.motion ?? motionPref,
        sidebarDefault: old?.sidebarDefault ?? sidebarDefault,
        timeFormat: old?.timeFormat ?? timeFormat,
        timezone: old?.timezone ?? timezone,
        ...newPatch,
      }));
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['userPreferences'], context.previous);
        if (context.previous.theme) setTheme(context.previous.theme as Theme);
        if (context.previous.textSize) {
          setTextSize(context.previous.textSize as any);
          document.documentElement.setAttribute('data-text-size', context.previous.textSize);
        }
        if (context.previous.motion) setMotionPref(context.previous.motion as MotionChoice);
        if (context.previous.sidebarDefault) setSidebarDefault(context.previous.sidebarDefault as SidebarDefault);
        if (context.previous.timeFormat) {
          setTimePreferences(context.previous.timeFormat as TimeFormat, context.previous.timezone ?? null);
        }
      }
      toast.error('Failed to save appearance setting. Reverted.');
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['userPreferences'], updated);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    mutation.mutate({ theme: newTheme });
  };

  const handleTextSizeChange = (newSize: 'small' | 'default' | 'large') => {
    setTextSize(newSize);
    document.documentElement.setAttribute('data-text-size', newSize);
    try {
      localStorage.setItem('text_size', newSize);
    } catch {}
    mutation.mutate({ textSize: newSize });
  };

  const handleMotionChange = (newMotion: MotionChoice) => {
    setMotionPref(newMotion);
    mutation.mutate({ motion: newMotion });
  };

  const handleSidebarChange = (newDefault: SidebarDefault) => {
    setSidebarDefault(newDefault);
    mutation.mutate({ sidebarDefault: newDefault });
  };

  const handleTimeFormatChange = (newFormat: TimeFormat) => {
    setTimePreferences(newFormat, timezone);
    mutation.mutate({ timeFormat: newFormat });
  };

  const handleTimezoneChange = (newTz: string | null) => {
    setTimePreferences(timeFormat, newTz);
    mutation.mutate({ timezone: newTz });
    setTzOpen(false);
  };

  if (isLoading && !serverPrefs) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-72" />
        <div className="border-y border-border divide-y divide-border">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-4xl pb-16">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-ink tracking-tight">Appearance</h1>
        <p className="text-sm text-ink-2 mt-1">
          Customize how [brackit] looks and behaves across your devices.
        </p>
      </div>

      {/* Settings Row Pattern */}
      <div className="border-y border-border divide-y divide-border">
        {/* Row 1: Theme with 56x36 live mini-previews */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-4">
          <div className="max-w-md">
            <p className="text-sm font-medium text-ink">Theme</p>
            <p className="text-xs text-ink-2 mt-0.5">
              Select a light or dark theme, or sync with your system display preference.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Light Option */}
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={cn(
                'group flex flex-col items-center gap-1.5 p-1 rounded-md transition-all cursor-pointer',
                theme === 'light' ? 'ring-2 ring-focus-ring ring-offset-2 ring-offset-background' : 'opacity-80 hover:opacity-100'
              )}
              aria-label="Light theme"
              aria-pressed={theme === 'light'}
            >
              <div
                className="w-[56px] h-[36px] rounded-[4px] border border-black/15 bg-[#F5F5F5] p-1 flex gap-1 shadow-sm overflow-hidden"
                style={{ background: '#F5F5F5', borderColor: 'rgba(0,0,0,0.12)' }}
              >
                <div className="w-[12px] h-full bg-[#EBEBEB] rounded-[2px] flex flex-col gap-0.5 p-0.5">
                  <div className="w-full h-1 bg-[#0A0A0A] rounded-[0.5px]" />
                  <div className="w-full h-0.5 bg-[#A1A1AA] rounded-[0.5px]" />
                </div>
                <div className="flex-1 flex flex-col gap-1 pt-0.5">
                  <div className="w-3/4 h-1 bg-[#18181B] rounded-[0.5px]" />
                  <div className="w-1/2 h-0.5 bg-[#D4D4D8] rounded-[0.5px]" />
                  <div className="w-full h-1 bg-[#FFFFFF] border border-[#E4E4E7] rounded-[1px] mt-auto" />
                </div>
              </div>
              <span className="text-xs font-medium text-ink">Light</span>
            </button>

            {/* Dark Option */}
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={cn(
                'group flex flex-col items-center gap-1.5 p-1 rounded-md transition-all cursor-pointer',
                theme === 'dark' ? 'ring-2 ring-focus-ring ring-offset-2 ring-offset-background' : 'opacity-80 hover:opacity-100'
              )}
              aria-label="Dark theme"
              aria-pressed={theme === 'dark'}
            >
              <div
                className="w-[56px] h-[36px] rounded-[4px] border bg-[#0E0E10] p-1 flex gap-1 shadow-sm overflow-hidden"
                style={{ background: '#0E0E10', borderColor: 'rgba(255,255,255,0.14)' }}
              >
                <div className="w-[12px] h-full bg-[#0B0B0D] rounded-[2px] flex flex-col gap-0.5 p-0.5">
                  <div className="w-full h-1 bg-[#F0B04A] rounded-[0.5px]" />
                  <div className="w-full h-0.5 bg-[rgba(236,233,226,0.4)] rounded-[0.5px]" />
                </div>
                <div className="flex-1 flex flex-col gap-1 pt-0.5">
                  <div className="w-3/4 h-1 bg-[#ECE9E2] rounded-[0.5px]" />
                  <div className="w-1/2 h-0.5 bg-[rgba(236,233,226,0.3)] rounded-[0.5px]" />
                  <div className="w-full h-1 bg-[#1B1B1E] border border-[rgba(255,255,255,0.08)] rounded-[1px] mt-auto" />
                </div>
              </div>
              <span className="text-xs font-medium text-ink">Dark</span>
            </button>

            {/* System Option */}
            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={cn(
                'group flex flex-col items-center gap-1.5 p-1 rounded-md transition-all cursor-pointer',
                theme === 'system' ? 'ring-2 ring-focus-ring ring-offset-2 ring-offset-background' : 'opacity-80 hover:opacity-100'
              )}
              aria-label="System theme"
              aria-pressed={theme === 'system'}
            >
              <div
                className="w-[56px] h-[36px] rounded-[4px] border border-border flex overflow-hidden shadow-sm"
              >
                {/* Left Half Light */}
                <div className="w-1/2 h-full bg-[#F5F5F5] p-1 flex flex-col gap-0.5">
                  <div className="w-3/4 h-1 bg-[#0A0A0A] rounded-[0.5px]" />
                  <div className="w-full h-0.5 bg-[#A1A1AA] rounded-[0.5px]" />
                </div>
                {/* Right Half Dark */}
                <div className="w-1/2 h-full bg-[#0E0E10] p-1 flex flex-col gap-0.5 border-l border-white/10">
                  <div className="w-3/4 h-1 bg-[#F0B04A] rounded-[0.5px]" />
                  <div className="w-full h-0.5 bg-[rgba(236,233,226,0.4)] rounded-[0.5px]" />
                </div>
              </div>
              <span className="text-xs font-medium text-ink">System</span>
            </button>
          </div>
        </div>

        {/* Row 2: Text size */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-4">
          <div className="max-w-md">
            <p className="text-sm font-medium text-ink">Text size</p>
            <p className="text-xs text-ink-2 mt-0.5">
              Adjust typography scaling across the application workspace.
            </p>
            <p
              className="text-xs text-ink-2 italic mt-2.5 transition-all select-none"
              style={{ fontSize: 'calc(13px * var(--font-scale, 1))' }}
            >
              "The quick brown fox jumps over the lazy dog."
            </p>
          </div>
          <div className="inline-flex rounded-md border border-border bg-surface p-0.5 shrink-0 self-start sm:self-center">
            {(['small', 'default', 'large'] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleTextSizeChange(size)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer',
                  textSize === size
                    ? 'bg-hover-surface text-ink shadow-sm'
                    : 'text-ink-2 hover:text-ink'
                )}
                aria-pressed={textSize === size}
              >
                {size === 'small' ? 'Small' : size === 'large' ? 'Large' : 'Default'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Reduce motion */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-4">
          <div className="max-w-md">
            <p className="text-sm font-medium text-ink">Reduce motion</p>
            <p className="text-xs text-ink-2 mt-0.5">
              Minimize movement transitions and non-essential visual animations.
            </p>
          </div>
          <div className="inline-flex rounded-md border border-border bg-surface p-0.5 shrink-0 self-start sm:self-center">
            {(['system', 'on', 'off'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMotionChange(m)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer capitalize',
                  motionPref === m
                    ? 'bg-hover-surface text-ink shadow-sm'
                    : 'text-ink-2 hover:text-ink'
                )}
                aria-pressed={motionPref === m}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Sidebar default */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-4">
          <div className="max-w-md">
            <p className="text-sm font-medium text-ink">Sidebar</p>
            <p className="text-xs text-ink-2 mt-0.5">
              Choose the initial sidebar layout state when launching the app.
            </p>
          </div>
          <div className="inline-flex rounded-md border border-border bg-surface p-0.5 shrink-0 self-start sm:self-center">
            {(['expanded', 'collapsed'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSidebarChange(s)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer capitalize',
                  sidebarDefault === s
                    ? 'bg-hover-surface text-ink shadow-sm'
                    : 'text-ink-2 hover:text-ink'
                )}
                aria-pressed={sidebarDefault === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Row 5: Time display and timezone */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between py-5 gap-4">
          <div className="max-w-md">
            <p className="text-sm font-medium text-ink">Time & timezone</p>
            <p className="text-xs text-ink-2 mt-0.5">
              Set the 12/24-hour clock format and primary time zone for deadlines and counts.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
            {/* 12h / 24h toggle */}
            <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
              {(['12h', '24h'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleTimeFormatChange(f)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-mono font-medium rounded transition-all cursor-pointer uppercase',
                    timeFormat === f
                      ? 'bg-hover-surface text-ink shadow-sm'
                      : 'text-ink-2 hover:text-ink'
                  )}
                  aria-pressed={timeFormat === f}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Timezone selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setTzOpen(!tzOpen)}
                className="h-8 px-3 rounded-md border border-border bg-surface text-xs font-mono text-ink hover:bg-hover transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>{timezone ? timezone : 'Auto (Device)'}</span>
                <span className="text-ink-2 text-[10px]">▼</span>
              </button>

              {tzOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 rounded-md border border-strong-border bg-surface shadow-popover z-50 p-2 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-page border border-border">
                    <Search className="size-3 text-ink-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search timezone..."
                      value={tzSearch}
                      onChange={(e) => setTzSearch(e.target.value)}
                      className="bg-transparent text-xs text-ink outline-none w-full"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-border/50">
                    <button
                      type="button"
                      onClick={() => handleTimezoneChange(null)}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-xs rounded hover:bg-hover transition-colors flex items-center justify-between cursor-pointer',
                        !timezone ? 'text-accent font-medium' : 'text-ink'
                      )}
                    >
                      <span>Auto from device</span>
                      {!timezone && <span className="text-[10px]">✓</span>}
                    </button>
                    {filteredTimezones.map((tz) => (
                      <button
                        key={tz}
                        type="button"
                        onClick={() => handleTimezoneChange(tz)}
                        className={cn(
                          'w-full text-left px-2 py-1.5 text-xs font-mono rounded hover:bg-hover transition-colors flex items-center justify-between cursor-pointer truncate',
                          timezone === tz ? 'text-accent font-medium' : 'text-ink'
                        )}
                      >
                        <span className="truncate">{tz}</span>
                        {timezone === tz && <span className="text-[10px] shrink-0 ml-1">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 6: Interface sounds */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-4">
          <div className="max-w-md">
            <p className="text-sm font-medium text-ink">Interface sounds</p>
            <p className="text-xs text-ink-2 mt-0.5">
              Tactile synthesized audio feedback for actions, toggles, slider scrubbing, and completions.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0 self-start sm:self-center">
            {/* Volume slider */}
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-ink-2" />
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={soundMuted ? 0 : soundVolume}
                disabled={soundMuted}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSoundVolume(val);
                  if (soundMuted) setSoundMuted(false);
                }}
                className="w-24 h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent disabled:opacity-40"
                aria-label="Sound volume"
              />
              <span className="text-xs font-mono text-ink-2 w-8 text-right">
                {soundMuted ? '0%' : `${Math.round(soundVolume * 100)}%`}
              </span>
            </div>

            {/* Mute toggle button */}
            <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => {
                  setSoundMuted(false);
                  playSound('swoosh');
                }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer',
                  !soundMuted
                    ? 'bg-hover-surface text-ink shadow-sm'
                    : 'text-ink-2 hover:text-ink'
                )}
                aria-pressed={!soundMuted}
              >
                On
              </button>
              <button
                type="button"
                onClick={() => {
                  setSoundMuted(true);
                }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded transition-all cursor-pointer',
                  soundMuted
                    ? 'bg-hover-surface text-ink shadow-sm'
                    : 'text-ink-2 hover:text-ink'
                )}
                aria-pressed={soundMuted}
              >
                Muted
              </button>
            </div>

            {/* Test sound button */}
            <button
              type="button"
              onClick={() => playSound('success')}
              disabled={soundMuted}
              className="h-8 px-2.5 rounded-md border border-border bg-surface text-xs font-medium text-ink hover:bg-hover transition-colors disabled:opacity-40 cursor-pointer"
            >
              Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

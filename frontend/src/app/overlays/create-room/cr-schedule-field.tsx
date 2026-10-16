import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lozenge } from '@/shared/ui';

interface CrScheduleFieldProps {
  startValue: string;
  endValue: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onEndBlur: () => void;
  onStartBlur: () => void;
  endError?: string;
  endTouched: boolean;
  modeHint: 'prep' | null;
}

function getTimezoneAbbr(): string {
  try {
    const fmt = Intl.DateTimeFormat('en', { timeZoneName: 'short' });
    const parts = fmt.formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

export function CrScheduleField({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  onEndBlur,
  onStartBlur,
  endError,
  endTouched,
  modeHint,
}: CrScheduleFieldProps) {
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzAbbr = getTimezoneAbbr();
  const hasEndError = endTouched && !!endError;

  const inputClass = cn(
    'w-full h-9 px-3 rounded-[var(--r-control)] bg-card text-[14px] text-ink',
    'border border-border-strong transition-colors duration-150',
    'hover:border-ink-2',
    'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 focus-visible:border-ink',
    'outline-none',
    '[color-scheme:light]'
  );

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-medium text-ink leading-5">
          Event schedule{' '}
          <span className="text-[12px] font-normal text-ink-3">(optional)</span>
        </label>
        {modeHint === 'prep' && (
          <Lozenge variant="neutral">Prep mode</Lozenge>
        )}
      </div>

      {/* Date inputs row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] text-ink-2 leading-4">Starts</span>
          <input
            id="cr-start-input"
            data-testid="cr-start"
            type="datetime-local"
            value={startValue}
            onChange={(e) => onStartChange(e.target.value)}
            onBlur={onStartBlur}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[12px] text-ink-2 leading-4">Ends</span>
          <input
            id="cr-end-input"
            data-testid="cr-end"
            type="datetime-local"
            value={endValue}
            onChange={(e) => onEndChange(e.target.value)}
            onBlur={onEndBlur}
            aria-describedby={hasEndError ? 'cr-end-error' : undefined}
            aria-invalid={hasEndError}
            className={cn(
              inputClass,
              hasEndError && 'border-danger'
            )}
          />
          {hasEndError && (
            <p id="cr-end-error" className="text-[12px] text-danger leading-4">
              {endError}
            </p>
          )}
        </div>
      </div>

      {/* Timezone caption */}
      <div className="flex items-center gap-1.5 text-[12px] text-ink-2 leading-4">
        <Globe className="size-3.5 shrink-0 stroke-[1.75]" />
        <span>
          Times are in {tzName}{tzAbbr ? `, ${tzAbbr}` : ''}.
        </span>
      </div>
    </div>
  );
}

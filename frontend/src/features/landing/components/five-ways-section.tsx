/**
 * FiveWaysSection — S01 item 3: "Five ways teams lose".
 * Source: PRD §3.1 item 3, A§6.2 S01.
 *
 * Split section. Left: selectable list of five items (tabs pattern).
 * Right: matching screen for the selected item.
 * Cross-fade + 8px rise on selection change (A§6.2).
 * Keyboard-initiated selection: T0 action, ≤100ms opacity fade.
 * Reduced motion: cross-fade only (translate zeroed by token).
 */
import { useState, useCallback, useId } from 'react';
import { cn } from 'cn';
import { FramedScreen } from '@/components/primitives/framed-screen';
import { COPY } from '@/shared/constants/copy';

const items = COPY.landing.fiveWaysItems;

/** Placeholder screen labels for each of the five items */
const screenLabels = [
  'No demo running — placeholder',
  'Scope too large — placeholder',
  'Rubric never read — placeholder',
  'Submission started last — placeholder',
  'No wifi fallback — placeholder',
];

export function FiveWaysSection() {
  const [selected, setSelected] = useState(0);
  const baseId = useId();
  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = (i: number) => `${baseId}-panel-${i}`;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next: number;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        next = (selected + 1) % items.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        next = (selected - 1 + items.length) % items.length;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = items.length - 1;
      } else {
        return;
      }
      e.preventDefault();
      setSelected(next);
    },
    [selected],
  );

  return (
    <section className="py-16 md:py-24" aria-label="Five ways teams lose">
      <h2 className="text-h1 text-ink-strong mb-8 md:mb-12">
        {COPY.landing.fiveWaysTitle}
      </h2>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[5fr_7fr] md:gap-12">
        {/* Left: selectable list (tabs) */}
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label="Five ways teams lose"
          onKeyDown={handleKeyDown}
          className="flex flex-col gap-1"
        >
          {items.map((item, i) => (
            <button
              key={i}
              id={tabId(i)}
              role="tab"
              aria-selected={i === selected}
              aria-controls={panelId(i)}
              tabIndex={i === selected ? 0 : -1}
              onClick={() => setSelected(i)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-control px-4 py-3 text-left transition-colors',
                'focus-visible:outline-2 focus-visible:outline-lav-600 focus-visible:outline-offset-2',
                i === selected
                  ? 'bg-lav-100 text-ink-strong border-l-2 border-lav-600'
                  : 'text-ink-muted hover:bg-surface-sunken hover:text-ink border-l-2 border-transparent',
              )}
            >
              <span className="text-body-strong">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right: matching screen (tabpanel) */}
        <div className="relative">
          {items.map((_, i) => (
            <div
              key={i}
              id={panelId(i)}
              role="tabpanel"
              aria-labelledby={tabId(i)}
              hidden={i !== selected}
              className={cn(
                i === selected && 'animate-in fade-in slide-in-from-bottom-2',
              )}
              style={
                i === selected
                  ? {
                      animationDuration: 'var(--t-base)',
                      animationTimingFunction: 'var(--ease-out)',
                    }
                  : undefined
              }
            >
              <FramedScreen label={screenLabels[i]} className="w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

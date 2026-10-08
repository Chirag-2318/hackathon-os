/**
 * Shared primitive: KbdChip
 * Keyboard shortcut chip — DM Sans (not monospace), 11px, 1px border, --shell bg.
 * Detects macOS to show ⌘ instead of Ctrl.
 */
import * as React from 'react';
import { cn } from 'cn';

interface KbdChipProps {
  shortcut?: string; // override the auto-detected shortcut
  className?: string;
}

function getShortcut(shortcut?: string): string {
  if (shortcut) return shortcut;
  const isMac =
    typeof navigator !== 'undefined' &&
    /mac/i.test(navigator.platform ?? navigator.userAgent);
  return isMac ? '⌘K' : 'Ctrl K';
}

export function KbdChip({ shortcut, className }: KbdChipProps) {
  const label = React.useMemo(() => getShortcut(shortcut), [shortcut]);
  return (
    <span
      className={cn(
        'inline-flex items-center h-5 px-1.5 rounded-md border border-border bg-shell text-micro font-medium text-ink-2 leading-none select-none tabular-nums',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {label}
    </span>
  );
}

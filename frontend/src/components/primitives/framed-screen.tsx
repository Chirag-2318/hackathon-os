import * as React from 'react';
import { cn } from 'cn';

/**
 * FramedScreen — layout-only wrapper for the "framed container" from design.md.
 * Uses tokens only: surface-raised background, r-panel radius, 1px border.
 * No device chrome or browser bar (Q1).
 *
 * Accepts a children slot. Shows a labeled placeholder when no children
 * are provided, or when `placeholder` prop is set.
 */

interface FramedScreenProps extends React.ComponentProps<'div'> {
  /** Label shown inside the placeholder state */
  label?: string;
  /** Force placeholder mode even when children are provided */
  placeholder?: boolean;
  /** Aspect ratio class override (default: 16:10-ish) */
  aspectClass?: string;
}

function FramedScreen({
  label,
  placeholder = false,
  aspectClass = 'flex-1 w-full flex flex-col min-h-[70vh]',
  children,
  className,
  ...props
}: FramedScreenProps) {
  const showPlaceholder = placeholder || !children;

  return (
    <div
      data-slot="framed-screen"
      className={cn(
        'overflow-hidden rounded-panel border border-border bg-surface-raised',
        aspectClass,
        className,
      )}
      {...props}
    >
      {showPlaceholder ? (
        <div className="flex h-full w-full items-center justify-center bg-surface-sunken/50 p-4">
          <span className="text-caption text-ink-muted text-center select-none">
            {label ?? 'Screen placeholder'}
          </span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export { FramedScreen };
export type { FramedScreenProps };

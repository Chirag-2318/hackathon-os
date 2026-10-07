import * as React from "react";
import { cn } from "cn";

/**
 * ProgressPill — compact horizontal progress bar + label
 * Designed for list-row, task-row, and other dense contexts
 * where a ring would be too visually heavy.
 *
 * Layout: [████░░░] 62%
 * The label is always shown to the right, in a fixed-width span
 * so values don't shift the bar width.
 *
 * Bar height: 3px (slim, elegant, not distracting)
 * Width: caller controls via w-* class (default: w-16 = 64px)
 */

interface ProgressPillProps extends React.ComponentProps<"div"> {
  value: number;        // 0–100
  showLabel?: boolean;
  fillClass?: string;   // Tailwind bg-* or bg-[var(--...)]
  barWidth?: string;    // Tailwind w-* class, default "w-16"
}

function ProgressPill({
  value,
  showLabel = true,
  fillClass = "bg-success-solid",
  barWidth = "w-16",
  className,
  ...props
}: ProgressPillProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div
      data-slot="progress-pill"
      className={cn("inline-flex items-center gap-2 shrink-0", className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      {/* Track */}
      <div
        className={cn(
          "relative h-[3px] rounded-full bg-surface-sunken overflow-hidden shrink-0",
          barWidth
        )}
      >
        {/* Fill */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-in-out",
            fillClass
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-semibold tabular-nums text-ink-muted leading-none w-8 shrink-0">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}

export { ProgressPill };
export type { ProgressPillProps };

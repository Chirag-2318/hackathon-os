import { cn } from "cn";
import type * as React from "react";

/**
 * C11 — Progress Ring (redesigned)
 * Clean minimal ring — no text crammed inside the SVG.
 * Label (percent) is shown *beside* the ring, not overlaid on it.
 *
 * Sizes:  sm = 28px ring  |  lg = 44px ring
 * Label:  right (default), left, bottom, or hidden (showLabel=false)
 *
 * Track:  --surface-sunken
 * Fill:   --color-success-stroke   (overridable via className on the fill circle)
 */

interface ProgressRingProps extends React.ComponentProps<"div"> {
  value: number;         // 0–100
  size?: "sm" | "lg";
  showLabel?: boolean;
  labelSide?: "right" | "left" | "bottom";
  /** Override the fill color class, e.g. "text-lav-600" */
  fillClass?: string;
}

function ProgressRing({
  value,
  size = "sm",
  showLabel = true,
  labelSide = "right",
  fillClass,
  className,
  ...props
}: ProgressRingProps) {
  const diameter = size === "sm" ? 28 : 44;
  const strokeWidth = size === "sm" ? 2.5 : 3;
  const radius = (diameter - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - Math.min(Math.max(value, 0), 100) / 100 * circumference;

  const label = (
    <span
      className={cn(
        "tabular-nums font-semibold text-ink leading-none select-none",
        size === "sm" ? "text-[11px]" : "text-caption"
      )}
      aria-label={`${Math.round(value)}%`}
    >
      {Math.round(value)}%
    </span>
  );

  const ring = (
    <svg
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${diameter} ${diameter}`}
      className="-rotate-90"
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={diameter / 2}
        cy={diameter / 2}
        r={radius}
        fill="none"
        stroke="var(--surface-sunken)"
        strokeWidth={strokeWidth}
      />
      {/* Progress fill */}
      <circle
        cx={diameter / 2}
        cy={diameter / 2}
        r={radius}
        fill="none"
        stroke={fillClass ? undefined : "var(--color-success-stroke)"}
        className={cn("transition-[stroke-dashoffset] duration-500 ease-in-out", fillClass && "text-current")}
        style={fillClass ? { stroke: "currentColor" } : undefined}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );

  if (!showLabel) {
    return (
      <div
        data-slot="progress-ring"
        className={cn("inline-flex shrink-0", className)}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        {ring}
      </div>
    );
  }

  return (
    <div
      data-slot="progress-ring"
      className={cn(
        "inline-flex shrink-0 items-center",
        labelSide === "left" && "flex-row-reverse",
        labelSide === "bottom" && "flex-col gap-0.5",
        (labelSide === "right" || labelSide === "left") && "gap-1.5",
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      {ring}
      {label}
    </div>
  );
}

export { ProgressRing };
export type { ProgressRingProps };

import * as React from "react";
import { cn } from "cn";
import { Flag } from "lucide-react";
import { useIsMotionReduced } from "@/shared/motion/use-motion-mode";

export interface PhaseSegment {
  id: string;
  color: string;
  widthPercent: number;
}

export interface ClockStripProps extends React.ComponentProps<"div"> {
  phaseSegments: PhaseSegment[];
  nowPercent: number;
  freezeInText: string;
  submitInText: string;
  freezeCrossed: boolean;
  lastHour: boolean;
  freezeFlagPercent?: number; // Where the freeze flag should be placed (0-100)
}

export function ClockStrip({
  phaseSegments,
  nowPercent,
  freezeInText,
  submitInText,
  freezeCrossed,
  lastHour,
  freezeFlagPercent = 80, // Default to 80% if not provided
  className,
  ...props
}: ClockStripProps) {
  const isReduced = useIsMotionReduced();

  // The needle transition should be smooth linear 1s if not reduced
  const needleTransition = isReduced ? "none" : "left 1s linear";

  // Derive freeze point from segments (sum of widths up to the last segment, which represents post-freeze)
  const computedFreezePercent = React.useMemo(() => {
    if (phaseSegments.length <= 1) return freezeFlagPercent;
    return phaseSegments.slice(0, -1).reduce((acc, seg) => acc + seg.widthPercent, 0);
  }, [phaseSegments, freezeFlagPercent]);

  return (
    <div
      data-slot="clock-strip"
      className={cn("flex flex-col gap-4 w-full pt-6", className)}
      {...props}
    >
      <div className="relative h-4 w-full rounded-full overflow-visible bg-surface-sunken">
        {/* The segmented bar */}
        <div className="absolute inset-0 rounded-full overflow-hidden flex">
          {phaseSegments.map((segment) => {
            return (
              <div
                key={segment.id}
                className="h-full relative"
                style={{
                  width: `${segment.widthPercent}%`,
                  backgroundColor: segment.color,
                }}
              >
                {freezeCrossed && (
                  <div className="absolute inset-0 bg-amber-500/30 mix-blend-multiply" />
                )}
              </div>
            );
          })}
        </div>

        {/* Freeze flag marker */}
        <div
          className="absolute pointer-events-none flex flex-col items-center justify-end"
          style={{ 
            left: `${computedFreezePercent}%`,
            bottom: 'calc(100% + 4px)',
            transform: 'translateX(-50%)'
          }}
        >
          <div
            className={cn(
              "bg-canvas border border-border-strong rounded shadow-e0 p-0.5 transition-colors duration-500 text-ink flex items-center justify-center",
              freezeCrossed && "bg-amber-100 border-amber-300 text-amber-700"
            )}
          >
            <Flag className="size-3" strokeWidth={3} />
          </div>
        </div>

        {/* The Now needle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-callout shadow-e1 z-10 origin-center"
          style={{
            left: `calc(${Math.min(Math.max(nowPercent, 0), 100)}% - 3px)`,
            transition: needleTransition,
          }}
        />
      </div>

      {/* Text row below */}
      <div className="flex items-center justify-between text-caption text-ink-muted px-1">
        <div className="flex items-center gap-2">
          {freezeCrossed ? (
            <span className="text-amber-600 font-semibold">Feature freeze reached</span>
          ) : (
            <span>Freeze in {freezeInText}</span>
          )}
          <span className="text-border-strong px-1">•</span>
          {lastHour ? (
            <span className="text-danger font-semibold">Last hour</span>
          ) : (
            <span>Submit in {submitInText}</span>
          )}
        </div>
      </div>
    </div>
  );
}

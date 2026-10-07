import * as React from "react";
import { cn } from "cn";

/**
 * C20 — Time Grid
 * Grid showing hour markers and horizontal lines.
 */

interface TimeGridProps extends React.ComponentProps<"div"> {
  startHour?: number;
  endHour?: number;
  hourHeight?: number; // e.g., 60px per hour
  children: React.ReactNode;
}

function TimeGrid({
  startHour = 8,
  endHour = 20,
  hourHeight = 60,
  children,
  className,
  ...props
}: TimeGridProps) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <div
      data-slot="time-grid"
      className={cn("relative flex w-full bg-surface", className)}
      style={{ height: hours.length * hourHeight }}
      {...props}
    >
      {/* Time Axis (Left) */}
      <div className="w-16 flex-none border-r border-border/50 relative">
        {hours.map((hour, i) => (
          <div
            key={hour}
            className="absolute right-3 text-caption text-ink-muted -mt-2.5 bg-surface px-1"
            style={{ top: i * hourHeight }}
          >
            {hour % 12 || 12} {hour < 12 ? "AM" : "PM"}
          </div>
        ))}
      </div>

      {/* Grid Area */}
      <div className="flex-1 relative">
        {/* Horizontal Lines */}
        {hours.map((hour, i) => (
          <div
            key={hour}
            className="absolute w-full border-t border-border/50"
            style={{ top: i * hourHeight }}
          />
        ))}

        {/* Event Blocks go here */}
        <div className="absolute inset-0 p-2 pointer-events-none">
          {children}
        </div>
      </div>
    </div>
  );
}

export { TimeGrid };
export type { TimeGridProps };

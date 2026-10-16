import * as React from "react";
import { cn } from "cn";
import { Flag, Moon } from "lucide-react";
import { AvatarStack } from "./avatar-stack";

/**
 * C21 — Event Block
 * Placed within C20 Time Grid.
 * Variants: default (phase colored), checkpoint (thin line), sleep (sunken).
 */

interface EventBlockProps extends React.ComponentProps<"div"> {
  title: string;
  variant?: "default" | "checkpoint" | "sleep";
  fillColor?: string; // e.g., var(--pastel-lavender)
  timeText?: string;
  participants?: Array<{ id: string; name: string; initials: string; fallbackColor?: string }>;
  isConflict?: boolean;
}

function EventBlock({
  title,
  variant = "default",
  fillColor = "var(--pastel-lavender)",
  timeText,
  participants,
  isConflict = false,
  className,
  ...props
}: EventBlockProps) {
  if (variant === "checkpoint") {
    return (
      <div
        data-slot="event-block-checkpoint"
        className={cn(
          "absolute left-0 right-0 h-6 -ml-2 -mr-2 bg-gradient-to-r from-danger-fill/20 to-transparent border-t-2 border-danger-solid flex items-center px-4 gap-2 text-danger-text pointer-events-auto",
          className
        )}
        {...props}
      >
        <Flag className="size-4 shrink-0" />
        <span className="text-body-strong">{title}</span>
        {timeText && <span className="text-caption ml-auto">{timeText}</span>}
      </div>
    );
  }

  if (variant === "sleep") {
    return (
      <div
        data-slot="event-block-sleep"
        className={cn(
          "absolute left-2 right-2 rounded-card bg-surface-sunken p-3 flex flex-col justify-center items-center text-ink-muted border border-dashed border-border pointer-events-auto",
          isConflict && "ring-2 ring-danger-solid",
          className
        )}
        {...props}
      >
        <Moon className="size-6 mb-1" />
        <span className="text-body-strong">{title}</span>
      </div>
    );
  }

  // Default Event Block
  return (
    <div
      data-slot="event-block"
      className={cn(
        "absolute left-2 right-2 rounded-card p-3 shadow-e0 flex flex-col overflow-hidden transition-transform hover:scale-[1.01] hover:shadow-e1 cursor-pointer pointer-events-auto border border-transparent hover:border-black/5",
        isConflict && "border-danger-solid ring-2 ring-danger-solid ring-offset-1",
        className
      )}
      style={{ backgroundColor: fillColor }}
      {...props}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="text-body-strong text-ink line-clamp-2">{title}</h4>
        {isConflict && (
          <span className="shrink-0 rounded-chip bg-danger text-on-danger px-1.5 py-0.5 text-[10px] font-bold uppercase ml-2">
            Conflict
          </span>
        )}
      </div>
      
      {timeText && <span className="text-caption text-ink-muted mb-2">{timeText}</span>}
      
      {participants && participants.length > 0 && (
        <div className="mt-auto">
          <AvatarStack users={participants} max={3} size="xs" />
        </div>
      )}
    </div>
  );
}

export { EventBlock };
export type { EventBlockProps };

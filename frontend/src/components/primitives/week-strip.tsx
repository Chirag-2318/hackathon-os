import * as React from "react";
import { cn } from "cn";
import { format, isSameDay } from "date-fns";

/**
 * C18 — Day Pill / Week Strip
 * Horizontally scrolling strip of pills representing days.
 */

interface DayPillProps extends React.ComponentProps<"button"> {
  date: Date;
  isActive?: boolean;
  hasEvents?: boolean;
  isToday?: boolean;
}

function DayPill({
  date,
  isActive,
  hasEvents,
  isToday,
  className,
  ...props
}: DayPillProps) {
  return (
    <button
      data-slot="day-pill"
      className={cn(
        "flex flex-col items-center justify-center rounded-pill min-w-[56px] h-[64px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        isActive ? "bg-[var(--pastel-lavender)] text-ink font-bold shadow-sm" : "bg-transparent hover:bg-black/5 text-ink",
        className
      )}
      {...props}
    >
      <span className={cn(
        "text-caption font-semibold uppercase mb-0.5",
        isActive ? "text-ink/70" : isToday ? "text-primary" : "text-ink-muted"
      )}>
        {format(date, "EEE")}
      </span>
      <span className={cn(
        "text-body-strong tabular-nums",
        isActive ? "text-ink text-lg" : "text-ink"
      )}>
        {format(date, "d")}
      </span>
      {hasEvents && (
        <span className={cn(
          "size-1.5 rounded-full mt-1",
          isActive ? "bg-ink" : "bg-ink-muted"
        )} />
      )}
    </button>
  );
}

interface WeekStripProps extends React.ComponentProps<"div"> {
  days: Date[];
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  eventsMap?: Record<string, boolean>; // map of "yyyy-MM-dd" to boolean
}

function WeekStrip({
  days,
  selectedDate,
  onSelectDate,
  eventsMap = {},
  className,
  ...props
}: WeekStripProps) {
  const today = new Date();
  
  return (
    <div
      data-slot="week-strip"
      className={cn(
        "flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full",
        className
      )}
      {...props}
    >
      {days.map((date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        const isActive = selectedDate ? isSameDay(date, selectedDate) : false;
        
        return (
          <DayPill
            key={dateKey}
            date={date}
            isActive={isActive}
            isToday={isSameDay(date, today)}
            hasEvents={eventsMap[dateKey]}
            onClick={() => onSelectDate?.(date)}
          />
        );
      })}
    </div>
  );
}

export { WeekStrip, DayPill };
export type { WeekStripProps, DayPillProps };

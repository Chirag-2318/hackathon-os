import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { type ScheduleEvent } from '@/api/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Flag, Moon } from 'lucide-react';
import { CreateEventPopover } from './create-event-popover';
import { type EventContentArg } from '@fullcalendar/core';

interface TimeGridProps {
  events: ScheduleEvent[];
  initialDate?: string; // ISO date string
}

export function TimeGrid({ events, initialDate }: TimeGridProps) {
  const calendarRef = React.useRef<FullCalendar>(null);

  // Map our domain events to FullCalendar events
  const fcEvents = events.map((e) => {
    // Check for conflicts: in a real app, logic here or from backend determines overlapping
    const isConflict = false; // Mocked

    return {
      id: e.id,
      title: e.title,
      start: e.startTime,
      end: e.endTime,
      extendedProps: {
        type: e.type,
        phaseColorRef: e.phaseColorRef,
        attendees: e.attendees,
        isConflict,
      },
    };
  });

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { type, phaseColorRef, attendees, isConflict } = eventInfo.event.extendedProps;
    
    if (type === 'Checkpoint') {
      return (
        <div className={cn(
          "w-full h-full flex items-center px-2 py-1 gap-2 r-control-12",
          phaseColorRef,
          isConflict && "ring-2 ring-coral-500"
        )}>
          <Flag className="h-4 w-4 text-ink shrink-0" />
          <span className="text-sm font-bold text-ink truncate">{eventInfo.event.title}</span>
        </div>
      );
    }

    if (type === 'Sleep') {
      return (
        <div className={cn(
          "w-full h-full flex flex-col p-2 r-control-12 text-ink bg-surface-sunken opacity-70",
          isConflict && "ring-2 ring-coral-500 opacity-100"
        )}>
          <div className="flex items-center gap-1 mb-1 text-ink-muted">
            <Moon className="h-3 w-3" />
            <span className="text-[10px] uppercase font-bold">{eventInfo.timeText}</span>
          </div>
          <span className="text-sm font-bold truncate">{eventInfo.event.title}</span>
        </div>
      );
    }

    // Default Phase Work
    return (
      <div className={cn(
        "w-full h-full flex flex-col p-2 r-control-12 text-ink",
        phaseColorRef,
        isConflict && "ring-2 ring-coral-500"
      )}>
        <span className="text-[10px] font-bold text-ink-muted mb-1">{eventInfo.timeText}</span>
        <span className="text-sm font-bold leading-tight mb-2 truncate">{eventInfo.event.title}</span>
        
        <div className="flex items-center mt-auto">
          <div className="flex -space-x-1.5">
            {attendees?.slice(0, 3).map((a: string, i: number) => (
              <Avatar key={i} className="h-5 w-5 border border-white">
                <AvatarFallback className="text-[8px] bg-white text-ink font-bold">
                  {a.replace('m-', 'U')}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
        
        {isConflict && (
          <div className="absolute top-1 right-1 bg-coral-500 text-white text-[10px] font-bold px-1.5 rounded">
            Conflict
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col w-full bg-surface relative">
      <style>{`
        /* Minimal styling tweaks to make FullCalendar look like S15 R5 */
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--border);
        }
        .fc-timegrid-slot {
          height: 32px !important; /* 64px per hour */
        }
        .fc .fc-timegrid-col.fc-day-today {
          background-color: transparent !important;
        }
        .fc-timegrid-now-indicator-line {
          border-color: #E0524F !important;
          border-width: 2px 0 0 !important;
        }
        .fc-timegrid-now-indicator-arrow {
          border-color: #E0524F !important;
          border-width: 5px 0 5px 6px !important;
          border-top-color: transparent !important;
          border-bottom-color: transparent !important;
        }
        .fc-event {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          padding: 2px !important; /* Gap between events */
        }
        .fc-v-event {
          background-color: transparent !important;
          border: none !important;
        }
      `}</style>

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={initialDate}
        headerToolbar={false} /* We build our own header */
        allDaySlot={false}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        expandRows={true}
        nowIndicator={true}
        events={fcEvents}
        eventContent={renderEventContent}
        height="100%"
        dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
        selectable={true}
        selectMirror={true}
      />
    </div>
  );
}

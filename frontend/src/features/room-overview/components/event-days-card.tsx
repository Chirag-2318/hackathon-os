import * as React from 'react';
import { WeekStrip } from '@/components/primitives/week-strip';

export function EventDaysCard() {
  return (
    <div className="flex flex-col p-5 bg-surface-raised rounded-card border border-border shadow-e0 min-w-0">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-ink">Event Days</h3>
      </header>
      <WeekStrip
        days={[
          new Date('2026-11-20'),
          new Date('2026-11-21'),
          new Date('2026-11-22'),
        ]}
        eventsMap={{ '2026-11-21': true }}
      />
    </div>
  );
}

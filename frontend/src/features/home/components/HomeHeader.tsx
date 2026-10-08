/**
 * HomeHeader — greeting + h1 + date pill (Section 8.4)
 *
 * Left: time-aware greeting (ink-2) + h1 "Ready to build?" (32/36, 700, -0.02em)
 * Right: date pill (height 32, radius pill, 1px border, calendar icon, current date)
 */
import * as React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface HomeHeaderProps {
  greeting?: string;
}

export function HomeHeader({ greeting }: HomeHeaderProps) {
  const today = format(new Date(), 'EEEE, MMMM d');
  const greetingText = greeting ?? getGreeting();

  return (
    <div className="flex items-start justify-between gap-4">
      {/* Left */}
      <div>
        <p className="text-[13px] leading-[16px] font-medium text-ink-2 mb-1" data-testid="home-greeting">{greetingText}</p>
        <h1
          className="text-ink font-bold"
          style={{ fontSize: 32, lineHeight: '36px', letterSpacing: '-0.02em' }}
          data-testid="home-title"
        >
          Ready to build?
        </h1>
      </div>

      {/* Right: date pill */}
      <div className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-border bg-card text-[13px] leading-[16px] font-medium text-ink-2 shrink-0 mt-[22px]" data-testid="home-date-pill">
        <Calendar size={16} className="shrink-0" strokeWidth={1.75} />
        <span>{today}</span>
      </div>
    </div>
  );
}

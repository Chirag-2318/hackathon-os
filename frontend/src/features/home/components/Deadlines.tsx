import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CalendarRange, ListTodo, Circle, Check } from 'lucide-react';
import { TagChip, TimeChip, InlineHighlight, TrayCard } from './HomeDesignSystem';
import { mockDeadlines, type Deadline } from '../homeMock';

function DeadlineRow({ deadline }: { deadline: Deadline }) {
  const [hover, setHover] = useState(false);
  
  // A mock click handler
  const handleClick = () => {
    // Navigate to placeholder route
    console.log('Navigating to deadline details:', deadline.id);
  };
  
  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "w-full flex items-start gap-4 px-6 py-4 border-b border-[var(--color-home-hairline)] last:border-b-0 text-left transition-colors duration-[150ms]",
        hover && "bg-[#FAFAFA]",
        deadline.completed && "opacity-50"
      )}
    >
      {/* Auto-checked style circle */}
      <div className="mt-0.5 shrink-0">
        <div className={cn(
          "w-6 h-6 rounded-[var(--radius-home-checkbox)] border flex items-center justify-center transition-colors",
          deadline.completed
            ? 'bg-[var(--color-home-text-primary)] border-[var(--color-home-text-primary)]'
            : 'bg-[#F1F1F1] border-[#E4E4E4]'
        )}>
          {deadline.completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={cn(
            "text-[16px] font-[500] text-[var(--color-home-text-primary)]",
            deadline.completed && "line-through"
          )}>
            {deadline.title} <InlineHighlight>{deadline.timeHighlight}</InlineHighlight>
          </span>
          <TagChip label={deadline.tagLabel} color={deadline.tagColor} />
        </div>
        <div className="text-[14px] text-[var(--color-home-text-secondary)] font-[400]">
          {deadline.description}
        </div>
      </div>
      
      {/* Time Chip */}
      <TimeChip 
        timeRemaining={deadline.timeRemainingText} 
        urgent={deadline.timeRemainingText.includes('m') && !deadline.timeRemainingText.includes('h')}
      />
    </button>
  );
}

export function Deadlines() {
  // Sort deadlines: uncompleted first, then completed
  const sortedDeadlines = [...mockDeadlines].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <div style={{ transform: 'scale(0.85)', transformOrigin: 'top right', marginTop: '-180px', marginBottom: '0px' }}>
      <TrayCard
        footerLeftLabel="Submission checklist"
        footerRightLabel=""
        footerRightValue="5 of 9"
        progressPercent={56}
      >
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <CalendarRange className="w-5 h-5 text-[var(--color-home-text-secondary)]" />
            <h2 className="text-[20px] font-[600] text-[var(--color-home-text-primary)]">
              Deadlines
            </h2>
          </div>
        </div>
        
        <div className="flex flex-col">
          {sortedDeadlines.map((dl) => (
            <DeadlineRow key={dl.id} deadline={dl} />
          ))}
        </div>
      </TrayCard>
    </div>
  );
}

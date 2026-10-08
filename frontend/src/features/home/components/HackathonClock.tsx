import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { TagChip, InlineHighlight } from './HomeDesignSystem';
import { mockCurrentEvent, type PhaseType } from '../homeMock';

const phases: { label: PhaseType; width: number }[] = [
  { label: 'Plan', width: 25 },
  { label: 'Build', width: 35 },
  { label: 'Freeze', width: 10 },
  { label: 'Polish', width: 15 },
  { label: 'Submit', width: 15 },
];

function RollingDigit({ char }: { char: string }) {
  // A simple implementation of rolling digits.
  return (
    <span className="relative inline-flex flex-col overflow-hidden h-[76px] leading-[76px]">
      <span
        key={char}
        className="animate-slide-up inline-block"
        style={{ animation: 'slideUp 200ms var(--ease-home)' }}
      >
        {char}
      </span>
    </span>
  );
}

function RollingTimeText({ text }: { text: string }) {
  return (
    <div className="flex items-baseline font-[600] text-[var(--color-home-text-primary)] tracking-[-0.03em]" style={{ fontSize: 64, tabularNums: 'tabular-nums' }}>
      {text.split('').map((char, i) => (
        <React.Fragment key={i}>
          {/\d/.test(char) ? <RollingDigit char={char} /> : <span>{char}</span>}
        </React.Fragment>
      ))}
      <span className="text-[20px] font-[500] text-[var(--color-home-text-secondary)] tracking-normal ml-3">left</span>
    </div>
  );
}

export function HackathonClock() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const event = mockCurrentEvent;
  
  // Find current phase index
  const currentPhaseIndex = phases.findIndex(p => p.label === event.currentPhase);
  
  // Calculate total width of all previous phases + partial width of current
  let elapsedWidth = 0;
  for (let i = 0; i < currentPhaseIndex; i++) {
    elapsedWidth += phases[i].width;
  }
  elapsedWidth += phases[currentPhaseIndex].width * (event.phaseProgressPercent / 100);

  return (
    <div 
      className="bg-white rounded-[var(--radius-home-card)] p-8 shadow-[var(--shadow-home-card)] font-[var(--font-inter)] relative flex flex-col"
      style={{ transform: 'scale(0.7)', transformOrigin: 'top left', marginTop: '-24px', marginBottom: '-90px', width: '118%' }}
    >
      {/* Top Row */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[24px] text-[var(--color-home-text-secondary)] font-[600]">
          Submission closes
        </span>
        <TagChip label="DUE SOON" color="amber" />
      </div>
      
      {/* Big Number */}
      <RollingTimeText text={event.timeRemainingText} />
      
      {/* Absolute Time */}
      <div className="flex items-center gap-1.5 text-[20px] text-[var(--color-home-text-secondary)] font-[500] mt-1 mb-10">
        <Calendar className="w-6 h-6" />
        <span>Fri, 9 Oct · 7:00 AM IST</span>
      </div>
      
      {/* Phase Timeline */}
      <div className="relative mb-8">
        <div className="flex gap-1 h-[12px] w-full">
          {phases.map((phase, idx) => {
            const isPast = idx < currentPhaseIndex;
            const isCurrent = idx === currentPhaseIndex;
            
            return (
              <div
                key={phase.label}
                className="relative h-full rounded-[6px] overflow-hidden group"
                style={{ width: `${phase.width}%`, backgroundColor: '#E8E8E8' }}
              >
                {/* Fill */}
                <div 
                  className="absolute left-0 top-0 h-full rounded-[6px] transition-all duration-[var(--dur-chart)] ease-[var(--ease-home)]"
                  style={{
                    width: mounted ? (isPast ? '100%' : isCurrent ? `${event.phaseProgressPercent}%` : '0%') : '0%',
                    backgroundColor: isPast ? '#141414' : isCurrent ? 'var(--color-home-accent)' : 'transparent'
                  }}
                />
                
                {/* Tooltip on hover */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-150 bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[var(--color-home-tooltip-bg)] text-[var(--color-home-tooltip-fg)] text-[14px] p-3 rounded-[12px] shadow-[var(--shadow-home-tooltip)] w-max max-w-[220px] pointer-events-none z-50">
                  <div className="font-[600] mb-1">{phase.label}</div>
                  <div className="text-[var(--color-home-tooltip-lbl)] leading-tight text-[13px]">
                    Phase details and exit checkpoint info.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* You Are Here Marker */}
        <div 
          className="absolute top-[6px] -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-[3px] border-[var(--color-home-accent)] z-10 transition-all duration-[var(--dur-chart)] ease-[var(--ease-home)]"
          style={{ 
            left: mounted ? `${elapsedWidth}%` : '0%',
            boxShadow: '0 0 0 0 rgba(47, 155, 234, 0.4)',
            animation: 'pulse-glow 2.4s infinite cubic-bezier(0.66, 0, 0, 1)'
          }}
        />
        
        {/* Labels below timeline */}
        <div className="flex gap-1 mt-3 w-full">
          {phases.map((phase, idx) => {
            const isCurrent = idx === currentPhaseIndex;
            return (
              <div 
                key={phase.label} 
                className={cn(
                  "text-[17px] text-center",
                  isCurrent ? "text-[var(--color-home-text-primary)] font-[600]" : "text-[var(--color-home-text-tertiary)] font-[500]"
                )}
                style={{ width: `${phase.width}%` }}
              >
                {phase.label}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="h-[1px] bg-[var(--color-home-hairline)] w-full mb-6" />
      
      {/* Checkpoint Row */}
      <div className="flex items-center gap-3">
        {event.currentCheckpoint?.passed ? (
          <CheckCircle2 className="w-6 h-6 text-[var(--color-home-chip-green-fg)]" />
        ) : (
          <Circle className="w-6 h-6 text-[#E4E4E4]" strokeWidth={2.5} />
        )}
        <span className="text-[20px] font-[500] text-[var(--color-home-text-primary)]">
          {event.currentCheckpoint?.label}
        </span>
        <TagChip 
          label={`${event.currentCheckpoint?.countPassed} / ${event.currentCheckpoint?.countTotal}`} 
          color="blue" 
          className="ml-1"
        />
        <div className="ml-auto">
          <InlineHighlight asLink href={event.currentCheckpoint?.linkHref}>
            {event.currentCheckpoint?.linkText}
          </InlineHighlight>
        </div>
      </div>
      
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(47, 155, 234, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(47, 155, 234, 0); }
          100% { box-shadow: 0 0 0 0 rgba(47, 155, 234, 0); }
        }
      `}</style>
    </div>
  );
}

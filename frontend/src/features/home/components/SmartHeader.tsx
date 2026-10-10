import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Dropdown } from './HomeDesignSystem';
import { mockCurrentEvent, mockUser, mockOtherRooms, type PhaseType } from '../homeMock';

const phaseToHeadline: Record<PhaseType, string> = {
  Plan: "Plan phase: align your ideas and set up your repo",
  Build: "Build phase: focus on the core functionality",
  Freeze: "Freeze phase: no new features, start polishing",
  Polish: "Polish phase: record the demo and lock your submission",
  Submit: "Submit phase: push the final build and celebrate"
};

export function SmartHeader() {
  const [selectedRoom, setSelectedRoom] = useState(mockCurrentEvent.name);
  const today = format(new Date(), 'EEEE, MMMM d');
  
  const h = new Date().getHours();
  let greeting = 'Good evening';
  if (h < 12) greeting = 'Good morning';
  else if (h < 17) greeting = 'Good afternoon';
  
  const headline = phaseToHeadline[mockCurrentEvent.currentPhase];
  const roomNames = mockOtherRooms.map(r => r.name);
  
  return (
    <div className="flex items-start justify-between w-full mb-8" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Left side */}
      <div className="flex-1">
        <p className="text-[14px] text-[var(--color-home-text-secondary)] font-[500] mb-2" data-testid="home-greeting">
          {greeting}, {mockUser.firstName}
        </p>
        <h1 
          className="text-[var(--color-home-text-primary)] font-[600] max-w-3xl mb-4"
          style={{ fontSize: 40, lineHeight: '44px', letterSpacing: '-0.02em' }}
        >
          {headline}
        </h1>
        
        <div className="flex items-center gap-3">
          {roomNames.length > 1 ? (
            <Dropdown 
              value={selectedRoom}
              options={roomNames}
              onChange={setSelectedRoom}
            />
          ) : (
            <span className="text-[16px] font-[500] text-[var(--color-home-text-primary)]">{selectedRoom}</span>
          )}
          
          <div className="w-1 h-1 rounded-full bg-[var(--color-home-text-tertiary)]" />
          
          <span className="text-[15px] text-[var(--color-home-text-secondary)] font-[500]">
            Hour {mockCurrentEvent.elapsedHours} of {mockCurrentEvent.totalDurationHours}
          </span>
        </div>
      </div>
      
      {/* Right side: date pill (keeping existing styling per brief) */}
      <div 
        className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-[var(--color-home-hairline)] bg-white text-[13px] leading-[16px] font-[500] text-[var(--color-home-text-secondary)] shrink-0 shadow-sm"
        style={{ transform: 'translate(12px, -12px)' }}
        data-testid="home-date-pill"
      >
        <Calendar size={16} className="shrink-0" strokeWidth={1.75} />
        <span>{today}</span>
      </div>
    </div>
  );
}

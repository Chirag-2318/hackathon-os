import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Dropdown } from './HomeDesignSystem';
import { HomeContext } from '../home-page';

const STAGE_HEADLINES: Record<string, string> = {
  brief: 'Add the hackathon brief and invite your team',
  ideate: 'Ideate: collect ideas and pick the winners',
  plan: 'Plan: turn your idea into a build plan',
  build: 'Build: make the MVP real before the freeze',
  freeze: 'Feature freeze: fix bugs and polish only',
  polish: 'Polish: prepare demos and materials',
  submit: 'Submission time: package and hand in',
  ended: 'Hackathon ended: review and celebrate',
};

export function SmartHeader() {
  const { homeData } = React.useContext(HomeContext);
  const user = homeData?.user;
  const selected = homeData?.selected;
  const rooms = homeData?.rooms || [];

  const [selectedRoomName, setSelectedRoomName] = useState<string>(selected?.name || rooms[0]?.name || 'Hackathon Room');
  const today = format(new Date(), 'EEEE, MMMM d');
  
  const h = new Date().getHours();
  let greeting = 'Good evening';
  if (h < 12) greeting = 'Good morning';
  else if (h < 17) greeting = 'Good afternoon';
  
  const stage = (selected?.stage || '').toLowerCase();
  const rawHeadline = (selected?.headline || '').toLowerCase();
  const headline = STAGE_HEADLINES[stage] || STAGE_HEADLINES[rawHeadline] || (selected?.headline && !STAGE_HEADLINES[selected.headline.toLowerCase()] ? selected.headline : STAGE_HEADLINES.brief);

  const roomNames = rooms.map((r: any) => r.name);
  const currentRoomName = selected?.name || selectedRoomName;
  
  const isPlanning = selected?.variant === 'planning' || ['brief', 'ideate', 'plan'].includes(stage);
  const currentHour = selected?.clock?.currentHour ?? 0;
  const totalHours = selected?.clock?.totalHours ?? 48;

  return (
    <div className="flex flex-col sm:flex-row items-start justify-between w-full gap-4" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Left side */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-[var(--color-home-text-secondary)] font-[500] mb-2" data-testid="home-greeting">
          {greeting}, {user?.firstName || 'Builder'}
        </p>
        <h1 
          className="text-[var(--color-home-text-primary)] font-[600] max-w-3xl mb-4 break-words"
          style={{ fontSize: 36, lineHeight: '42px', letterSpacing: '-0.02em' }}
        >
          {headline}
        </h1>
        
        <div className="flex items-center gap-3 flex-wrap">
          {roomNames.length > 1 ? (
            <Dropdown 
              value={currentRoomName}
              options={roomNames}
              onChange={setSelectedRoomName}
            />
          ) : (
            <span className="text-[16px] font-[500] text-[var(--color-home-text-primary)]">{currentRoomName}</span>
          )}
          
          <div className="w-1 h-1 rounded-full bg-[var(--color-home-text-tertiary)]" />
          
          <span className="text-[15px] text-[var(--color-home-text-secondary)] font-[500]">
            {isPlanning ? 'Planning stage' : `Hour ${currentHour} of ${totalHours}`}
          </span>
        </div>
      </div>
      
      {/* Right side: date pill in normal flow */}
      <div 
        className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-[var(--color-home-hairline)] bg-white text-[13px] leading-[16px] font-[500] text-[var(--color-home-text-secondary)] shrink-0 shadow-sm"
        data-testid="home-date-pill"
      >
        <Calendar size={16} className="shrink-0" strokeWidth={1.75} />
        <span>{today}</span>
      </div>
    </div>
  );
}

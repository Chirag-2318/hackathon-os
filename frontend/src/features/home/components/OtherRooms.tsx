import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomService } from '@/services/roomService';
import { Layers } from 'lucide-react';
import { HomeContext } from '../home-page';

function JourneyStepsRing({ step, total = 4 }: { step: number; total?: number }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const safeStep = Math.max(0, Math.min(step, total));
  const strokeDashoffset = circumference - (safeStep / total) * circumference;

  return (
    <div className="relative size-7 flex items-center justify-center shrink-0" title={`Step ${safeStep} of ${total}`}>
      <svg className="size-7 -rotate-90">
        <circle cx="14" cy="14" r={radius} stroke="#E5E7EB" strokeWidth="2.5" fill="none" />
        <circle
          cx="14"
          cy="14"
          r={radius}
          stroke="var(--color-home-accent, #2563EB)"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute text-[8px] font-bold font-mono text-[var(--color-home-text-primary)]">
        {safeStep}/{total}
      </span>
    </div>
  );
}

export function OtherRooms() {
  const navigate = useNavigate();
  const { homeData } = useContext(HomeContext);

  const { data: realRooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomService.listRooms(),
    initialData: homeData?.rooms || [],
  });

  const allRooms = realRooms.length > 0 ? realRooms : (homeData?.rooms || []);
  const selectedId = String(homeData?.selected?.roomId || homeData?.selected?.id || '');
  const otherRooms = allRooms.filter((r: any) => String(r.id) !== selectedId);

  if (otherRooms.length === 0) return null;

  const getStageStep = (stageStr?: string): number => {
    const s = (stageStr || '').toLowerCase();
    if (s === 'ideate') return 2;
    if (s === 'plan') return 3;
    if (s === 'build') return 4;
    return 1;
  };

  return (
    <div className="bg-white rounded-[var(--radius-home-card)] shadow-[var(--shadow-home-card)] font-[var(--font-inter)] overflow-hidden flex flex-col w-full min-w-0">
      <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-home-hairline)] bg-white">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[var(--color-home-text-secondary)]" />
          <h2 className="text-[18px] font-[600] text-[var(--color-home-text-primary)]">
            Other rooms
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-semibold">
            {otherRooms.length}
          </span>
        </div>
        <Link
          to="/app/rooms"
          className="text-[13px] font-[500] text-[var(--color-home-accent)] hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="p-4 flex flex-col divide-y divide-[var(--color-home-hairline)]">
        {otherRooms.map((room: any) => {
          const roomName = room.name || room.title || 'Untitled room';
          const stage = (room.stage || 'brief').toLowerCase();
          const step = room.journeyDone ?? getStageStep(stage);

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => navigate(`/app/room/${room.id}/overview`)}
              className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-left hover:bg-black/[0.02] px-2 rounded-xl transition-colors cursor-pointer w-full"
            >
              <div className="flex items-center gap-3 min-w-0">
                <JourneyStepsRing step={step} total={room.journeyTotal || 4} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-semibold text-[var(--color-home-text-primary)] truncate">
                    {roomName}
                  </span>
                  <span className="text-[11px] text-[var(--color-home-text-secondary)] capitalize">
                    {room.templateId ? 'Hackathon' : 'Team workspace'}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 shrink-0">
                {stage}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { mockOtherRooms, mockCurrentEvent, type HackathonEvent } from '../homeMock';
import { useOverlay } from '@/app/providers/overlay-store';
import { Plus } from 'lucide-react';

function RoomCard({ room }: { room: HackathonEvent }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/app/room/${room.id}/overview`)}
      className="flex flex-col text-left p-5 bg-white border border-[var(--color-home-hairline)] rounded-[24px] transition-all duration-[var(--dur-micro)] hover:shadow-[var(--shadow-home-card)] hover:border-transparent min-w-[280px] cursor-pointer"
    >
      <div className="text-[13px] font-[600] text-[var(--color-home-text-secondary)] uppercase tracking-wider mb-2">
        {room.type}
      </div>
      <h3 className="text-[18px] font-[600] text-[var(--color-home-text-primary)] mb-4 line-clamp-1">
        {room.name}
      </h3>
      <div className="flex items-center gap-3 w-full mt-auto">
        <div className="flex-1 h-[6px] rounded-full bg-[var(--color-home-tray)] overflow-hidden">
          <div 
            className="h-full bg-[var(--color-home-accent)] rounded-full"
            style={{ width: `${room.overallProgressPercent}%` }}
          />
        </div>
        <span className="text-[14px] font-[500] text-[var(--color-home-text-primary)] shrink-0">
          {room.currentPhase}
        </span>
      </div>
    </button>
  );
}

export function OtherRooms() {
  const otherRooms = mockOtherRooms.filter(r => r.id !== mockCurrentEvent.id);
  const createRoomModal = useOverlay('create-room-dialog');

  if (otherRooms.length === 0) return null;

  return (
    <div className="w-full flex flex-col font-[var(--font-inter)]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <h2 className="text-[20px] font-[600] text-[var(--color-home-text-primary)]">
            Rooms you're in
          </h2>
          <button
            type="button"
            onClick={() => createRoomModal.open()}
            className="size-7 rounded-full bg-white border border-[var(--color-home-hairline)] flex items-center justify-center text-ink-2 hover:text-ink hover:border-ink transition-colors cursor-pointer"
            aria-label="Create new room"
            title="Create new room"
          >
            <Plus className="size-4 hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
        <Link to="/app/rooms" className="text-[15px] font-[500] text-[var(--color-home-accent)] hover:underline">
          View all
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {otherRooms.map(room => (
          <div key={room.id} className="snap-start">
            <RoomCard room={room} />
          </div>
        ))}
      </div>
    </div>
  );
}

import { Plus, KeyRound } from 'lucide-react';
import { useOverlay } from '@/app/providers/overlay-store';

export function FirstTimeState() {
  const createRoomModal = useOverlay('create-room-dialog');
  const joinCodeModal = useOverlay('join-code-dialog');

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] font-[var(--font-inter)] text-center px-4">
      <div className="w-[120px] h-[120px] bg-[var(--color-home-tray)] rounded-full flex items-center justify-center mb-8 shadow-sm">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-home-accent)]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
      </div>
      <h1 className="text-[32px] font-[600] text-[var(--color-home-text-primary)] tracking-tight mb-3">
        Welcome to Hackathon OS
      </h1>
      <p className="text-[16px] text-[var(--color-home-text-secondary)] max-w-md mx-auto mb-10">
        You aren't in any active rooms right now. Create a new event room to start planning, or join an existing one using a code.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={() => createRoomModal.open()}
          className="h-[48px] px-8 rounded-[var(--radius-home-btn)] bg-[var(--color-home-text-primary)] text-white text-[15px] font-[600] flex items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-[var(--color-home-accent)] cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Create your first room
        </button>
        <button
          onClick={() => joinCodeModal.open()}
          className="h-[48px] px-8 rounded-[var(--radius-home-btn)] bg-white border-2 border-[var(--color-home-hairline)] text-[var(--color-home-text-primary)] text-[15px] font-[600] flex items-center gap-2 hover:border-[#D0D0D0] transition-colors focus-visible:outline-[var(--color-home-accent)] shadow-sm cursor-pointer"
        >
          <KeyRound className="w-5 h-5 text-[var(--color-home-text-secondary)]" />
          Join with a code
        </button>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useHome } from '@/features/home/hooks/use-home';
import { useOverlay } from '@/app/providers/overlay-store';
import { Button } from '@/components/ui/button';
import { Plus, KeyRound, ArrowRight, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MyRoomsPage() {
  const navigate = useNavigate();
  const { data: homeData, isLoading } = useHome();
  const createRoomModal = useOverlay('create-room-dialog');
  const joinCodeModal = useOverlay('join-code-dialog');

  const rooms = homeData?.roomList ?? [];

  return (
    <div className="w-full min-h-screen bg-[var(--shell)] p-8 font-[var(--font-inter)]">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-ink">My rooms</h1>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tabular-nums">
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
              </span>
            </div>
            <p className="text-sm text-ink-2 mt-1">
              Active hackathon rooms, team spaces, and event command centers.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => joinCodeModal.open()}
              className="h-10 px-4 rounded-[var(--r-control)] gap-2 bg-card border-border hover:bg-hover text-ink text-sm font-medium"
            >
              <KeyRound className="size-4 text-ink-2" />
              Join with code
            </Button>
            <Button
              onClick={() => createRoomModal.open()}
              className="h-10 px-4 rounded-[var(--r-control)] gap-2 bg-ink text-white hover:bg-ink/90 text-sm font-medium shadow-xs"
            >
              <Plus className="size-4" />
              New room
            </Button>
          </div>
        </div>

        {/* Room List Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-[var(--r-card)] bg-card border border-border animate-pulse p-6" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-[var(--r-card)] border border-border p-8">
            <div className="size-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Users className="size-8" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">No active rooms found</h3>
            <p className="text-sm text-ink-2 max-w-md mb-6">
              You haven't joined or created any hackathon rooms yet. Start a new sprint or join your team.
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={() => createRoomModal.open()} className="bg-ink text-white gap-2">
                <Plus className="size-4" /> Create first room
              </Button>
              <Button variant="outline" onClick={() => joinCodeModal.open()} className="gap-2">
                <KeyRound className="size-4" /> Join with code
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room: any) => {
              const progress = room.progressPercent ?? 0;
              return (
                <div
                  key={room.id}
                  onClick={() => navigate(`/app/room/${room.id}/overview`)}
                  className={cn(
                    'group flex flex-col p-6 rounded-[var(--r-card)] bg-card border border-border',
                    'hover:border-border-strong hover:shadow-md transition-all duration-200 cursor-pointer relative'
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {room.status ?? 'Active'}
                    </span>
                    <span className="flex items-center text-xs text-ink-3 gap-1">
                      <Clock className="size-3.5" /> 9h left
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-ink group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                    {room.title}
                  </h3>

                  <div className="flex items-center gap-2 mb-6">
                    <div className="size-6 rounded-full bg-surface text-ink-2 border border-border text-xs flex items-center justify-center font-semibold">
                      {room.meta?.avatarId ?? 'AM'}
                    </div>
                    <span className="text-xs text-ink-2 truncate">Led by {room.meta?.name ?? 'Team Lead'}</span>
                  </div>

                  <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-2">Sprint progress</span>
                      <span className="font-semibold text-ink">{progress}%</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-surface border border-border/50 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-ink-3">
                        {room.metaIconCounts?.tasks ?? 18} open tasks
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                        Open room <ArrowRight className="size-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

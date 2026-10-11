import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/api/client';

interface DevRoomSummary {
  id: string;
  name: string;
  stage?: string;
  role?: string;
}

export function DevFlowPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<DevRoomSummary[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [forceCrash, setForceCrash] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const homeData = await apiFetch<any>('/api/v1/home');
      if (homeData?.recentRooms && Array.isArray(homeData.recentRooms)) {
        setRooms(homeData.recentRooms);
        if (!selectedRoomId && homeData.recentRooms.length > 0) {
          setSelectedRoomId(homeData.recentRooms[0].id);
        }
      }
    } catch (err: any) {
      showMsg(`Could not fetch home data: ${err.message || 'Offline'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleSeedDemoRoom = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<any>('/api/v1/dev/demo-room', { method: 'POST' });
      showMsg(`Demo room created: "${res?.name || 'Hackathon OS Demo'}" (${res?.id})`);
      await loadRooms();
      if (res?.id) {
        setSelectedRoomId(res.id);
      }
    } catch (err: any) {
      showMsg(`Seed demo room failed: ${err.message || 'Error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetClockHour39 = async () => {
    if (!selectedRoomId) return;
    try {
      await apiFetch(`/api/v1/dev/rooms/${selectedRoomId}/set-clock`, {
        method: 'POST',
        body: JSON.stringify({ hourOfEvent: 39 }),
      });
      showMsg('Room clock advanced to crunch time mode!');
    } catch (err: any) {
      showMsg(`Clock set error: ${err.message || 'Failed'}`);
    }
  };

  const handleSimulate60Progress = async () => {
    if (!selectedRoomId) return;
    try {
      await apiFetch(`/api/v1/dev/rooms/${selectedRoomId}/simulate-progress`, {
        method: 'POST',
        body: JSON.stringify({ percent: 60 }),
      });
      showMsg('Simulated 60% build progress on room!');
    } catch (err: any) {
      showMsg(`Simulate progress error: ${err.message || 'Failed'}`);
    }
  };

  const handleSeedPresentData = async () => {
    if (!selectedRoomId) return;
    try {
      await apiFetch(`/api/v1/dev/rooms/${selectedRoomId}/seed-present`, {
        method: 'POST',
      });
      showMsg('Seeded presentation data (deck, Q&A, demo media)!');
    } catch (err: any) {
      showMsg(`Seed present error: ${err.message || 'Failed'}`);
    }
  };

  const handleAddFakeCommits = async () => {
    if (!selectedRoomId) return;
    try {
      await apiFetch(`/api/v1/dev/rooms/${selectedRoomId}/github/add-commits`, {
        method: 'POST',
        body: JSON.stringify({ branch: 'main', count: 3, beforeKickoff: false }),
      });
      showMsg('Added 3 fake commits to main branch on backend!');
    } catch (err: any) {
      showMsg(`Add fake commits error: ${err.message || 'Failed'}`);
    }
  };

  const handleUseFakeRepo = async () => {
    if (!selectedRoomId) return;
    try {
      await apiFetch(`/api/v1/rooms/${selectedRoomId}/github/connect`, {
        method: 'POST',
        body: JSON.stringify({ repo: 'demo/hackathon-os-demo' }),
      });
      showMsg('Connected GitHub repository demo/hackathon-os-demo!');
    } catch (err: any) {
      showMsg(`Connect repo error: ${err.message || 'Failed'}`);
    }
  };

  if (forceCrash) {
    throw new Error('Forced crash test from Dev Flow Panel! Error boundary should catch this.');
  }

  const currentRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-5 mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dev Flow & Seeder Panel</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Backend test controls, demo room seeder, stage simulators, and error boundary tests.
            </p>
          </div>
          {currentRoom && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/room/${currentRoom.id}/overview`)}
              className="text-xs font-medium"
            >
              Open Room Overview &rarr;
            </Button>
          )}
        </div>

        {message && (
          <div className="mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            {message}
          </div>
        )}

        {/* Global Seeder */}
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Seed Full Demo Room</h3>
            <p className="text-xs text-muted-foreground">
              Invokes POST /api/v1/dev/demo-room to seed an end-to-end 48h room with members, brief, ideas, plan, and tasks.
            </p>
          </div>
          <Button size="sm" onClick={handleSeedDemoRoom} disabled={isLoading}>
            {isLoading ? 'Seeding...' : 'Seed Demo Room'}
          </Button>
        </div>

        {/* Room selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Target Room
            </label>
            <Button variant="ghost" size="sm" onClick={loadRooms} className="text-xs h-7 px-2">
              Refresh
            </Button>
          </div>
          {rooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No rooms found in backend. Click "Seed Demo Room" above or create one from the home screen.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoomId(r.id)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    selectedRoomId === r.id
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {r.name} <span className="text-[10px] opacity-75 font-mono">({r.stage || 'room'})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedRoomId && (
          <div className="space-y-6">
            {/* Backend Simulation Controls */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Backend Simulation Controls</h3>
                <p className="text-xs text-muted-foreground">
                  Simulate crunch-time conditions, progress updates, and presentations.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleSetClockHour39}>
                  Advance Clock (Crunch Time)
                </Button>
                <Button variant="outline" size="sm" onClick={handleSimulate60Progress}>
                  Simulate 60% Progress
                </Button>
                <Button variant="outline" size="sm" onClick={handleSeedPresentData}>
                  Seed Present Deck & Q&A
                </Button>
                <Button variant="outline" size="sm" onClick={handleAddFakeCommits}>
                  Add 3 Fake Commits
                </Button>
                <Button variant="outline" size="sm" onClick={handleUseFakeRepo}>
                  Connect Fake GitHub Repo
                </Button>
              </div>
            </div>

            {/* Error boundary testing */}
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-destructive">Test Error Boundary</h3>
                <p className="text-xs text-muted-foreground">
                  Triggers an unhandled render error to verify the React ErrorBoundary UI and Retry action.
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setForceCrash(true)}>
                Trigger Crash
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

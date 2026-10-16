import * as React from 'react';
import { useParams } from 'react-router-dom';
import { fetchSchedule, type ScheduleEvent } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { TimeGrid } from './components/time-grid';
import { CreateEventPopover } from './components/create-event-popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function SchedulePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [events, setEvents] = React.useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    fetchSchedule(roomId).then((res) => {
      if (mounted) {
        setEvents(res.events);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const handleAddEvent = (data: any) => {
    // In a real app this would call an API to create the event
    alert(`Add event: ${data.title}`);
  };

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Schedule</h1>
          <span className="text-sm font-semibold text-ink-muted">Nov 20 – 22, 2026</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Segmented Control C17 */}
          <div className="flex items-center p-1 bg-surface-sunken rounded-full">
            <button className="px-4 py-1.5 text-sm font-semibold rounded-full hover:text-ink text-ink-muted transition-colors">
              Month
            </button>
            <button className="px-4 py-1.5 text-sm font-semibold rounded-full bg-white text-ink shadow-sm transition-colors">
              Week
            </button>
            <button className="px-4 py-1.5 text-sm font-semibold rounded-full hover:text-ink text-ink-muted transition-colors">
              Day
            </button>
            <button className="px-4 py-1.5 text-sm font-semibold rounded-full hover:text-ink text-ink-muted transition-colors">
              Event
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" className="rounded-full h-9">
            Today
          </Button>

          <CreateEventPopover defaultDate={new Date('2026-11-20')} onAdd={handleAddEvent}>
            <Button className="rounded-full h-9 bg-inverse text-on-inverse hover:opacity-90 pl-3 pr-5 cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </CreateEventPopover>
        </div>
      </header>

      <main className="flex-1 flex min-h-0">
        {/* Left Context Panel R5 */}
        <aside className="w-[300px] shrink-0 border-r border-border flex flex-col overflow-y-auto bg-surface p-6 gap-8">
          
          {/* Mini calendar placeholder C19 */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold">November 2026</h3>
            <div className="h-[240px] r-card border border-border bg-surface flex items-center justify-center text-ink-muted text-sm">
              [Mini Calendar]
            </div>
          </div>

          {/* Next up card */}
          <div className="p-4 r-card bg-surface-raised border border-border text-foreground space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next up</span>
              <Badge variant="secondary" className="r-chip bg-accent text-on-accent border-none text-xs font-bold px-2 py-0.5">
                14 min
              </Badge>
            </div>
            <div>
              <h4 className="font-bold text-lg leading-tight">Rehearsal 1</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>14:00 – 14:45</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-8 rounded-full border-border text-foreground hover:bg-muted w-full text-xs">
                Later
              </Button>
              <Button className="h-8 rounded-full bg-inverse text-on-inverse hover:opacity-90 w-full text-xs cursor-pointer">
                Details
              </Button>
            </div>
          </div>

          {/* Layers checklist */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold">Layers</h3>
            <div className="space-y-3">
              {[
                { label: 'Tasks', count: 18 },
                { label: 'Checkpoints', count: 5 },
                { label: 'Deadlines', count: 2 },
                { label: 'Meals and sleep', count: 6 },
                { label: 'Sessions', count: 3 },
              ].map((layer) => (
                <label key={layer.label} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="rounded text-lav-600 focus:ring-lav-600 h-4 w-4 bg-surface-sunken border-transparent" />
                  <span className="text-sm font-semibold flex-1 group-hover:text-ink text-ink-muted transition-colors">{layer.label}</span>
                  <Badge variant="secondary" className="r-chip bg-surface-sunken text-ink-muted group-hover:text-ink font-semibold">
                    {layer.count}
                  </Badge>
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold">Categories</h3>
            <div className="space-y-3">
              {[
                { label: 'Build', percent: 65, color: 'bg-sky-500', track: 'bg-sky-100' },
                { label: 'Design', percent: 15, color: 'bg-peach-500', track: 'bg-peach-100' },
                { label: 'Docs', percent: 10, color: 'bg-lime-500', track: 'bg-lime-100' },
                { label: 'Pitch', percent: 10, color: 'bg-lav-500', track: 'bg-lav-100' },
              ].map((cat) => (
                <div key={cat.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{cat.label}</span>
                    <span className="text-ink-muted">{cat.percent}%</span>
                  </div>
                  <div className={`h-2 rounded-full w-full ${cat.track} overflow-hidden`}>
                    <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <div className="flex-1 min-w-0 relative h-full">
          {loading ? (
            <div className="w-full h-full p-6">
              <Skeleton className="w-full h-full rounded-2xl" />
            </div>
          ) : (
            <TimeGrid events={events} initialDate="2026-11-20" />
          )}
        </div>
      </main>
    </div>
  );
}

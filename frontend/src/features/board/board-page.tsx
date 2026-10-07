import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchBoardTasks, type Task } from '@/api/client';
import { Search, Filter, Lock, Plus } from 'lucide-react';
import { KanbanBoard } from './components/kanban-board';
import { TaskDrawer } from './components/task-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
// Note: Evil Charts area/heatmap styling assumed integrated via shadcn.
// We use placeholder cards for the top KPIs to match design.
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function BoardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [featureFreeze, setFeatureFreeze] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  React.useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    fetchBoardTasks(roomId).then((res) => {
      if (mounted) {
        setTasks(res.tasks);
        setFeatureFreeze(res.featureFreeze);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTasksChange = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  const handleMarkDone = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'Done' as const } : t))
    );
  };

  const handleToggleChecklist = (taskId: string, itemId: string, isDone: boolean) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          checklist: t.checklist.map((c) => (c.id === itemId ? { ...c, isDone } : c)),
        };
      })
    );
  };

  const [scopeGuardOpen, setScopeGuardOpen] = React.useState(false);

  const handleAddTaskClick = () => {
    if (featureFreeze) {
      setScopeGuardOpen(true);
    } else {
      // Normal add task
      alert('Add new task');
    }
  };

  const handleScopeGuardYes = () => {
    setScopeGuardOpen(false);
    alert('Add new task (despite freeze)');
  };

  const handleScopeGuardPark = () => {
    setScopeGuardOpen(false);
    alert('Task parked');
  };

  const handleScopeGuardCancel = () => {
    setScopeGuardOpen(false);
  };

  const openTasksCount = tasks.filter(t => t.status !== 'Done').length;
  const blockedTasksCount = tasks.filter(t => t.status === 'Blocked' || t.tags.includes('Blocked')).length;

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Feature Freeze Banner M09 */}
      {featureFreeze && (
        <div className="w-full bg-lav-100 text-lav-900 py-2 px-4 text-center text-sm font-semibold transition-all duration-300">
          Feature freeze is on. New tasks ask Scope Guard first.
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input placeholder="Search tasks..." className="pl-9 bg-surface-sunken border-transparent h-10 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full">
            Sort by
          </Button>
          <Button variant="outline" className="rounded-full flex gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            className={cn(
              "rounded-full pl-3 pr-5 text-white transition-all duration-300",
              featureFreeze ? "bg-amber-600 hover:bg-amber-700" : "bg-[#2A2D32] hover:bg-black"
            )}
            onClick={handleAddTaskClick}
          >
            {featureFreeze ? <Lock className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add task
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col p-5">
        {/* KPI / Chart row */}
        <div className="flex items-center gap-4 mb-4 shrink-0 h-[88px]">
          <Card className="flex-1 p-4 h-full flex flex-col justify-between shadow-none border-border">
            <h3 className="text-sm font-bold text-ink">Progress vs plan</h3>
            <div className="text-xs text-ink-muted">Area chart placeholder</div>
          </Card>
          <Card className="flex-1 p-4 h-full flex flex-col justify-between shadow-none border-border">
            <h3 className="text-sm font-bold text-ink">Team activity</h3>
            <div className="text-xs text-ink-muted">Heatmap placeholder</div>
          </Card>
          <Card className="w-[140px] p-4 h-full flex flex-col justify-between shadow-none border-border">
            <h3 className="text-sm font-bold text-ink-muted">Open tasks</h3>
            <span className="text-3xl font-black">{loading ? '-' : openTasksCount}</span>
          </Card>
          <Card className="w-[140px] p-4 h-full flex flex-col justify-between shadow-none border-border bg-coral-50 border-coral-200">
            <h3 className="text-sm font-bold text-coral-900">Blocked</h3>
            <span className="text-3xl font-black text-coral-700">{loading ? '-' : blockedTasksCount}</span>
          </Card>
        </div>

        {/* Board Area */}
        <div className="flex-1 overflow-hidden flex gap-6">
          <div className="flex-1 h-full min-w-0">
            {loading ? (
              <div className="flex gap-4 h-full">
                <Skeleton className="w-[300px] h-full rounded-2xl" />
                <Skeleton className="w-[300px] h-full rounded-2xl" />
                <Skeleton className="w-[300px] h-full rounded-2xl" />
              </div>
            ) : (
              <KanbanBoard
                tasks={tasks}
                onTaskClick={handleTaskClick}
                onTasksChange={handleTasksChange}
              />
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="w-[280px] shrink-0 border-l border-border pl-6 flex flex-col gap-6 overflow-y-auto hidden lg:flex">
            <div>
              <h3 className="text-sm font-bold mb-4">Members</h3>
              {/* Dummy members list matching R2 */}
              <div className="space-y-4">
                {[
                  { name: 'Aarav Mehta', role: 'Backend', load: '6 tasks' },
                  { name: 'Ishita Rao', role: 'Design', load: '3 tasks' },
                  { name: 'Kabir Nair', role: 'Frontend', load: 'Blocked' },
                ].map((m) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-lav-100 flex items-center justify-center text-xs font-bold text-lav-900">
                      {m.name[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{m.name}</span>
                      <span className="text-[10px] text-ink-muted leading-none mt-1">
                        {m.role} • {m.load}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unowned tasks callout */}
            <div className="p-4 r-card bg-[#2A2D32] text-white">
              <h3 className="text-sm font-bold">Unowned task</h3>
              <p className="text-xs text-[#C7CAC4] mt-1 mb-3">
                1 task needs an owner. Assign it to keep moving.
              </p>
              <Button className="w-full bg-white text-ink hover:bg-gray-100 h-9 rounded-full">
                Assign
              </Button>
            </div>
            
            {/* Timeline link (S14 to S15) */}
            <div className="mt-auto">
              <Button variant="outline" className="w-full rounded-full" onClick={() => navigate(`/app/room/${roomId}/schedule`)}>
                View Timeline (Schedule)
              </Button>
            </div>
          </aside>
        </div>
      </main>

      <TaskDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onToggleChecklist={handleToggleChecklist}
        onMarkDone={handleMarkDone}
      />

      <Dialog open={scopeGuardOpen} onOpenChange={setScopeGuardOpen}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Feature Freeze is Active</DialogTitle>
            <DialogDescription>
              You are past the feature freeze deadline. Are you sure you want to add a new task, or should we park this idea for after the hackathon?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={handleScopeGuardCancel}>Cancel</Button>
            <Button variant="outline" onClick={handleScopeGuardPark}>Park it</Button>
            <Button variant="default" onClick={handleScopeGuardYes}>Yes, add task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

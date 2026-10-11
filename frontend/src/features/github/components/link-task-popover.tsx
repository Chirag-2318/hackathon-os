import React, { useState, useEffect } from 'react';
import { Plus, Search, Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { boardService } from '@/services/boardService';
import type { Task } from '@/services/types';

interface LinkTaskPopoverProps {
  roomId: string;
  linkedKeys: string[];
  onLink: (key: string) => void;
  onUnlink: (key: string) => void;
}

export function LinkTaskPopover({
  roomId,
  linkedKeys,
  onLink,
  onUnlink,
}: LinkTaskPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      boardService
        .getTasks(roomId)
        .then((res: Task[]) => setTasks(res || []))
        .catch(() => setTasks([]))
        .finally(() => setLoading(false));
    }
  }, [open, roomId]);

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    return t.key.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="size-5 rounded-md border border-dashed border-border/70 hover:border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          title="Link a board task"
          aria-label="Link task"
        >
          <Plus className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        onClick={(e) => e.stopPropagation()}
        className="w-72 p-2 rounded-xl text-xs font-[var(--font-inter)] shadow-lg"
      >
        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-lg border border-border/50 mb-2">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks by key or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1">
          {loading ? (
            <div className="p-3 text-center text-muted-foreground">Loading tasks...</div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-center text-muted-foreground">No tasks found</div>
          ) : (
            filtered.map((t) => {
              const isLinked = linkedKeys.includes(t.key);
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (isLinked) {
                      onUnlink(t.key);
                    } else {
                      onLink(t.key);
                    }
                  }}
                  className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-mono font-semibold text-foreground mr-1.5">
                      {t.key}
                    </span>
                    <span className="text-muted-foreground truncate">{t.summary}</span>
                  </div>
                  {isLinked ? (
                    <span className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="size-2.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="size-4 rounded-full border border-border text-transparent hover:text-muted-foreground flex items-center justify-center shrink-0">
                      <Plus className="size-2.5" />
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

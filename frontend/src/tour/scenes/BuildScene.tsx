import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/ui/user-avatar';
import { SAMPLE_KANBAN_TASKS, SAMPLE_TEAMMATES } from '../fixtures';
import type { SceneProps } from '../types';

export function BuildScene({ active, onTryItComplete, isReducedMotion = false }: SceneProps) {
  const [tasks, setTasks] = useState(SAMPLE_KANBAN_TASKS);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [freezeProgress, setFreezeProgress] = useState(30);

  // Auto card slide demo
  useEffect(() => {
    if (!active) {
      setTasks(SAMPLE_KANBAN_TASKS);
      setFreezeProgress(30);
      return;
    }

    if (isReducedMotion) {
      setFreezeProgress(70);
      return;
    }

    const t1 = setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === 't1' ? { ...t, col: 'in_progress' } : t))
      );
      setFreezeProgress(48);
    }, 1800);

    const t2 = setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === 't2' ? { ...t, col: 'done' } : t))
      );
      setFreezeProgress(68);
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, isReducedMotion]);

  // Pointer drag for Try-It (no external library, snaps with spring)
  const handlePointerDown = (taskId: string, e: React.PointerEvent) => {
    setDraggedTaskId(taskId);
    setDragPos({ x: 0, y: 0 });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedTaskId) return;
    setDragPos((prev) => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggedTaskId) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Snap to target column based on drag offset X
    if (dragPos.x > 60) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== draggedTaskId) return t;
          const nextCol = t.col === 'todo' ? 'in_progress' : 'done';
          return { ...t, col: nextCol };
        })
      );
    } else if (dragPos.x < -60) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== draggedTaskId) return t;
          const prevCol = t.col === 'done' ? 'in_progress' : 'todo';
          return { ...t, col: prevCol };
        })
      );
    }

    setDraggedTaskId(null);
    setDragPos({ x: 0, y: 0 });
    if (onTryItComplete) onTryItComplete();
  };

  const columns = [
    { id: 'todo', label: 'To do' },
    { id: 'in_progress', label: 'In progress' },
    { id: 'done', label: 'Done' },
  ];

  return (
    <div className="flex flex-col gap-3 w-full text-xs">
      {/* Header: Presence pulse avatars & Feature freeze bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-800">Sprint Sync:</span>
          <div className="flex items-center -space-x-1.5">
            {SAMPLE_TEAMMATES.slice(0, 4).map((tm) => (
              <div key={tm.userId} className="relative">
                <UserAvatar user={tm} size={22} />
                <span className="absolute bottom-0 right-0 size-1.5 bg-emerald-500 rounded-full ring-1 ring-white animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Feature Freeze Timeline Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-neutral-500">Feature Freeze:</span>
          <div className="w-28 sm:w-36 h-2 bg-neutral-200 rounded-full relative overflow-hidden">
            <motion.div
              className="h-full bg-amber-500"
              animate={{ width: `${freezeProgress}%` }}
              transition={{ duration: 0.5 }}
            />
            {/* 70% freeze mark */}
            <div className="absolute left-[70%] top-0 bottom-0 w-0.5 bg-red-500" title="Freeze at 70%" />
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-600">{freezeProgress}%</span>
        </div>
      </div>

      {/* 3-Column Kanban Board & Workload Chart */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Kanban Board Columns (8 cols) */}
        <div className="md:col-span-8 grid grid-cols-3 gap-2">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.col === col.id);
            return (
              <div key={col.id} className="p-2 bg-neutral-100/80 rounded-xl flex flex-col gap-1.5 min-h-[160px]">
                <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-neutral-600 px-1">
                  <span>{col.label}</span>
                  <span className="size-4 rounded-full bg-neutral-200 flex items-center justify-center text-[9px]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  {colTasks.map((t) => {
                    const isDraggingThis = draggedTaskId === t.id;
                    return (
                      <div
                        key={t.id}
                        onPointerDown={(e) => handlePointerDown(t.id, e)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        style={{
                          transform: isDraggingThis
                            ? `translate(${dragPos.x}px, ${dragPos.y}px)`
                            : undefined,
                          zIndex: isDraggingThis ? 40 : 1,
                        }}
                        className={`p-2 rounded-lg bg-white border border-neutral-200/90 shadow-xs cursor-grab active:cursor-grabbing select-none transition-shadow ${
                          isDraggingThis ? 'shadow-xl ring-2 ring-amber-400 scale-105' : ''
                        }`}
                        title="Drag between columns"
                      >
                        <p className="text-[10px] font-medium text-neutral-900 line-clamp-2 leading-snug">
                          {t.title}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-neutral-100">
                          <span className="text-[8px] font-mono text-neutral-400 uppercase">
                            #{t.id}
                          </span>
                          <UserAvatar user={t.assignee} size={16} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Workload View Chart (4 cols) */}
        <div className="md:col-span-4 p-3 bg-white rounded-xl border border-neutral-200 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-semibold text-neutral-500 uppercase block mb-2">
              Team Workload
            </span>
            <div className="flex flex-col gap-2">
              {SAMPLE_TEAMMATES.slice(0, 4).map((tm, idx) => (
                <div key={tm.userId} className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-[10px] text-neutral-700">
                    <span className="truncate">{(tm.name || 'Teammate').split(' ')[0]}</span>
                    <span className="font-mono text-neutral-500">{idx * 2 + 3}h</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(idx + 1) * 22}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MVP Studio Side-Note Chip */}
          <div className="mt-3 p-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[10px] text-amber-800 text-center font-medium">
            MVP Studio tracks what's real, mocked and planned.
          </div>
        </div>
      </div>
    </div>
  );
}

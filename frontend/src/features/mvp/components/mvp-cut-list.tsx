import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import type { CutListItem } from '@/services/types';

export interface MvpCutListProps {
  cutList: CutListItem[];
  onUpdateCutList: (newList: CutListItem[]) => void;
}

export function MvpCutList({ cutList, onUpdateCutList }: MvpCutListProps) {
  if (cutList.length === 0) return null;

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const toggleCut = (id: string) => {
    onUpdateCutList(
      cutList.map(item => item.id === id ? { ...item, cut: !item.cut } : item)
    );
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const reordered = [...cutList];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setDraggedIdx(targetIdx);
    onUpdateCutList(reordered);
  };

  return (
    <div className="bg-card rounded-[24px] border border-border p-5 shadow-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col">
        <h3 className="text-base font-semibold text-foreground">
          Cut list
        </h3>
        <span className="text-xs text-muted-foreground">
          If time runs short, cut from the top.
        </span>
      </div>

      {/* Rows 40px */}
      <div className="flex flex-col divide-y divide-border/40 text-xs">
        {cutList.map((item, idx) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={() => setDraggedIdx(null)}
            className="flex items-center justify-between h-10 gap-2 cursor-grab active:cursor-grabbing hover:bg-muted/20 px-1 rounded transition-colors"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GripVertical className="size-3.5 text-muted-foreground/60 shrink-0" />
              <span className={cn('font-medium text-foreground truncate', item.cut && 'line-through text-muted-foreground')}>
                {item.text}
              </span>
            </div>

            {/* "Cut" toggle chip */}
            <button
              onClick={() => toggleCut(item.id)}
              className={cn(
                'h-5 px-2 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors shrink-0',
                item.cut
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {item.cut ? 'CUT' : 'KEEP'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

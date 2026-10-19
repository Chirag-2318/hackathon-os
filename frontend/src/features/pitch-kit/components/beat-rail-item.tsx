import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PitchBeat } from '../api/pitch-kit-api';

export interface BeatRailItemProps {
  beat: PitchBeat;
  index: number;
  cumulativeSec: number;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  speakerUser?: any;
  disabled?: boolean;
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BeatRailItem({
  beat,
  index,
  cumulativeSec,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  speakerUser,
  disabled = false,
}: BeatRailItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: beat.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer select-none',
        isSelected
          ? 'bg-accent/70 border-foreground/30 text-foreground font-medium shadow-xs'
          : 'bg-background hover:bg-muted/40 border-border/70 text-foreground/90'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {!disabled && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-muted-foreground/50 hover:text-foreground cursor-grab active:cursor-grabbing p-0.5 rounded touch-none"
            aria-label="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}

        <span className="font-mono text-xs text-muted-foreground tabular-nums shrink-0 w-8">
          {fmtTime(cumulativeSec)}
        </span>

        <span className="truncate text-xs font-medium max-w-[140px]" title={beat.title}>
          {beat.title || `Beat ${index + 1}`}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {fmtTime(beat.durationSec)}
        </span>

        {speakerUser ? (
          <UserAvatar user={speakerUser} size={20} className="w-5 h-5 text-[10px]" />
        ) : (
          <div className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center text-[9px] text-muted-foreground">
            -
          </div>
        )}

        {!disabled && (
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

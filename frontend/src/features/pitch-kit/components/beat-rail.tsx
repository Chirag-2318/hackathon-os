import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BeatRailItem } from './beat-rail-item';
import type { PitchBeat } from '../api/pitch-kit-api';

export interface BeatRailProps {
  beats: PitchBeat[];
  selectedBeatId: string | null;
  onSelectBeat: (beatId: string) => void;
  onReorderBeats: (beats: PitchBeat[]) => void;
  onAddBeat: () => void;
  onDuplicateBeat: (beatId: string) => void;
  onDeleteBeat: (beatId: string) => void;
  members: any[];
  timeLimitSec: number;
  disabled?: boolean;
}

export function BeatRail({
  beats,
  selectedBeatId,
  onSelectBeat,
  onReorderBeats,
  onAddBeat,
  onDuplicateBeat,
  onDeleteBeat,
  members,
  timeLimitSec,
  disabled = false,
}: BeatRailProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const memberMap = useMemo(() => {
    const map = new Map<string, any>();
    members.forEach((m) => {
      if (m.id) map.set(m.id, m);
      if (m.userId) map.set(m.userId, m);
    });
    return map;
  }, [members]);

  const cumulativeTimes = useMemo(() => {
    let acc = 0;
    return beats.map((b) => {
      const cur = acc;
      acc += b.durationSec;
      return cur;
    });
  }, [beats]);

  // Find index where limit is crossed
  const limitCrossingIndex = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < beats.length; i++) {
      acc += beats[i].durationSec;
      if (acc >= timeLimitSec) return i;
    }
    return -1;
  }, [beats, timeLimitSec]);

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDragId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = beats.findIndex((b) => b.id === active.id);
    const newIndex = beats.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = [...beats];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    onReorderBeats(updated);
  };

  // Keyboard navigation: Up / Down arrow selection
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const curIdx = beats.findIndex((b) => b.id === selectedBeatId);
        if (curIdx < beats.length - 1) onSelectBeat(beats[curIdx + 1].id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const curIdx = beats.findIndex((b) => b.id === selectedBeatId);
        if (curIdx > 0) onSelectBeat(beats[curIdx - 1].id);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [beats, selectedBeatId, onSelectBeat]);

  const activeDragBeat = useMemo(
    () => beats.find((b) => b.id === activeDragId),
    [beats, activeDragId]
  );

  return (
    <div className="w-full md:w-[320px] shrink-0 border-r border-border pr-4 space-y-3">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono font-medium">
          Beats ({beats.length})
        </span>
        {!disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddBeat}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add beat
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={beats.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {beats.map((beat, i) => {
              const speaker = beat.speakerUserId ? memberMap.get(beat.speakerUserId) : null;
              const isCrossing = i === limitCrossingIndex;

              return (
                <React.Fragment key={beat.id}>
                  <BeatRailItem
                    beat={beat}
                    index={i}
                    cumulativeSec={cumulativeTimes[i]}
                    isSelected={beat.id === selectedBeatId}
                    onSelect={() => onSelectBeat(beat.id)}
                    onDuplicate={() => onDuplicateBeat(beat.id)}
                    onDelete={() => onDeleteBeat(beat.id)}
                    speakerUser={speaker}
                    disabled={disabled}
                  />

                  {isCrossing && (
                    <div className="relative py-1 flex items-center justify-between gap-2">
                      <div className="h-px bg-destructive/60 flex-1" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-destructive font-medium px-1">
                        Limit line
                      </span>
                      <div className="h-px bg-destructive/60 flex-1" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeDragBeat ? (
            <div className="bg-card border border-foreground/30 shadow-md rounded-lg p-2 text-xs font-medium">
              {activeDragBeat.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

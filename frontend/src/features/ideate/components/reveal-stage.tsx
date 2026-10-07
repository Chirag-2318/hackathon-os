import * as React from 'react';

import type { IdeateResponse, IdeateIdea } from '@/api/client';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import type { 
  DragStartEvent, 
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { KanbanColumn } from '@/components/primitives/kanban-column';
import { SortableIdeaCard } from './sortable-idea-card';
import { IdeaCard } from './idea-card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const COLUMNS = [
  { id: 'New', title: 'New' },
  { id: 'Shortlist', title: 'Shortlist' },
  { id: 'Chosen', title: 'Chosen' },
  { id: 'Parked', title: 'Parked' },
] as const;

type ColumnId = typeof COLUMNS[number]['id'];

export function RevealStage({ data }: { data: IdeateResponse }) {
  const [ideas, setIdeas] = React.useState<IdeateIdea[]>(data.ideas);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isRevealed, setIsRevealed] = React.useState(false);
  const [isAnonymous, setIsAnonymous] = React.useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveIdea = active.data.current?.type === 'Idea';
    const isOverIdea = over.data.current?.type === 'Idea';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveIdea) return;

    // Dropping idea over another idea
    if (isActiveIdea && isOverIdea) {
      setIdeas((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === activeId);
        const overIndex = prev.findIndex((i) => i.id === overId);
        
        if (prev[activeIndex].status !== prev[overIndex].status) {
          const newIdeas = [...prev];
          newIdeas[activeIndex].status = prev[overIndex].status;
          return arrayMove(newIdeas, activeIndex, overIndex);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Dropping idea over a column
    if (isActiveIdea && isOverColumn) {
      setIdeas((prev) => {
        const activeIndex = prev.findIndex((i) => i.id === activeId);
        const newIdeas = [...prev];
        newIdeas[activeIndex].status = overId as ColumnId;
        return arrayMove(newIdeas, activeIndex, activeIndex); // Just changing status
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;
  };

  const activeIdea = ideas.find(i => i.id === activeId);

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <Button 
            onClick={handleReveal} 
            disabled={isRevealed}
            className="animate-in fade-in"
          >
            {isRevealed ? 'Revealed' : 'Reveal Ideas (M04)'}
          </Button>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="anonymous-mode" 
              checked={isAnonymous} 
              onCheckedChange={setIsAnonymous} 
            />
            <Label htmlFor="anonymous-mode">Anonymous Mode</Label>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          {COLUMNS.map((col) => {
            const columnIdeas = ideas.filter(i => i.status === col.id);
            return (
              <KanbanColumn 
                key={col.id} 
                id={col.id} 
                title={col.title} 
                count={columnIdeas.length}
              >
                <SortableContext 
                  items={columnIdeas.map(i => i.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-3 min-h-[100px]">
                    {columnIdeas.map((idea, index) => (
                      <SortableIdeaCard 
                        key={idea.id} 
                        idea={idea} 
                        isRevealed={isRevealed}
                        isAnonymous={isAnonymous}
                        index={index}
                      />
                    ))}
                  </div>
                </SortableContext>
              </KanbanColumn>
            );
          })}

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } })
          }}>
            {activeIdea ? (
              <IdeaCard 
                idea={activeIdea} 
                isRevealed={isRevealed} 
                isAnonymous={isAnonymous} 
                className="rotate-2 scale-105 shadow-xl cursor-grabbing" 
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

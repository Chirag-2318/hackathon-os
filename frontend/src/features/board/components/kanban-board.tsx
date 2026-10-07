import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Task, type TaskStatus } from '@/api/client';
import { TaskCard } from './task-card';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function KanbanColumn({ id, title, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef } = useSortable({
    id,
    data: {
      type: 'Column',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col flex-shrink-0 w-[300px] h-full bg-transparent"
    >
      <div className="flex items-center gap-2 mb-4 px-2">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        <div className="flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-[#2A2D32] text-white text-xs font-bold">
          {tasks.length}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-4 space-y-3 px-2 min-h-[150px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-sm text-ink-muted bg-surface-sunken/50">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTasksChange: (newTasks: Task[]) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'Backlog', title: 'Backlog' },
  { id: 'Building', title: 'Building' },
  { id: 'Blocked', title: 'Blocked' },
  { id: 'Review', title: 'Review' },
  { id: 'Done', title: 'Done' },
  { id: 'Parked', title: 'Parked' },
];

export function KanbanBoard({ tasks, onTaskClick, onTasksChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const hasParkedTasks = tasks.some((t) => t.status === 'Parked');
  const visibleColumns = COLUMNS.filter((c) => c.id !== 'Parked' || hasParkedTasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Task over Task
    if (isActiveTask && isOverTask) {
      const activeTaskIndex = tasks.findIndex((t) => t.id === activeId);
      const overTaskIndex = tasks.findIndex((t) => t.id === overId);

      const activeStatus = tasks[activeTaskIndex].status;
      const overStatus = tasks[overTaskIndex].status;

      if (activeStatus !== overStatus) {
        const newTasks = [...tasks];
        newTasks[activeTaskIndex].status = overStatus;
        onTasksChange(newTasks);
      }
    }

    // Task over Column
    if (isActiveTask && isOverColumn) {
      const activeTaskIndex = tasks.findIndex((t) => t.id === activeId);
      const overStatus = overId as TaskStatus;

      if (tasks[activeTaskIndex].status !== overStatus) {
        const newTasks = [...tasks];
        newTasks[activeTaskIndex].status = overStatus;
        onTasksChange(newTasks);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';

    if (isActiveTask && isOverTask) {
      // Reorder within column logic could go here
      // We skip it for simplicity unless required, just state update is fine
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto snap-x snap-mandatory pb-4">
        <SortableContext items={visibleColumns.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {visibleColumns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="snap-start h-full">
                <KanbanColumn
                  id={col.id}
                  title={col.title}
                  tasks={columnTasks}
                  onTaskClick={onTaskClick}
                />
              </div>
            );
          })}
        </SortableContext>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? <TaskCard task={activeTask} overlay /> : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}

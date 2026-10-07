
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { IdeateIdea } from '@/api/client';
import { IdeaCard } from './idea-card';

interface SortableIdeaCardProps {
  idea: IdeateIdea;
  isRevealed: boolean;
  isAnonymous: boolean;
  index: number;
}

export function SortableIdeaCard({ idea, isRevealed, isAnonymous, index }: SortableIdeaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: idea.id,
    data: {
      type: 'Idea',
      idea,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <IdeaCard
      ref={setNodeRef}
      style={style}
      idea={idea}
      isRevealed={isRevealed}
      isAnonymous={isAnonymous}
      index={index}
      {...attributes}
      {...listeners}
    />
  );
}

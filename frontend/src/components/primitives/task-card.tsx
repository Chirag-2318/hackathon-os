import * as React from "react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "./avatar-stack";
import { Chip } from "./chip";
import { MoreHorizontal, Calendar, Paperclip, MessageCircle, Check } from "lucide-react";
import { IconButton } from "./icon-button";

/**
 * C13 — Task Card (Kanban Card)
 * §4 C13: surface-raised, r-card 16, padding 16.
 * Top row: tag chip (left) + kebab (right).
 * Title (Body strong, 2 lines). Description (Body, muted, 2 lines).
 * Owner row: 32px avatar + name (Body strong) + role (Caption muted).
 * Footer row: due-date icon + date · attachment icon + count · comment icon + count.
 * States: default; hovered (border-strong); selected/drag-lifted = #B6D2F3 fill + e2 (static);
 * blocked (coral chip + #A82D2D text); done (title muted, check chip).
 */

interface TaskCardProps extends React.ComponentProps<typeof Card> {
  tagText?: string;
  tagColor?: string;
  title: string;
  description?: string;
  ownerName: string;
  ownerRole?: string;
  ownerInitials: string;
  ownerSrc?: string;
  ownerColor?: string;
  dueDate?: string;
  commentsCount?: number;
  attachmentsCount?: number;
  
  // States
  state?: "default" | "blocked" | "done";
  isDragging?: boolean;
}

function TaskCard({
  tagText,
  tagColor,
  title,
  description,
  ownerName,
  ownerRole,
  ownerInitials,
  ownerSrc,
  ownerColor,
  dueDate,
  commentsCount = 0,
  attachmentsCount = 0,
  state = "default",
  isDragging = false,
  className,
  ...props
}: TaskCardProps) {
  
  const isBlocked = state === "blocked";
  const isDone = state === "done";
  
  return (
    <Card
      data-slot="task-card"
      className={cn(
        "flex flex-col rounded-[14px] p-3 text-left shadow-e0 border border-transparent transition-all outline-none focus-visible:ring-2 focus-visible:ring-focus-ring cursor-grab active:cursor-grabbing",
        // Default
        !isDragging && !isBlocked && !isDone && "bg-surface-raised hover:border-border-strong",
        // Dragging/Lifted
        isDragging && "bg-info-fill shadow-e2 scale-[1.02] border-info-fill z-10",
        // Blocked
        isBlocked && !isDragging && "bg-danger-fill/10 border-danger-fill/30",
        // Done
        isDone && !isDragging && "bg-surface-raised/50",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between mb-2">
        {isBlocked ? (
          <Chip variant="solid" className="bg-danger-fill text-white">Blocked</Chip>
        ) : isDone ? (
          <Chip fill="var(--color-success-fill)" className="text-ink">
            <Check className="size-3" /> Done
          </Chip>
        ) : tagText ? (
          <Chip fill={tagColor}>{tagText}</Chip>
        ) : (
          <div /> // spacing placeholder
        )}
        <IconButton tooltip="Task options" size="sm" className="-m-2 text-ink-muted hover:text-ink">
          <MoreHorizontal className="size-4" />
        </IconButton>
      </div>

      <h3 className={cn(
        "text-body-strong mb-1 line-clamp-2",
        isBlocked && "text-danger-text",
        isDone ? "text-ink-disabled line-through" : "text-ink"
      )}>
        {title}
      </h3>
      
      {description && (
        <p className="text-body text-ink-muted mb-3 line-clamp-2">
          {description}
        </p>
      )}

      <div className="flex items-center gap-2 mb-3 mt-auto pt-1">
        <UserAvatar 
          size="sm" 
          initials={ownerInitials} 
          src={ownerSrc} 
          fallbackColor={ownerColor} 
        />
        <div className="flex flex-col">
          <span className="text-body-strong leading-tight">{ownerName}</span>
          {ownerRole && <span className="text-caption text-ink-muted leading-tight">{ownerRole}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 text-caption text-ink-muted mt-1.5 border-t border-border pt-2">
        {dueDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5" strokeWidth={2} />
            <span>{dueDate}</span>
          </div>
        )}
        
        <div className="flex items-center gap-3 ml-auto">
          {attachmentsCount > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="size-3.5" strokeWidth={2} />
              <span>{attachmentsCount}</span>
            </div>
          )}
          {commentsCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle className="size-3.5" strokeWidth={2} />
              <span>{commentsCount}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export { TaskCard };
export type { TaskCardProps };

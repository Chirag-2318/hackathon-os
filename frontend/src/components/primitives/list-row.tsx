import * as React from "react";
import { cn } from "cn";
import { ProgressRow } from "./progress-row";
import { UserAvatar } from "./avatar-stack";
import { MessageCircle, Paperclip, CheckSquare } from "lucide-react";

/**
 * C10b — List Row with identity tile
 * §4 C10b: Row 64px on surface; 40px rounded-square tile with 2-letter code on pastel fill;
 * title (Body strong) + meta line (avatar, name, time);
 * trailing ring/percent + 3 small meta icons with counts. Whole row is one target.
 */

interface ListRowProps extends React.ComponentProps<"button"> {
  title: string;
  tileCode: string;
  tileColor?: string;
  authorName: string;
  authorInitials: string;
  authorSrc?: string;
  timeAgo: string;
  progress: number;
  commentsCount?: number;
  attachmentsCount?: number;
  tasksCount?: number;
}

function ListRow({
  title,
  tileCode,
  tileColor = "var(--pastel-lavender)",
  authorName,
  authorInitials,
  authorSrc,
  timeAgo,
  progress,
  commentsCount = 0,
  attachmentsCount = 0,
  tasksCount = 0,
  className,
  ...props
}: ListRowProps) {
  return (
    <button
      data-slot="list-row"
      className={cn(
        "group flex w-full items-center gap-3 py-2 pr-3 pl-2 rounded-card bg-surface transition-colors hover:bg-lav-50 active:bg-lav-100 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset text-left border-l-2 border-transparent hover:border-lav-600",
        className
      )}
      {...props}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-[14px] text-caption font-bold text-ink"
        style={{ backgroundColor: tileColor }}
      >
        {tileCode}
      </div>

      <div className="flex flex-1 flex-col justify-center min-w-0">
        <span className="text-body-strong text-ink truncate leading-tight mb-0.5">
          {title}
        </span>
        <div className="flex items-center gap-2 text-caption text-ink-muted">
          <UserAvatar
            size="xs"
            initials={authorInitials}
            src={authorSrc}
          />
          <span className="truncate">{authorName}</span>
          <span className="shrink-0 text-[10px]">•</span>
          <span className="shrink-0">{timeAgo}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0 w-32 ml-4 hidden sm:flex">
        {progress !== undefined && (
          <ProgressRow label="" percent={progress} className="w-full justify-end [&>span:first-child]:hidden" colorClass="bg-lav-600" />
        )}
        <div className="flex items-center justify-end gap-3 text-ink-muted text-[10px] font-semibold tracking-wider">
          {tasksCount > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="size-3" strokeWidth={2.5} />
              <span>{tasksCount}</span>
            </div>
          )}
          {attachmentsCount > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="size-3" strokeWidth={2.5} />
              <span>{attachmentsCount}</span>
            </div>
          )}
          {commentsCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle className="size-3" strokeWidth={2.5} />
              <span>{commentsCount}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export { ListRow };
export type { ListRowProps };

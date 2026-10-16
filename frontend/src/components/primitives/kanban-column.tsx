import * as React from "react";
import { cn } from "cn";

/**
 * C14 — Kanban Column
 * §4 C14: Header: title (H2) + dark circular count pill (#2A2D32, white number, 24px).
 * Column background transparent on canvas; 12px gap between cards; column width 280-320.
 */

interface KanbanColumnProps extends React.ComponentProps<"div"> {
  title: string;
  count: number;
  children: React.ReactNode;
}

const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
  ({ title, count, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="kanban-column"
        className={cn(
          "flex flex-col w-[300px] shrink-0",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3 mb-4 px-1 select-none">
          <h2 className="text-h2 text-ink">{title}</h2>
          <div className="flex size-6 items-center justify-center rounded-pill bg-inverse text-on-inverse text-caption tabular-nums shadow-sm">
            {count}
          </div>
        </div>

        <div className="flex flex-col gap-3 min-h-[150px]">
          {children}
        </div>
      </div>
    );
  }
);
KanbanColumn.displayName = "KanbanColumn";

export { KanbanColumn };
export type { KanbanColumnProps };

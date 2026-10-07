import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import type * as React from "react";

/**
 * C08 — Status Chip
 * §4 C08: Semantic fill + text label always shown.
 * Not started, In progress, Blocked, In review, Done, Verified, Failing, Working.
 */

type StatusType =
  | "not-started"
  | "in-progress"
  | "blocked"
  | "in-review"
  | "done"
  | "verified"
  | "failing"
  | "working";

interface StatusChipProps extends React.ComponentProps<"div"> {
  status: StatusType;
  label?: string; // Optional override
}

const statusConfig: Record<
  StatusType,
  { label: string; className: string; dotClassName: string }
> = {
  "not-started": {
    label: "Not started",
    className: "bg-surface-sunken text-ink",
    dotClassName: "bg-ink-disabled",
  },
  "in-progress": {
    label: "In progress",
    className: "bg-info-fill text-info-text",
    dotClassName: "bg-info-solid",
  },
  blocked: {
    label: "Blocked",
    className: "bg-danger-fill text-danger-text",
    dotClassName: "bg-danger-solid",
  },
  "in-review": {
    label: "In review",
    className: "bg-warning-fill text-warning-text",
    dotClassName: "bg-warning-stroke",
  },
  done: {
    label: "Done",
    className: "bg-success-fill text-success-text",
    dotClassName: "bg-success-solid",
  },
  verified: {
    label: "Verified",
    className: "bg-success-fill text-success-text",
    dotClassName: "bg-success-solid",
  },
  failing: {
    label: "Failing",
    className: "bg-danger-fill text-danger-text",
    dotClassName: "bg-danger-solid",
  },
  working: {
    label: "Working",
    className: "bg-success-fill text-success-text",
    dotClassName: "bg-success-solid",
  },
};

function StatusChip({ status, label, className, ...props }: StatusChipProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      data-slot="status-chip"
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-chip px-2.5 text-caption font-semibold border-none select-none",
        config.className,
        className
      )}
      {...props}
    >
      <span className={cn("size-2 rounded-full shrink-0", config.dotClassName)} />
      {label ?? config.label}
    </Badge>
  );
}

export { StatusChip };
export type { StatusChipProps, StatusType };

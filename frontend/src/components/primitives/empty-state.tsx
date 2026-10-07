import * as React from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

/**
 * C21 — Empty State
 * §4 C21: Centered content, optional illustration/icon, title (H3), 
 * description (Body text), and an optional primary action.
 */

interface EmptyStateProps extends React.ComponentProps<"div"> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  illustrationSrc?: string;
  actionLabel?: string;
  onAction?: () => void;
  dashed?: boolean;
}

function EmptyState({
  title,
  description,
  icon,
  illustrationSrc,
  actionLabel,
  onAction,
  dashed = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-card",
        dashed ? "border-2 border-dashed border-border bg-transparent" : "bg-surface shadow-sm",
        className
      )}
      {...props}
    >
      {illustrationSrc ? (
        <img src={illustrationSrc} alt="" className="h-[120px] mb-6 pointer-events-none" />
      ) : icon ? (
        <div className="flex size-16 items-center justify-center rounded-full bg-surface-sunken text-ink-muted mb-6 [&_svg]:size-8">
          {icon}
        </div>
      ) : null}
      
      <h3 className="text-h3 text-ink mb-2">{title}</h3>
      
      {description && (
        <p className="text-body text-ink-muted max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {actionLabel && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };

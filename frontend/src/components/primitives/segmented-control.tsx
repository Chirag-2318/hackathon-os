import * as React from "react";
import { cn } from "cn";
import { Slot } from "@radix-ui/react-slot";

/**
 * C17 — Segmented Control
 * Container with bg-surface-sunken, p-1, rounded-pill. 
 * Items have bg-white shadow-sm when active.
 */

type SegmentedControlProps = React.ComponentProps<"div">;

function SegmentedControl({ className, children, ...props }: SegmentedControlProps) {
  return (
    <div
      data-slot="segmented-control"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-pill bg-surface-sunken p-1 text-ink-muted",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface SegmentedControlItemProps extends React.ComponentProps<"button"> {
  active?: boolean;
  asChild?: boolean;
}

function SegmentedControlItem({
  active,
  asChild,
  className,
  ...props
}: SegmentedControlItemProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="segmented-control-item"
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-pill px-3 py-1 text-label transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50",
        active && "bg-white text-ink shadow-sm",
        !active && "hover:text-ink hover:bg-black/5",
        className
      )}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
export type { SegmentedControlProps, SegmentedControlItemProps };

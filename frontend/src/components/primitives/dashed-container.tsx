import * as React from "react";
import { cn } from "cn";

/**
 * C10e — Dashed Checklist Container
 * §4 C10e: Outer 1.5px dashed border-strong region (r-card)
 * holding a raised white list card.
 */

interface DashedContainerProps extends React.ComponentProps<"div"> {
  children: React.ReactNode;
}

function DashedContainer({ children, className, ...props }: DashedContainerProps) {
  return (
    <div
      data-slot="dashed-container"
      className={cn(
        "rounded-card border-[1.5px] border-dashed border-border-strong p-3 bg-transparent",
        className
      )}
      {...props}
    >
      <div className="rounded-card bg-surface-raised shadow-e1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export { DashedContainer };
export type { DashedContainerProps };

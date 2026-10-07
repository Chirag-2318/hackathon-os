import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * C12 — Progress Bar
 * §4 C12: 4 or 8px tall, r-pill, track surface-sunken.
 * Fill = category color one step darker. Percent as text nearby (handled by consumer).
 */

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-pill bg-surface-sunken",
  {
    variants: {
      size: {
        sm: "h-1", // 4px
        md: "h-2", // 8px
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface ProgressBarProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  fillColor?: string; // e.g. "bg-info-solid"
}

const ProgressBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressBarProps
>(({ className, value, size, fillColor = "bg-primary", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ size }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 transition-all rounded-pill", fillColor)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
ProgressBar.displayName = ProgressPrimitive.Root.displayName;

export { ProgressBar };
export type { ProgressBarProps };

import { cn } from "cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type * as React from "react";

/**
 * C06 — Icon Button
 * §4 C06: 32/40, circle or rounded square, 20px icon.
 * Tooltip is required. Circular "contact" style variant.
 */
interface IconButtonProps extends React.ComponentProps<"button"> {
  tooltip: string;
  variant?: "circle" | "square";
  size?: "sm" | "md";
}

function IconButton({
  className,
  tooltip,
  variant = "circle",
  size = "md",
  children,
  ...props
}: IconButtonProps) {
  const sizeClass = size === "sm" ? "size-8" : "size-10";
  const shapeClass = variant === "circle" ? "rounded-pill" : "rounded-control";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          data-slot="icon-button"
          className={cn(
            "inline-flex items-center justify-center transition-colors",
            "bg-transparent text-ink hover:bg-lav-50 active:bg-lav-100",
            "outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:text-ink-disabled",
            "[&_svg]:size-5 [&_svg]:stroke-[1.5px]",
            sizeClass,
            shapeClass,
            className
          )}
          aria-label={tooltip}
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export { IconButton };
export type { IconButtonProps };

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type * as React from "react";

/**
 * C07 — Chip / Tag
 * §4 C07: Height 24, padding 8/10, radius r-chip, caption text 12/600.
 * Optional leading dot or icon.
 * Variants: Soft (pastel fill + ink text), Solid (#2A2D32 or #3B63B8 + white text).
 */
const chipVariants = cva(
  "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-chip text-caption whitespace-nowrap select-none",
  {
    variants: {
      variant: {
        soft: "bg-lav-200 text-ink",
        solid: "bg-ink text-white",
        "solid-blue": "bg-info-solid text-white",
      },
    },
    defaultVariants: {
      variant: "soft",
    },
  }
);

interface ChipProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof chipVariants> {
  /** Pastel fill color override (CSS color value from §4.4 tokens) */
  fill?: string;
  /** Leading dot color */
  dotColor?: string;
  /** Leading icon element */
  icon?: React.ReactNode;
}

function Chip({
  className,
  variant,
  fill,
  dotColor,
  icon,
  children,
  style,
  ...props
}: ChipProps) {
  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ variant, className }))}
      style={fill ? { backgroundColor: fill, ...style } : style}
      {...props}
    >
      {dotColor && (
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {icon && <span className="shrink-0 [&_svg]:size-3">{icon}</span>}
      {children}
    </span>
  );
}

export { Chip, chipVariants };
export type { ChipProps };

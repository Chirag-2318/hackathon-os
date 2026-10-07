import * as React from "react"
import { cn } from "cn"

export interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number | string
  variant?: "danger" | "lavender" | "default"
}

export function CountBadge({ count, variant = "default", className, ...props }: CountBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center justify-center rounded-pill px-2 text-xs font-bold whitespace-nowrap",
        {
          "bg-danger-fill text-danger-text": variant === "danger",
          "bg-lav-100 text-lav-700": variant === "lavender",
          "bg-surface-sunken text-ink": variant === "default",
        },
        className
      )}
      {...props}
    >
      {count}
    </span>
  )
}

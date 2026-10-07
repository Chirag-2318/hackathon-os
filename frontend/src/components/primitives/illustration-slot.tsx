import * as React from "react"
import { cn } from "cn"

export interface IllustrationSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: "lavender" | "pink" | "sun" | "cream" | "sky" | "ice" | "green" | "lime" | "peach" | "amber" | "blush" | "violet" | "mint-wash"
  size?: "sm" | "md" | "lg"
}

export function IllustrationSlot({ 
  className, 
  color = "lavender", 
  size = "md",
  children,
  ...props 
}: IllustrationSlotProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-card overflow-hidden",
        {
          "bg-pastel-lavender": color === "lavender",
          "bg-pastel-pink": color === "pink",
          "bg-pastel-sun": color === "sun",
          "bg-pastel-cream": color === "cream",
          "bg-pastel-sky": color === "sky",
          "bg-pastel-ice": color === "ice",
          "bg-pastel-green": color === "green",
          "bg-pastel-lime": color === "lime",
          "bg-pastel-peach": color === "peach",
          "bg-pastel-amber": color === "amber",
          "bg-pastel-blush": color === "blush",
          "bg-pastel-violet": color === "violet",
          "bg-pastel-mint-wash": color === "mint-wash",
        },
        {
          "h-32 w-full": size === "md",
          "h-24 w-full": size === "sm",
          "h-48 w-full": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

"use client"

import * as React from "react"
import { cn } from "cn"
import { Switch as SwitchPrimitive } from "radix-ui"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-4 w-7" : "h-5 w-9",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30 data-checked:bg-primary data-unchecked:bg-muted-foreground/30",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-md ring-0 transition-transform",
          size === "sm"
            ? "size-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0 data-checked:translate-x-3 data-unchecked:translate-x-0"
            : "size-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 data-checked:translate-x-4 data-unchecked:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

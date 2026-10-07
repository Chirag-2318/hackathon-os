import * as React from "react"
import { cn } from "cn"
import { Plus } from "lucide-react"

export interface BlockerFABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
}

export function BlockerFAB({ className, icon, ...props }: BlockerFABProps) {
  return (
    <button
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sidebar text-sidebar-text shadow-e3 hover:bg-sidebar/90 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {icon ?? <Plus className="h-6 w-6" />}
    </button>
  )
}

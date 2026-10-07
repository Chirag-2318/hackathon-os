import * as React from "react"
import { cn } from "cn"

export interface DetailRowProps extends React.ComponentProps<"div"> {
  label: string
  value: React.ReactNode
  leading?: React.ReactNode
  trailing?: React.ReactNode
  status?: React.ReactNode
}

export function DetailRow({
  label,
  value,
  leading,
  trailing,
  status,
  className,
  ...props
}: DetailRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-[56px] w-full items-center gap-3 rounded-control border border-border px-4 py-3 bg-surface",
        className
      )}
      {...props}
    >
      {leading && (
        <div className="shrink-0 flex items-center justify-center text-ink-muted">
          {leading}
        </div>
      )}
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        <span className="text-caption font-semibold text-ink-muted mb-1">
          {label}
        </span>
        <div className="text-body font-bold text-ink flex flex-wrap items-center gap-2">
          {value}
          {status && <span>{status}</span>}
        </div>
      </div>
      {trailing && (
        <div className="shrink-0 flex items-center justify-center">
          {trailing}
        </div>
      )}
    </div>
  )
}

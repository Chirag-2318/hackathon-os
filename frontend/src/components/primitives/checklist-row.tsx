import * as React from "react"
import { cn } from "cn"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock, MapPin } from "lucide-react"

export interface ChecklistRowProps extends React.ComponentProps<"div"> {
  title: string
  metaTime?: string
  metaPlace?: string
  icon?: React.ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function ChecklistRow({
  title,
  metaTime,
  metaPlace,
  icon,
  checked,
  onCheckedChange,
  className,
  ...props
}: ChecklistRowProps) {
  return (
    <div
      className={cn(
        "flex h-14 items-center gap-4 rounded-card px-4 py-3 bg-surface border border-border-strong transition-colors",
        checked && "bg-black/5 opacity-60",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-surface-sunken">
          {icon}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <span
          className={cn(
            "text-body font-bold text-ink truncate leading-tight",
            checked && "line-through text-ink-muted"
          )}
        >
          {title}
        </span>
        {(metaTime || metaPlace) && (
          <div className="flex items-center gap-3 text-caption font-semibold text-ink-muted">
            {metaTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {metaTime}
              </span>
            )}
            {metaPlace && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {metaPlace}
              </span>
            )}
          </div>
        )}
      </div>
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "h-6 w-6 border-2 shrink-0 rounded-md",
          checked && "bg-success-solid border-success-solid text-white"
        )}
      />
    </div>
  )
}

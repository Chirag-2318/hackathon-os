import * as React from "react"
import { cn } from "cn"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"

const bannerVariants = {
  default: "bg-surface-raised text-ink border-none shadow-e3",
  success: "bg-success-fill text-success-text border-success-stroke",
  info: "bg-info-fill text-info-text border-info-stroke",
  warning: "bg-warning-fill text-warning-text border-warning-stroke",
  danger: "bg-danger-fill text-danger-text border-danger-stroke",
}

const iconMap = {
  default: Info,
  success: CheckCircle2,
  info: Info,
  warning: AlertCircle,
  danger: XCircle,
}

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof bannerVariants
  action?: React.ReactNode
}

export function Banner({ className, variant = "default", action, children, ...props }: BannerProps) {
  const Icon = iconMap[variant]

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-4 rounded-pop border",
        bannerVariants[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" />
        <div className="text-body">{children}</div>
      </div>
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

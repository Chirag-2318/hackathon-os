import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-card bg-surface-sunken dark:bg-white/[0.06]", className)}
      {...props}
    />
  )
}

export { Skeleton }

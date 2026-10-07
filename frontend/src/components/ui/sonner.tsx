"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-raised group-[.toaster]:text-ink group-[.toaster]:border-none group-[.toaster]:shadow-e3 group-[.toaster]:rounded-pop",
          description: "group-[.toast]:text-ink-muted",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-success-fill group-[.toaster]:text-success-text",
          error: "group-[.toaster]:bg-danger-fill group-[.toaster]:text-danger-text",
          info: "group-[.toaster]:bg-info-fill group-[.toaster]:text-info-text",
          warning: "group-[.toaster]:bg-warning-fill group-[.toaster]:text-warning-text",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

import * as React from "react"
import { cn } from "cn"
import { Check } from "lucide-react"

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: { label: string; description?: string }[]
  currentStep: number
}

export function Stepper({ steps, currentStep, className, ...props }: StepperProps) {
  return (
    <div className={cn("flex items-center w-full", className)} {...props}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isPending = index > currentStep

        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center relative">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 z-10 transition-colors",
                  isCompleted && "bg-success-fill border-success-fill text-success-text",
                  isActive && "bg-surface-raised border-primary text-primary",
                  isPending && "bg-surface-sunken border-surface-sunken text-ink-muted"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>
              <div className="absolute top-10 text-center w-32">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-ink" : "text-ink-muted"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-ink-muted mt-0.5">{step.description}</p>
                )}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-colors",
                  isCompleted ? "bg-success-fill" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

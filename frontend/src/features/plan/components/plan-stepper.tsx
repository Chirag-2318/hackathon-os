import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface PlanStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: string[];
  currentStep: number;
}

export function PlanStepper({ steps, currentStep, className, ...props }: PlanStepperProps) {
  return (
    <div className={cn('flex flex-col relative', className)} {...props}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div key={step} className="flex relative items-start group">
            {/* The vertical line connecting steps */}
            {index < steps.length - 1 && (
              <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-border z-0">
                {isCompleted && (
                  <motion.div
                    className="w-full bg-success-fill origin-top"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ height: '100%' }}
                  />
                )}
              </div>
            )}

            <div className="flex flex-col items-center z-10 mr-4 pb-12">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 transition-colors duration-200',
                  isCompleted && 'bg-success-fill border-success-fill text-success-text',
                  isActive && 'bg-surface-raised border-primary text-primary',
                  isPending && 'bg-surface-sunken border-surface-sunken text-ink-muted',
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ pathLength: 0, scale: 0.5 }}
                    animate={{ pathLength: 1, scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.2, type: 'spring', bounce: 0.3 }}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>
            </div>

            <div className="pt-1 w-48">
              <p
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive ? 'text-ink' : 'text-ink-muted',
                )}
              >
                {step}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

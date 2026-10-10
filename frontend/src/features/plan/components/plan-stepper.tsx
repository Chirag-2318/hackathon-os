import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export interface PlanStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: string[];
  currentStep: number;
  validatedSteps: boolean[];
  onSelectStep: (index: number) => void;
}

export function PlanStepper({
  steps,
  currentStep,
  validatedSteps,
  onSelectStep,
  className,
  ...props
}: PlanStepperProps) {
  return (
    <div className={cn('flex flex-col select-none', className)} {...props}>
      {steps.map((step, index) => {
        const isCompleted = validatedSteps[index];
        const isActive = index === currentStep;
        const isUnlocked = index === 0 || validatedSteps[index - 1] || isCompleted;
        const isLocked = !isUnlocked;
        const isLast = index === steps.length - 1;

        // Rail color: green if this step is completed, otherwise gray
        const railColor = isCompleted ? '#10B981' : '#E5E7EB';

        return (
          <div
            key={step}
            className="flex relative items-center group h-[76px] cursor-pointer"
            onClick={() => {
              if (isUnlocked) onSelectStep(index);
            }}
          >
            {/* Left 28px Column */}
            <div className="w-[28px] h-[76px] relative flex items-center justify-center shrink-0 mr-4">
              {/* Vertical Rail Segment below circle (drawn strictly between circles) */}
              {!isLast && (
                <svg
                  className="absolute top-0 left-0 w-[28px] h-[76px] pointer-events-none z-0 overflow-visible"
                  viewBox="0 0 28 76"
                >
                  {/* Background gray rail line */}
                  <line
                    x1="14"
                    y1="56"
                    x2="14"
                    y2="96"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-neutral-200 dark:text-neutral-800"
                  />
                  {/* Active/Completed draw-in segment */}
                  {isCompleted && (
                    <motion.line
                      x1="14"
                      y1="56"
                      x2="14"
                      y2="96"
                      stroke="#10B981"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  )}
                </svg>
              )}

              {/* 28px Circle with solid background so nothing ever shows through */}
              <div
                className={cn(
                  'size-[28px] rounded-full flex items-center justify-center relative z-10 transition-all duration-200 select-none shrink-0',
                  isCompleted
                    ? 'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : isActive
                    ? 'bg-card border-2 border-blue-600 text-blue-600 ring-4 ring-blue-500/20 animate-pulse'
                    : isLocked
                    ? 'bg-card border-2 border-border text-muted-foreground opacity-60'
                    : 'bg-card border-2 border-border text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <motion.div
                    className="flex items-center justify-center"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="size-4 stroke-[3]" />
                  </motion.div>
                ) : isLocked ? (
                  <Lock className="size-3 text-muted-foreground" />
                ) : (
                  <span className="text-xs font-bold tabular-nums leading-none">
                    {index + 1}
                  </span>
                )}
              </div>
            </div>

            {/* Label and Helper Text (vertically centered in 76px row, baseline aligned) */}
            <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
              <p
                className={cn(
                  'text-xs transition-colors truncate',
                  isActive
                    ? 'font-bold text-foreground'
                    : isCompleted
                    ? 'font-semibold text-foreground'
                    : 'font-medium text-muted-foreground'
                )}
              >
                {step}
              </p>
              <span className="text-[11px] text-muted-foreground block mt-0.5 truncate">
                {isCompleted ? 'Validated' : isActive ? 'In progress' : isLocked ? 'Locked' : 'Ready'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

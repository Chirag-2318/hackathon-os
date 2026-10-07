import * as React from 'react';
import { type CoreFlowStep } from '@/api/client';
import { ArrowRight } from 'lucide-react';

interface CoreFlowProps {
  steps: CoreFlowStep[];
}

export function CoreFlow({ steps }: CoreFlowProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
      {steps.map((step, index) => (
        <React.Fragment key={step.stepNumber}>
          <div className="flex-1 r-card bg-surface p-4 flex flex-col gap-2 min-h-[120px]">
            <div className="h-6 w-6 rounded-full bg-lav-100 text-lav-900 flex items-center justify-center text-xs font-bold shrink-0">
              {step.stepNumber}
            </div>
            <p className="text-sm font-semibold">{step.description}</p>
          </div>
          {index < steps.length - 1 && (
            <div className="hidden md:flex shrink-0 text-ink-muted">
              <ArrowRight className="h-6 w-6" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

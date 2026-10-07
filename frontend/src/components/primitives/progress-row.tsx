import * as React from 'react';
import { cn } from 'cn';

export interface ProgressRowProps {
  label: string;
  percent: number;
  color?: string; // Optional CSS color value, defaults to a class
  colorClass?: string; // e.g. 'bg-lime-500'
  className?: string;
}

export function ProgressRow({ label, percent, color, colorClass, className }: ProgressRowProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-body min-w-0 flex-[1_1_auto] truncate">{label}</span>
      <div className="flex-[1_1_auto] h-2 rounded-pill bg-surface-sunken overflow-hidden">
        <div 
          className={cn("h-full rounded-pill transition-all duration-500", colorClass || 'bg-success-solid')}
          style={{ 
            width: `${Math.max(0, Math.min(100, percent))}%`,
            ...(color ? { backgroundColor: color } : {})
          }}
        />
      </div>
      <span className="text-body tabular-nums text-right min-w-[44px] shrink-0">{Math.round(percent)}%</span>
    </div>
  );
}

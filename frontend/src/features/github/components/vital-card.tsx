import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VitalCardProps {
  label: string;
  tooltip: string;
  value: React.ReactNode;
  visual: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function VitalCard({
  label,
  tooltip,
  value,
  visual,
  onClick,
  className,
}: VitalCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col justify-between p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer select-none',
        className
      )}
    >
      {/* Top: 12px gray label + info tooltip icon */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="text-[12px] font-medium text-muted-foreground tracking-wide uppercase">
          {label}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground/60 hover:text-muted-foreground transition-colors p-0.5"
            >
              <Info className="size-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-xs font-normal">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Middle: 24px/600 value */}
      <div className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2 mb-2">
        {value}
      </div>

      {/* Bottom: Visual line */}
      <div className="text-xs text-muted-foreground min-h-[20px] flex items-center">
        {visual}
      </div>
    </button>
  );
}

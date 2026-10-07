import * as React from 'react';
import { type PitchSlide } from '@/api/client';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface SlideRailProps {
  slides: PitchSlide[];
  selectedId: string | null;
  coverageStatus: Record<string, 'covered' | 'partly' | 'not_yet'>;
  onSelect: (id: string) => void;
}

export function SlideRail({ slides, selectedId, coverageStatus, onSelect }: SlideRailProps) {
  return (
    <TooltipProvider>
      <div className="w-56 shrink-0 border-r bg-white dark:bg-[#1C1C1E] overflow-y-auto">
        <div className="p-3 space-y-1">
          {slides.map((slide) => {
            const status = coverageStatus[slide.id] ?? 'not_yet';
            return (
              <button
                key={slide.id}
                onClick={() => onSelect(slide.id)}
                className={cn(
                  'w-full text-left px-3 py-3 rounded-lg text-sm transition-colors relative group',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lav-600 focus-visible:ring-offset-2',
                  selectedId === slide.id
                    ? 'bg-lav-100 dark:bg-lav-900/30 border-l-2 border-lav-600'
                    : 'hover:bg-lav-50 dark:hover:bg-slate-800/50'
                )}
              >
                {/* Thumbnail placeholder */}
                <div className="w-full aspect-[16/9] rounded bg-slate-100 dark:bg-slate-800 mb-2 flex items-center justify-center text-[10px] text-slate-500 font-medium">
                  {slide.title}
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          'inline-block w-2 h-2 rounded-full shrink-0',
                          status === 'covered' && 'bg-emerald-500',
                          status === 'partly' && 'bg-amber-500',
                          status === 'not_yet' && 'bg-slate-300 dark:bg-slate-600'
                        )}
                        aria-label={status === 'covered' ? 'Covered' : status === 'partly' ? 'Partly' : 'Not yet'}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {status === 'covered' ? 'Covered' : status === 'partly' ? 'Partly' : 'Not yet'}
                    </TooltipContent>
                  </Tooltip>
                  <span className="font-semibold truncate">{slide.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

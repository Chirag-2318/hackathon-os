import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface CriteriaCoverageMatrixProps {
  rubric: { id: string; name: string }[];
  slides: { id: string; title: string }[];
  coverage: Record<string, string[]>;
}

export function CriteriaCoverageMatrix({ rubric = [], slides = [], coverage = {} }: CriteriaCoverageMatrixProps) {
  const safeRubric = Array.isArray(rubric) ? rubric : [];
  const safeSlides = Array.isArray(slides) ? slides : [];
  const safeCoverage = coverage || {};

  return (
    <TooltipProvider>
      <Card className="p-4 overflow-auto">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Criteria coverage matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 sticky left-0 bg-white dark:bg-[#1C1C1E]">Criterion</th>
                {safeSlides.map((slide) => (
                  <th key={slide.id} className="text-center px-2 py-2 text-xs font-medium text-slate-500 max-w-[80px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block">{slide.title}</span>
                      </TooltipTrigger>
                      <TooltipContent>{slide.title}</TooltipContent>
                    </Tooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {safeRubric.map((criterion) => {
                const coveredSlides = safeCoverage[criterion.id] ?? [];
                const isUncovered = coveredSlides.length === 0;
                return (
                  <tr
                    key={criterion.id}
                    className={cn(
                      'border-b last:border-b-0',
                      isUncovered && 'bg-[#FBD9D7] dark:bg-coral-900/20'
                    )}
                  >
                    <td className={cn(
                      'py-2 pr-4 text-xs font-semibold sticky left-0',
                      isUncovered
                        ? 'bg-[#FBD9D7] dark:bg-coral-900/20 text-coral-700 dark:text-coral-400'
                        : 'bg-white dark:bg-[#1C1C1E]'
                    )}>
                      {criterion.name}
                      {isUncovered && <span className="ml-2 text-[10px] font-normal text-coral-600">(not covered)</span>}
                    </td>
                    {safeSlides.map((slide) => (
                      <td key={slide.id} className="text-center px-2 py-2">
                        {coveredSlides.includes(slide.id) ? (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-lav-600" aria-label={`${criterion.name} covered by ${slide.title}`} />
                        ) : (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" aria-label={`${criterion.name} not covered by ${slide.title}`} />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {safeRubric.filter((c) => (safeCoverage[c.id] ?? []).length === 0).length} of {safeRubric.length} criteria uncovered
        </p>
      </Card>
    </TooltipProvider>
  );
}

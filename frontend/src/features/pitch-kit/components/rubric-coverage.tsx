import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPitchCoverage, type RubricCoverageItem } from '../api/pitch-kit-api';
import { Skeleton } from '@/components/ui/skeleton';

export interface RubricCoverageProps {
  roomId: string;
  onSelectBeat: (beatId: string) => void;
}

export function RubricCoverage({ roomId, onSelectBeat }: RubricCoverageProps) {
  const { data: coverage = [], isLoading } = useQuery({
    queryKey: ['pitch-coverage', roomId],
    queryFn: () => fetchPitchCoverage(roomId),
    staleTime: 20_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 pt-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (coverage.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border pt-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-normal text-foreground">
          Rubric coverage
        </h3>
        <span className="font-mono text-xs text-muted-foreground">
          Automatic keyword matching
        </span>
      </div>

      <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
        {coverage.map((item, idx) => {
          const hasMatches = item.matchingBeats && item.matchingBeats.length > 0;

          return (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-muted-foreground tabular-nums shrink-0 w-8">
                  {item.weight}x
                </span>
                <span className="font-medium text-foreground">{item.criterion}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pl-11 sm:pl-0">
                {hasMatches ? (
                  item.matchingBeats.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onSelectBeat(b.id)}
                      className="px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground font-mono text-[11px] transition-colors cursor-pointer"
                    >
                      {b.title}
                    </button>
                  ))
                ) : (
                  <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    Not mentioned
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

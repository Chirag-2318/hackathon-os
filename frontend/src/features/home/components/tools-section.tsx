import * as React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecommendedTools, type RecommendedTool } from '@/features/prep/api/tools-api';

export function ToolsSection() {
  const { data: tools = [], isLoading } = useQuery<RecommendedTool[]>({
    queryKey: ['recommended-tools'],
    queryFn: fetchRecommendedTools,
    staleTime: 600_000,
  });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-muted-foreground">
          Tools for your stack
        </h2>
      </div>

      <div className="flex flex-col border-t border-black/[0.08] dark:border-white/[0.08]">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 border-b border-black/[0.06] animate-pulse" />
            ))}
          </div>
        ) : (
          tools.slice(0, 4).map(({ tool, reason }) => (
            <a
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between min-h-[44px] py-2 px-1 border-b border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-150"
            >
              <div className="flex flex-col min-w-0 pr-3">
                <div className="flex items-baseline gap-2 truncate">
                  <span className="text-[14px] font-medium text-foreground truncate">
                    {tool.name}
                  </span>
                  <span className="text-[13px] text-muted-foreground truncate hidden sm:inline">
                    · {tool.oneLineUse}
                  </span>
                </div>
                {reason && (
                  <span className="text-[12px] text-muted-foreground leading-tight mt-0.5">
                    {reason}
                  </span>
                )}
              </div>

              <div className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                <ExternalLink className="size-3.5 stroke-[1.5]" />
              </div>
            </a>
          ))
        )}
      </div>

      <div className="pt-1">
        <Link
          to="/app/tools"
          className="text-[13px] font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Tool directory
        </Link>
      </div>
    </section>
  );
}

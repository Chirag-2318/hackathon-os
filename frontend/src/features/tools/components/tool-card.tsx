import { createElement } from 'react';
import { ExternalLink, Check, AlertTriangle } from 'lucide-react';
import { Lozenge } from '@/shared/ui';
import { getToolCategoryMeta } from '../tool-categories';
import { getToolLogo } from '../tool-logos';
import { daysSince, formatCheckedDate } from '@/shared/lib/format';
import type { Tool } from '@/features/prep/api/types';

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const meta = getToolCategoryMeta(tool.category);
  const localLogo = getToolLogo(tool.id);
  const days = daysSince(tool.lastChecked);
  const isStale = days > 90;

  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={`tool-card-${tool.id}`}
      className="group flex flex-col justify-between p-4 rounded-[var(--r-card)] bg-card border border-border hover:border-border-strong hover:bg-hover/30 transition-all duration-150 no-underline text-inherit"
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo / Tile */}
            <div
              className={`size-9 rounded-[10px] flex items-center justify-center shrink-0 ${meta.bgClass}`}
            >
              {localLogo ? (
                <img
                  src={localLogo}
                  alt={`${tool.name} logo`}
                  className="size-5 object-contain"
                />
              ) : (
                createElement(meta.icon, {
                  className: `size-4.5 ${meta.fgClass}`,
                  strokeWidth: 1.75,
                })
              )}
            </div>

            {/* Title & Category */}
            <div className="min-w-0">
              <h3 className="text-[15px] leading-5 font-semibold text-ink truncate group-hover:text-ink">
                {tool.name}
              </h3>
              <div className="mt-0.5">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-[var(--r-tag)] text-[11px] font-medium ${meta.bgClass} ${meta.fgClass}`}
                >
                  {tool.category}
                </span>
              </div>
            </div>
          </div>

          <ExternalLink
            className="size-3.5 text-ink-2 group-hover:text-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 mt-0.5"
            strokeWidth={1.75}
          />
        </div>

        {/* Body row: Description */}
        <p className="mt-3 text-[13px] leading-[18px] text-ink-2 line-clamp-2 min-h-[36px]">
          {tool.oneLineUse}
        </p>
      </div>

      {/* Footer row */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Lozenge variant="neutral">{tool.cost}</Lozenge>
          {tool.license && <Lozenge variant="neutral">{tool.license}</Lozenge>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {tool.verified && (
            <Lozenge variant="success">
              <Check className="size-3 mr-0.5 inline-block stroke-[2.5]" />
              Verified
            </Lozenge>
          )}
          {isStale && (
            <Lozenge variant="warn" title={`Checked ${formatCheckedDate(tool.lastChecked)}`}>
              <AlertTriangle className="size-3 mr-0.5 inline-block stroke-[2]" />
              90d+
            </Lozenge>
          )}
        </div>
      </div>
    </a>
  );
}

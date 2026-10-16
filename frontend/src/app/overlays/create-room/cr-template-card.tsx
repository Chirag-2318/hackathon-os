import type { EventTemplate } from '@/services/types';
import { createElement } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlaybookIcon } from '@/features/playbooks/playbook-icons';

interface CrTemplateCardProps {
  template: EventTemplate;
  isSelected: boolean;
  index: number;
  totalCount: number;
  onSelect: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
}

export function CrTemplateCard({
  template,
  isSelected,
  index,
  onSelect,
  onKeyDown,
}: CrTemplateCardProps) {
  const Icon = getPlaybookIcon(template.id + ' ' + template.name);

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={isSelected ? 0 : -1}
      data-testid={`cr-template-${template.id}`}
      onClick={() => onSelect(template.id)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onSelect(template.id);
        } else {
          onKeyDown(e, index);
        }
      }}
      title={template.name}
      className={cn(
        'relative flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all duration-[80ms]',
        'outline-none focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
        'min-h-[60px]',
        '@reduce-motion:active:scale-100 active:scale-[0.99]',
        isSelected
          ? 'border-ink bg-card'
          : 'border-border bg-card hover:border-border-strong'
      )}
    >
      {/* Icon tile */}
      <div className="size-8 shrink-0 rounded-[10px] bg-shell border border-border flex items-center justify-center">
        {createElement(Icon, {
          className: 'size-4 text-ink stroke-[1.75]',
        })}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-ink leading-snug line-clamp-2">
          {template.name}
        </div>
        <div className="text-[12px] text-ink-2 leading-4 mt-0.5 tabular-nums">
          {template.meta || `${template.durationHours}h · ${template.teamSize} members`}
        </div>
      </div>

      {/* Selected checkmark — top-right */}
      {isSelected && (
        <div
          className={cn(
            'absolute top-2 right-2 size-4 rounded-full bg-selected text-on-selected flex items-center justify-center',
            'transition-opacity duration-100'
          )}
          aria-hidden="true"
        >
          <Check className="size-2.5 text-current stroke-[2.5]" />
        </div>
      )}
    </div>
  );
}

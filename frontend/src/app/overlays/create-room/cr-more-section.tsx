import { useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrMoreSectionProps {
  description: string;
  projectDescription: string;
  onDescriptionChange: (v: string) => void;
  onProjectDescriptionChange: (v: string) => void;
  forceOpen?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const DESC_MAX = 200;
const PROJ_MAX = 500;

export function CrMoreSection({
  description,
  projectDescription,
  onDescriptionChange,
  onProjectDescriptionChange,
  isOpen,
  onToggle,
}: CrMoreSectionProps) {
  const panelId = 'cr-more-panel';

  const textareaClass = cn(
    'w-full min-h-20 py-2 px-3 rounded-[var(--r-control)] bg-card text-[14px] text-ink placeholder:text-ink-3',
    'border border-border-strong transition-colors duration-150 resize-none',
    'hover:border-ink-2',
    'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 focus-visible:border-ink',
    'outline-none'
  );

  return (
    <div className="flex flex-col">
      {/* Disclosure button */}
      <button
        type="button"
        data-testid="cr-more"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1 h-9 px-0 text-[13px] font-medium text-ink cursor-pointer',
          'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 rounded',
          'w-full text-left'
        )}
      >
        <span>More details</span>
        <span className="text-[12px] font-normal text-ink-3 ml-0.5">(optional)</span>
        <ChevronRight
          className={cn(
            'size-4 ml-auto stroke-[1.75] text-ink-2 transition-transform duration-150',
            isOpen && 'rotate-90'
          )}
        />
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div
          id={panelId}
          className="flex flex-col gap-4 pt-3"
        >
          {/* Room description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="cr-desc-input"
                className="text-[13px] font-medium text-ink leading-5"
              >
                Room description{' '}
                <span className="text-[12px] font-normal text-ink-3">(optional)</span>
              </label>
              <span className="text-[12px] text-ink-3 tabular-nums leading-4">
                {description.length}/{DESC_MAX}
              </span>
            </div>
            <textarea
              id="cr-desc-input"
              rows={2}
              maxLength={DESC_MAX}
              placeholder="A brief note about your team workspace or event setup..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className={textareaClass}
            />
          </div>

          {/* Project description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="cr-proj-input"
                className="text-[13px] font-medium text-ink leading-5"
              >
                What are you building?{' '}
                <span className="text-[12px] font-normal text-ink-3">(optional)</span>
              </label>
              <span className="text-[12px] text-ink-3 tabular-nums leading-4">
                {projectDescription.length}/{PROJ_MAX}
              </span>
            </div>
            <textarea
              id="cr-proj-input"
              rows={3}
              maxLength={PROJ_MAX}
              placeholder="What are you building? One or two sentences. You can refine it in the brief."
              value={projectDescription}
              onChange={(e) => onProjectDescriptionChange(e.target.value)}
              className={textareaClass}
            />
          </div>
        </div>
      )}
    </div>
  );
}

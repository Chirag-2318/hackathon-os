import { useRef } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AiGate } from '@/features/ai-gate';

interface CrNameFieldProps {
  value: string;
  onChange: (v: string) => void;
  onClearError: () => void;
  isSuggesting: boolean;
  onSuggest: () => void;
  error?: string;
  touched: boolean;
  onBlur: () => void;
  alternativeNames?: string[];
  onSelectAlternative?: (name: string) => void;
  suggestError?: string | null;
  onRetrySuggest?: () => void;
  aiAllowed?: boolean;
}

const MAX = 60;

export function CrNameField({
  value,
  onChange,
  onClearError,
  isSuggesting,
  onSuggest,
  error,
  touched,
  onBlur,
  alternativeNames = [],
  onSelectAlternative,
  suggestError,
  onRetrySuggest,
  aiAllowed = true,
}: CrNameFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const safeVal = value ?? '';
  const hasError = touched && !!error;

  const suggestButton = (
    <button
      type="button"
      data-testid="cr-suggest"
      aria-label="Suggest a room name"
      onClick={aiAllowed && !isSuggesting ? onSuggest : undefined}
      disabled={isSuggesting || !aiAllowed}
      className={cn(
        'absolute right-1.5 h-7 px-2 rounded-lg flex items-center gap-1',
        'text-[13px] font-medium text-ink',
        'hover:bg-hover transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'cursor-pointer'
      )}
    >
      {isSuggesting ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Sparkles className="size-3.5 stroke-[1.75]" />
      )}
      <span>Suggest</span>
    </button>
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1.5">
        {/* Label row */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="cr-name-input"
            className="text-[13px] font-medium text-ink leading-5"
          >
            Room name
          </label>
          <span className="text-[12px] text-ink-3 tabular-nums leading-4">
            {safeVal.length}/{MAX}
          </span>
        </div>

        {/* Input with inline Suggest */}
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            id="cr-name-input"
            data-testid="cr-name"
            type="text"
            maxLength={MAX}
            placeholder="e.g. Hackathon Build Sprint"
            value={safeVal}
            onChange={(e) => {
              onChange(e.target.value ?? '');
              onClearError();
            }}
            onBlur={onBlur}
            aria-describedby={hasError ? 'cr-name-error' : undefined}
            aria-invalid={hasError}
            className={cn(
              'w-full h-9 px-3 pr-24 rounded-[var(--r-control)] bg-card text-[14px] text-ink placeholder:text-ink-3',
              'border transition-colors duration-150',
              'hover:border-ink-2',
              'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 focus-visible:border-ink',
              'outline-none',
              hasError
                ? 'border-danger'
                : 'border-border-strong'
            )}
          />

          {!aiAllowed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{suggestButton}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI suggestions are restricted or disabled</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <AiGate>
              {suggestButton}
            </AiGate>
          )}
        </div>

        {/* Alternative name chips */}
        {alternativeNames.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs text-ink-2">
            <span className="text-muted-foreground text-[11px]">or try:</span>
            {alternativeNames.map((altName, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectAlternative?.(altName)}
                className="px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted text-[11px] font-medium text-ink border border-border/60 transition-colors cursor-pointer"
              >
                {altName}
              </button>
            ))}
          </div>
        )}

        {/* Inline Suggest Error with Retry */}
        {suggestError && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="size-3.5 shrink-0" />
              <span className="truncate">{suggestError}</span>
            </div>
            {onRetrySuggest && (
              <button
                type="button"
                onClick={onRetrySuggest}
                className="font-semibold underline ml-2 shrink-0 hover:text-red-700 cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Validation error */}
        {hasError && (
          <p id="cr-name-error" className="text-[12px] text-danger leading-4">
            {error}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

import { useRef } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrNameFieldProps {
  value: string;
  onChange: (v: string) => void;
  onClearError: () => void;
  isSuggesting: boolean;
  onSuggest: () => void;
  error?: string;
  touched: boolean;
  onBlur: () => void;
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
}: CrNameFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = touched && !!error;

  return (
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
          {value.length}/{MAX}
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
          placeholder="e.g. Campus Build Sprint 2026"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
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
        <button
          type="button"
          data-testid="cr-suggest"
          aria-label="Suggest a room name"
          onClick={onSuggest}
          disabled={isSuggesting}
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
      </div>

      {/* Validation error */}
      {hasError && (
        <p id="cr-name-error" className="text-[12px] text-danger leading-4">
          {error}
        </p>
      )}
    </div>
  );
}

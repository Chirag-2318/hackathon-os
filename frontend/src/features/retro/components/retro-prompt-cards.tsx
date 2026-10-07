/**
 * RetroPromptCards — S24
 * Three sticky-style cards: Worked, Didn't, Change.
 * React Hook Form + Zod. Answers are plain text (never rendered as HTML).
 * PRD 5b §3.2. [D S24].
 *
 * AC-24-4: Three cards in order Worked, Didn't, Change.
 *           Typed text survives save-error. Answers as plain text.
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RetroAnswers } from '../api/types';
import { CheckCircle2, Loader2 } from 'lucide-react';

/** Zod schema — length limit provisional (OQ-14) */
const retroSchema = z.object({
  worked: z.string().max(2000),
  didnt:  z.string().max(2000),
  change: z.string().max(2000),
});

type RetroFormValues = z.infer<typeof retroSchema>;

/** Pastel fills per card.
 * OQ-14: which pastel per card is not specified.
 * Using cream, blush and sky — do NOT use color to imply meaning [D §10].
 */
const CARD_CONFIG = [
  { key: 'worked' as const, heading: 'Worked',  pastel: 'var(--pastel-cream)'  },
  { key: 'didnt'  as const, heading: "Didn't",  pastel: 'var(--pastel-blush)'  },
  { key: 'change' as const, heading: 'Change',  pastel: 'var(--pastel-sky)'    },
] as const;

interface RetroPromptCardsProps {
  defaultValues: RetroAnswers;
  onSave: (values: RetroAnswers) => Promise<void>;
  disabled?: boolean;
}

export function RetroPromptCards({
  defaultValues,
  onSave,
  disabled,
}: RetroPromptCardsProps) {
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<RetroFormValues>({
    resolver: zodResolver(retroSchema),
    defaultValues: {
      worked: defaultValues.worked,
      didnt:  defaultValues.didnt,
      change: defaultValues.change,
    },
  });

  const onSubmit = async (values: RetroFormValues) => {
    setSaveState('saving');
    try {
      await onSave({
        worked: values.worked,
        didnt:  values.didnt,
        change: values.change,
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
      // AC-24-4: typed text survives save error (form state preserved by react-hook-form)
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Three cards in order [D S24] */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {CARD_CONFIG.map(({ key, heading, pastel }) => (
          <div
            key={key}
            className="rounded-card p-4 flex flex-col gap-2 shadow-e1"
            style={{ backgroundColor: pastel }}
          >
            <label
              htmlFor={`retro-${key}`}
              className="text-label font-semibold text-ink"
            >
              {heading}
            </label>
            <textarea
              id={`retro-${key}`}
              {...register(key)}
              disabled={disabled}
              placeholder={`What ${key === 'worked' ? 'worked well' : key === 'didnt' ? "didn't work" : 'would you change'}?`}
              className={cn(
                'w-full min-h-[120px] rounded-control bg-transparent',
                'text-body text-ink placeholder:text-ink-muted',
                'border border-border-input resize-none p-2',
                'focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]',
                'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              aria-describedby={errors[key] ? `retro-${key}-error` : undefined}
            />
            {errors[key] && (
              <p
                id={`retro-${key}-error`}
                className="text-caption text-danger-text"
                role="alert"
              >
                {errors[key]?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Save controls */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={disabled || saveState === 'saving' || !isDirty}
          size="sm"
        >
          {saveState === 'saving' ? (
            <><Loader2 className="size-4 mr-1.5 animate-spin" /> Saving…</>
          ) : 'Save'}
        </Button>

        {saveState === 'saved' && (
          <span className="flex items-center gap-1.5 text-caption text-success-text">
            <CheckCircle2 className="size-4" />
            Saved
          </span>
        )}

        {saveState === 'error' && (
          <span className="text-caption text-danger-text" role="alert">
            Save failed. Your text is preserved — try again.
          </span>
        )}
      </div>
    </form>
  );
}

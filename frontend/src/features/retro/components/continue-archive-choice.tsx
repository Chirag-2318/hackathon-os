/**
 * ContinueArchiveChoice — S24
 * Two big cards: Continue and Archive. Radio-group semantics.
 * Choosing Continue opens the TwoWeekPlanCard (expand pattern).
 * PRD 5b §3.2. [D S24].
 *
 * AC-24-5: Two cards, one selectable at a time, selected state not by color alone.
 *           Continue → opens plan card. Archive → no assertion (OQ-15).
 */
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Archive, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DecisionChoice, TwoWeekPlan } from '../api/types';

interface DecisionCardProps {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function DecisionCard({ id, label, description, icon, selected, onSelect, disabled }: DecisionCardProps) {
  return (
    <button
      id={id}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex-1 flex items-start gap-3 p-5 rounded-card border-2 transition-colors text-left',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
        'min-h-[80px]',
        selected
          ? 'border-lav-600 bg-lav-50'
          : 'border-border bg-surface-raised hover:border-border-strong hover:bg-hover-row',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="shrink-0 mt-0.5 text-ink-muted" aria-hidden="true">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-strong text-ink">{label}</p>
        <p className="text-caption text-ink-muted mt-0.5">{description}</p>
      </div>
      {/* Non-color selection indicator [D §10] */}
      {selected && (
        <CheckCircle2
          className="size-5 shrink-0 text-lav-600"
          aria-label="Selected"
        />
      )}
    </button>
  );
}

interface TwoWeekPlanCardProps {
  plan: TwoWeekPlan;
}

function TwoWeekPlanCard({ plan }: TwoWeekPlanCardProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
      transition={prefersReduced
        ? { duration: 0.16 }
        : { type: 'spring', stiffness: 158, damping: 25, mass: 1 }
      }
      className="overflow-hidden"
    >
      <motion.div
        initial={prefersReduced ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: prefersReduced ? 0 : 0.06, duration: 0.16 }}
        className="mt-4 bg-surface-raised rounded-card p-5 shadow-e1"
      >
        <h3 className="text-h3 text-ink mb-4">2-week plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(['week1', 'week2'] as const).map((week, wi) => (
            <div key={week}>
              <p className="text-label font-semibold text-ink-muted mb-2">
                Week {wi + 1}
              </p>
              <ul className="flex flex-col gap-2">
                {plan[week].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-body text-ink">
                    <span className="text-caption text-ink-muted tabular-nums mt-0.5 w-4 shrink-0">
                      {i + 1}.
                    </span>
                    {/* Render as plain text — content is trusted fixture data */}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ContinueArchiveChoiceProps {
  currentDecision: DecisionChoice;
  plan: TwoWeekPlan;
  onDecide: (choice: 'continue' | 'archive') => Promise<void>;
  disabled?: boolean;
}

export function ContinueArchiveChoice({
  currentDecision,
  plan,
  onDecide,
  disabled,
}: ContinueArchiveChoiceProps) {
  const [selected, setSelected] = useState<DecisionChoice>(currentDecision);

  const handleSelect = async (choice: 'continue' | 'archive') => {
    setSelected(choice);
    try {
      await onDecide(choice);
    } catch {
      // Keep the selection in UI even if save fails
    }
  };

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Continue or archive decision"
        className="flex flex-col sm:flex-row gap-3"
      >
        <DecisionCard
          id="decision-continue"
          label="Continue"
          description="Keep building on this project after the event."
          icon={<ArrowRight className="size-5" />}
          selected={selected === 'continue'}
          onSelect={() => handleSelect('continue')}
          disabled={disabled}
        />
        <DecisionCard
          id="decision-archive"
          label="Archive"
          description="Archive the project and preserve the record."
          icon={<Archive className="size-5" />}
          selected={selected === 'archive'}
          onSelect={() => handleSelect('archive')}
          disabled={disabled}
        />
      </div>

      {/* 2-week plan opens on Continue [D S24] */}
      <AnimatePresence>
        {selected === 'continue' && (
          <TwoWeekPlanCard plan={plan} />
        )}
      </AnimatePresence>
    </div>
  );
}

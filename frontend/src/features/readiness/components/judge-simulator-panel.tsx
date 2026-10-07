/**
 * JudgeSimulatorPanel — S23
 * Surface-raised card: disclaimer chip, score bars, likely questions,
 * and the free-mode Prompt Bridge pattern (reused from plan feature).
 * PRD 5b §3.1. [D S23].
 *
 * AC-23-4: Chip "Estimate, not a prediction" whenever scores/questions visible.
 * AC-23-5: One bar per criterion, 8px, r-pill, track surface-sunken, score as text.
 * AC-23-6: Likely questions truncate with tooltip.
 * AC-23-7: Existing PromptBridgePanel imported, never re-implemented.
 * AC-23-10: Validation failure shows pass/fail rows and "Copy repair prompt".
 */
import { Chip } from '@/components/primitives/chip';
import { EmptyState } from '@/components/primitives/empty-state';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PromptBridgePanel } from '@/features/plan/components/prompt-bridge-panel';
import { validateSimulatorAnswer } from '../api/readiness-api';
import type { SimulatorData, ValidateResult } from '../api/types';
import { RefreshCw } from 'lucide-react';

const SIMULATOR_PROMPT = `You are simulating a judge at the Campus Build Sprint 2026 hackathon.
Team: Team Kaveri (Aarav Mehta, Ishita Rao, Kabir Nair, Meera Iyer, Rohan Das, Tanvi Kulkarni)
Project: MessMeter — a tool that tells mess managers how many meals to cook tomorrow, for college hostels.

Rubric:
- Innovation 25 pts
- Feasibility 20 pts
- Impact 20 pts
- Technical depth 15 pts
- UX 10 pts
- Presentation 10 pts

Please return:
1. A score for each criterion (points out of weight) with one-sentence reasoning.
2. Five likely judge questions you would ask this team.

Note: This is an estimate, not a prediction. Results may differ from actual judging.`;

interface ScoreBarsProps {
  scores: SimulatorData['scores'];
}

function ScoreBars({ scores }: ScoreBarsProps) {
  return (
    <div className="flex flex-col gap-2" aria-label="Estimated scores per criterion">
      {scores.map((s) => {
        const pct = Math.round((s.score / s.weight) * 100);
        return (
          <div key={s.criterion} className="flex items-center gap-2">
            <span className="text-label text-ink w-32 shrink-0 truncate">{s.criterion}</span>
            <div
              className="flex-1 h-2 rounded-pill bg-surface-sunken overflow-hidden"
              role="progressbar"
              aria-valuenow={s.score}
              aria-valuemin={0}
              aria-valuemax={s.weight}
              aria-label={`${s.criterion}: ${s.score} of ${s.weight}`}
            >
              <div
                className="h-full rounded-pill bg-lav-600 transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-caption tabular-nums text-ink-muted w-14 text-right shrink-0">
              {s.score}/{s.weight}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface LikelyQuestionsListProps {
  questions: string[];
}

function LikelyQuestionsList({ questions }: LikelyQuestionsListProps) {
  return (
    <ol className="flex flex-col gap-2 list-none" aria-label="Likely judge questions">
      {questions.map((q, i) => (
        <li key={i} className="flex gap-2 items-start">
          <span className="text-caption font-bold text-ink-muted tabular-nums shrink-0 mt-0.5 w-5">
            {i + 1}.
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-body text-ink line-clamp-2 leading-snug">{q}</p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{q}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ol>
  );
}

interface JudgeSimulatorPanelProps {
  simulator: SimulatorData;
  roomId: string;
  isError?: boolean;
  onRetry?: () => void;
}

export function JudgeSimulatorPanel({
  simulator,
  roomId,
  isError,
  onRetry,
}: JudgeSimulatorPanelProps) {
  const hasResults = simulator.scores.length > 0 || simulator.likelyQuestions.length > 0;

  const handleValidate = async (content: string): Promise<ValidateResult> => {
    return validateSimulatorAnswer(roomId, content);
  };

  if (isError) {
    return (
      <div className="bg-surface-raised rounded-card p-6 shadow-e1 flex flex-col gap-4">
        <h2 className="text-h3 text-ink">Judge Simulator</h2>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-body text-ink-muted">Could not load the simulator.</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="size-4 mr-1.5" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised rounded-card p-6 shadow-e1 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-h3 text-ink">Judge Simulator</h2>
        {/* AC-23-4: Disclaimer chip always visible when scores or questions visible */}
        {hasResults && (
          <Chip variant="soft" fill="var(--pastel-amber)">
            Estimate, not a prediction
          </Chip>
        )}
      </div>

      {/* Free-mode: Prompt Bridge (reused component, AC-23-7) */}
      {simulator.mode === 'free' && !hasResults && (
        <div className="flex flex-col gap-4">
          {/* Disclaimer chip always shown when showing the bridge */}
          <Chip variant="soft" fill="var(--pastel-amber)">
            Estimate, not a prediction
          </Chip>
          <p className="text-caption text-ink-muted">
            This prompt contains your idea and rubric text. It goes to the AI service you paste it into.
          </p>
          <PromptBridgePanel
            stepId="sim"
            stepName="Simulator"
            promptText={SIMULATOR_PROMPT}
            onValidate={handleValidate}
            onSuccess={() => {
              // Scores will appear after successful validation via refetch
            }}
          />
        </div>
      )}

      {/* Results section */}
      {hasResults && (
        <div className="flex flex-col gap-5">
          {/* Score bars */}
          {simulator.scores.length > 0 && (
            <section>
              <h3 className="text-label font-semibold text-ink mb-3">
                Estimated scores
              </h3>
              <ScoreBars scores={simulator.scores} />
              <p className="text-caption text-ink-muted mt-2">
                No total score is shown. Scores are estimates only.
              </p>
            </section>
          )}

          {/* Likely questions */}
          {simulator.likelyQuestions.length > 0 && (
            <section>
              <h3 className="text-label font-semibold text-ink mb-3">
                Likely questions
              </h3>
              <LikelyQuestionsList questions={simulator.likelyQuestions} />
            </section>
          )}

          {/* Disclaimer chip anchored at bottom too */}
          <Chip variant="soft" fill="var(--pastel-amber)" className="self-start">
            Estimate, not a prediction
          </Chip>
        </div>
      )}

      {/* Empty state when not started and not free-mode bridge */}
      {!hasResults && simulator.mode !== 'free' && (
        <EmptyState
          title="Simulator not run"
          description="Run the Judge Simulator to see estimated scores and likely questions."
          dashed
        />
      )}
    </div>
  );
}

export function JudgeSimulatorPanelSkeleton() {
  return (
    <div className="bg-surface-raised rounded-card p-6 shadow-e1 flex flex-col gap-5">
      <Skeleton className="h-6 w-40" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-2 flex-1 rounded-pill" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

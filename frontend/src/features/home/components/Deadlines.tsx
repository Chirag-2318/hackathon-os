import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CalendarRange, Check, CheckCircle2, Circle, ListOrdered } from 'lucide-react';
import { TagChip, TimeChip, TrayCard } from './HomeDesignSystem';
import { HomeContext } from '../home-page';
import { formatDuration, getServerNowMs } from '@/utils/time';

interface DeadlineItem {
  id?: string;
  title: string;
  helper?: string;
  tag?: string;
  dueAt?: string;
  done?: boolean;
}

function computeTimeLeftText(dueAt?: string): { text: string; urgent: boolean } {
  if (!dueAt) return { text: '—', urgent: false };
  const dueMs = new Date(dueAt).getTime();
  const diffSec = Math.max(0, Math.floor((dueMs - getServerNowMs()) / 1000));
  const text = formatDuration(diffSec);
  const urgent = diffSec < 3600 && diffSec > 0;
  return { text, urgent };
}

function DeadlineRow({ deadline }: { deadline: DeadlineItem }) {
  const { text: timeRemainingText, urgent } = computeTimeLeftText(deadline.dueAt);

  return (
    <div
      className={cn(
        'w-full flex items-start gap-4 px-6 py-4 border-b border-[var(--color-home-hairline)] last:border-b-0 text-left transition-colors duration-[150ms]',
        deadline.done && 'opacity-50'
      )}
    >
      <div className="mt-0.5 shrink-0">
        <div
          className={cn(
            'w-6 h-6 rounded-[var(--radius-home-checkbox)] border flex items-center justify-center transition-colors',
            deadline.done
              ? 'bg-[var(--color-home-text-primary)] border-[var(--color-home-text-primary)]'
              : 'bg-[#F1F1F1] border-[#E4E4E4]'
          )}
        >
          {deadline.done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className={cn(
              'text-[16px] font-[500] text-[var(--color-home-text-primary)]',
              deadline.done && 'line-through'
            )}
          >
            {deadline.title}
          </span>
          {deadline.tag && <TagChip label={deadline.tag} color="blue" />}
        </div>
        {deadline.helper && (
          <div className="text-[14px] text-[var(--color-home-text-secondary)] font-[400]">
            {deadline.helper}
          </div>
        )}
      </div>

      <TimeChip timeRemaining={timeRemainingText} urgent={urgent} />
    </div>
  );
}

export function Deadlines() {
  const navigate = useNavigate();
  const { homeData } = useContext(HomeContext);
  const selected = homeData?.selected;
  const stage = (selected?.stage || '').toLowerCase();
  const isPlanning = selected?.variant === 'planning' || ['brief', 'ideate', 'plan'].includes(stage);
  const roomId = selected?.roomId || selected?.id;

  if (isPlanning) {
    const steps = [
      {
        id: 'brief',
        title: 'Brief',
        helper: 'Add hackathon brief and invite team',
        path: `/app/room/${roomId}/brief`,
        status: stage === 'brief' ? (selected?.briefDone ? 'done' : 'current') : 'done',
      },
      {
        id: 'ideate',
        title: 'Ideate',
        helper: 'Collect ideas and pick winners',
        path: `/app/room/${roomId}/ideate`,
        status: stage === 'brief' ? 'upcoming' : stage === 'ideate' ? (selected?.ideationDone ? 'done' : 'current') : 'done',
      },
      {
        id: 'plan',
        title: 'Plan',
        helper: 'Turn idea into tasks & architecture',
        path: `/app/room/${roomId}/plan`,
        status: ['brief', 'ideate'].includes(stage) ? 'upcoming' : stage === 'plan' ? 'current' : 'done',
      },
      {
        id: 'build',
        title: 'Build',
        helper: 'Start build sprint and track board',
        path: `/app/room/${roomId}/build`,
        status: stage === 'build' ? 'current' : 'upcoming',
      },
    ];

    const doneCount = steps.filter((s) => s.status === 'done').length;
    const progressPercent = Math.round((doneCount / steps.length) * 100);

    return (
      <div className="w-full h-full flex flex-col min-w-0">
        <TrayCard
          footerLeftLabel="Planning journey"
          footerRightLabel=""
          footerRightValue={`${doneCount} of 4 complete`}
          progressPercent={progressPercent}
        >
          <div className="p-6 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <ListOrdered className="w-5 h-5 text-[var(--color-home-text-secondary)]" />
              <h2 className="text-[20px] font-[600] text-[var(--color-home-text-primary)]">
                Next steps
              </h2>
            </div>
          </div>

          <div className="flex flex-col min-h-[140px]">
            {steps.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => roomId && navigate(st.path)}
                className="w-full flex items-start gap-4 px-6 py-3.5 border-b border-[var(--color-home-hairline)] last:border-b-0 text-left transition-colors hover:bg-black/[0.02] cursor-pointer"
              >
                <div className="mt-1 shrink-0">
                  {st.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : st.status === 'current' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--color-home-accent)] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-home-accent)]" />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      'text-[15px] font-[500]',
                      st.status === 'done' ? 'text-[var(--color-home-text-secondary)] line-through' : 'text-[var(--color-home-text-primary)] font-[600]'
                    )}>
                      {st.title}
                    </span>
                    {st.status === 'current' && <TagChip label="CURRENT" color="blue" />}
                  </div>
                  <div className="text-[13px] text-[var(--color-home-text-secondary)]">
                    {st.helper}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </TrayCard>
      </div>
    );
  }

  const rawDeadlines: DeadlineItem[] = selected?.deadlines || [];

  const sortedDeadlines = [...rawDeadlines].sort((a, b) => {
    if (a.done === b.done) return 0;
    return a.done ? 1 : -1;
  });

  const totalCount = sortedDeadlines.length;
  const doneCount = sortedDeadlines.filter((d) => d.done).length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;

  return (
    <div className="w-full h-full flex flex-col min-w-0">
      <TrayCard
        footerLeftLabel="Submission checklist"
        footerRightLabel=""
        footerRightValue={totalCount > 0 ? `${doneCount} of ${totalCount}` : 'All caught up'}
        progressPercent={progressPercent}
      >
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <CalendarRange className="w-5 h-5 text-[var(--color-home-text-secondary)]" />
            <h2 className="text-[20px] font-[600] text-[var(--color-home-text-primary)]">
              Deadlines
            </h2>
          </div>
        </div>

        <div className="flex flex-col min-h-[140px]">
          {sortedDeadlines.length > 0 ? (
            sortedDeadlines.map((dl, idx) => (
              <DeadlineRow key={dl.id || `${dl.title}-${idx}`} deadline={dl} />
            ))
          ) : (
            <div className="p-6 text-center text-sm text-[var(--color-home-text-secondary)]">
              No pending deadlines for this phase.
            </div>
          )}
        </div>
      </TrayCard>
    </div>
  );
}

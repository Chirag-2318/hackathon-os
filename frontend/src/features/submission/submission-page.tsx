import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSubmission } from '@/api/client';
import type { SubmissionResponse, SubmissionDraft, SubmissionGroup } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChecklistGroup } from './components/checklist-group';
import { SubmissionDraftForm } from './components/submission-draft-form';
import { LinkCheckTable } from './components/link-check-table';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Send } from 'lucide-react';

const COPY_TODO_EMPTY = 'No submission checklist found. Start by setting up rules in the Brief.';
const COPY_TODO_ERROR = 'Could not load the submission checklist.';
const COPY_TODO_DISABLED_REASON = 'Leader only';

function parseISODuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseFloat(match[3] || '0');
  return h * 3600 + m * 60 + Math.floor(s);
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function SubmissionPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SubmissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    fetchSubmission(roomId)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [roomId]);

  // Countdown timer
  const initialSeconds = data ? parseISODuration(data.deadlineOffset) : 0;
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!data) return;
    setRemainingSeconds(parseISODuration(data.deadlineOffset));
  }, [data]);

  useEffect(() => {
    if (remainingSeconds <= 0 || submitted) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds, submitted]);

  const isLastHour = remainingSeconds > 0 && remainingSeconds <= 3600;

  const doneCount = useMemo(() => data?.items.filter((i) => i.done).length ?? 0, [data]);
  const totalCount = data?.items.length ?? 0;

  const groups: SubmissionGroup[] = ['required', 'team', 'verification'];

  const handleToggle = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === id && item.group !== 'verification'
            ? { ...item, done: !item.done }
            : item
        ),
      };
    });
  };

  const handleDraftChange = (field: keyof SubmissionDraft, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        draft: { ...prev.draft, [field]: value },
      };
    });
  };

  const handleVerifyAndSubmit = () => {
    setVerifying(true);
    // Simulate verification
    setTimeout(() => {
      setVerifying(false);
      setSubmitted(true);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] text-center">
        <p className="text-sm text-slate-500 mb-4">{COPY_TODO_ERROR}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Last hour banner */}
      {isLastHour && !submitted && (
        <div
          className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-6 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-200"
          role="alert"
          aria-live="polite"
        >
          Last hour. Only verification and submission from here.
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Hero Panel */}
              <Card
                className={cn(
                  'p-6 rounded-2xl transition-colors duration-500',
                  submitted
                    ? 'bg-white dark:bg-[#1C1C1E]'
                    : isLastHour
                      ? 'bg-[#2A2D32] text-white'
                      : 'bg-[#AEE6FF] dark:bg-[#1a3a4a]'
                )}
              >
                {submitted ? (
                  <div className="flex flex-col items-center py-6 gap-4">
                    <div className="h-16 w-16 rounded-full border-4 border-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-bold" aria-live="polite">Submitted</h2>
                    <Button onClick={() => navigate(`/app/room/${roomId}/retro`)}>
                      Start retro
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className={cn('h-5 w-5', isLastHour ? 'text-white/80' : 'text-slate-600')} />
                      <div>
                        <p className={cn('text-xs', isLastHour ? 'text-white/60' : 'text-slate-500')}>
                          Submit in
                        </p>
                        <p className="text-[40px] font-extrabold tabular-nums leading-none tracking-tight">
                          {formatCountdown(remainingSeconds)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleVerifyAndSubmit}
                      disabled={verifying || error}
                      className="rounded-full px-6"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {verifying ? 'Verifying…' : 'Verify & submit'}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Checklist Groups */}
              {groups.map((group) => {
                const groupItems = data.items.filter((i) => i.group === group);
                if (groupItems.length === 0) return null;
                return (
                  <ChecklistGroup
                    key={group}
                    group={group}
                    items={groupItems}
                    onToggle={handleToggle}
                  />
                );
              })}

              {/* Submission Draft */}
              <SubmissionDraftForm
                draft={data.draft}
                onChange={handleDraftChange}
                disabled={submitted}
              />
            </div>

            {/* Right column */}
            <div className="space-y-6 hidden lg:block">
              {/* Judge View */}
              <Card className="p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Judge View</h3>
                  <span className="text-[10px] text-slate-400">60-second scan</span>
                </div>
                <div className="border rounded-lg p-4 bg-white dark:bg-[#1C1C1E] text-xs space-y-3">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">What it does</p>
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{data.draft.whatItDoes}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Why it matters</p>
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{data.draft.whyItMatters}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">How we built it</p>
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{data.draft.howWeBuiltIt}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Challenges</p>
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{data.draft.challenges}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">What's next</p>
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{data.draft.whatsNext}</p>
                  </div>
                </div>
              </Card>

              {/* Link Check Table */}
              <LinkCheckTable rows={data.linkCheck} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Progress Bar */}
      {!submitted && (
        <div className="sticky bottom-0 border-t bg-white dark:bg-[#1C1C1E] shadow-[0_-2px_8px_rgba(0,0,0,0.05)] px-6 py-3 flex items-center gap-4 z-10">
          <span className="text-sm font-medium tabular-nums">
            {doneCount} of {totalCount} done
          </span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-lav-600 transition-all duration-300"
              style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
          <Button
            onClick={handleVerifyAndSubmit}
            disabled={verifying || error}
            className="rounded-full px-5"
          >
            <Send className="h-4 w-4 mr-2" />
            {verifying ? 'Verifying…' : 'Verify & submit'}
          </Button>
        </div>
      )}
    </div>
  );
}

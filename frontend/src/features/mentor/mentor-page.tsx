/**
 * S30 MentorPage — read-only mentor view.
 * Route: /mentor/:token  (entry: OQ-6 unresolved)
 * Source: design.md §6 S30; PRD Phase 6b §3.2; animations.md §6.2 S30
 *
 * MentorShell: reduced sidebar (Summary | Plan | Board snapshot | Ask),
 * ReadOnlyChip in top bar, no edit controls anywhere.
 * AskMentorCard: context-summary display + question field + stubbed submit.
 * States: loading, error, offline, empty frames for Summary/Plan/Board.
 */
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Banner } from '@/components/primitives/banner';
import { EmptyState } from '@/components/primitives/empty-state';
import { COPY } from '@/shared/constants/copy';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { BookOpen, Map, LayoutDashboard, HelpCircle, RefreshCw, Lock } from 'lucide-react';
import { cn } from 'cn';
import type { MentorContextResponse, MentorNavItem } from './api/types';

// ── API ──────────────────────────────────────────────────────────

async function fetchMentorContext(token: string): Promise<MentorContextResponse> {
  const res = await fetch(`/api/v1/mentor/${token}/context`);
  if (!res.ok) throw new Error('Failed to load mentor context');
  return res.json() as Promise<MentorContextResponse>;
}

async function submitAsk(token: string, question: string): Promise<void> {
  const res = await fetch(`/api/v1/mentor/${token}/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error('Submit failed');
}

// ── Nav items ────────────────────────────────────────────────────

const NAV_ITEMS: { id: MentorNavItem; label: string; icon: ReactNode }[] = [
  { id: 'summary', label: 'Summary', icon: <BookOpen className="size-4" /> },
  { id: 'plan', label: 'Plan', icon: <Map className="size-4" /> },
  { id: 'board', label: 'Board snapshot', icon: <LayoutDashboard className="size-4" /> },
  { id: 'ask', label: 'Ask', icon: <HelpCircle className="size-4" /> },
];

// ── ReadOnlyChip ─────────────────────────────────────────────────

/** Non-interactive status chip using Soft variant tokens (lav-200 fill) */
function ReadOnlyChip() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-pill bg-lav-200 text-lav-800 text-label px-3 py-1"
      role="status"
      aria-label="Read-only view"
    >
      <Lock className="size-3" aria-hidden />
      {COPY.mentor.readOnlyChipLabel}
    </span>
  );
}

// ── MentorSidebar ────────────────────────────────────────────────

interface MentorSidebarProps {
  active: MentorNavItem;
  onSelect: (item: MentorNavItem) => void;
}

function MentorSidebar({ active, onSelect }: MentorSidebarProps) {
  return (
    <nav
      className="w-[220px] shrink-0 flex flex-col bg-sidebar border-r border-border py-4 gap-1 px-2"
      aria-label="Mentor navigation"
      id="mentor-sidebar"
    >
      {NAV_ITEMS.map(({ id, label, icon }) => (
        <button
          key={id}
          id={`mentor-nav-${id}`}
          onClick={() => onSelect(id)}
          aria-current={active === id ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-control text-body text-left transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
            active === id
              ? 'bg-lav-100 text-lav-800 font-semibold'
              : 'text-sidebar-text hover:bg-sidebar-hover',
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </nav>
  );
}

// ── Content frames ───────────────────────────────────────────────

/** Empty frame for Summary / Plan / Board snapshot (OQ-5) */
function PlaceholderFrame({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="flex-1 flex flex-col p-6">
      <h2 className="text-h2 text-ink mb-4">{label}</h2>
      <EmptyState
        icon={<BookOpen />}
        title={placeholder}
        id={`mentor-frame-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
    </div>
  );
}

// ── AskMentorCard ────────────────────────────────────────────────

interface AskMentorCardProps {
  token: string;
  context: MentorContextResponse['context'] | undefined;
  isContextLoading: boolean;
  isContextError: boolean;
  onRetry: () => void;
}

function AskMentorCard({ token, context, isContextLoading, isContextError, onRetry }: AskMentorCardProps) {
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { mutate: doAsk, isPending } = useMutation({
    mutationFn: (q: string) => submitAsk(token, q),
    onSuccess: () => setSubmitted(true),
  });

  if (isContextLoading) {
    return (
      <div className="flex-1 flex flex-col p-6 gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (isContextError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-body text-ink-muted">{COPY.mentor.errorMessage}</p>
        <Button variant="outline" onClick={onRetry} id="mentor-ask-retry-btn">
          <RefreshCw className="size-4 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 gap-6 max-w-2xl" id="mentor-ask-card">
      <h2 className="text-h2 text-ink">Ask a mentor</h2>

      {/* Context summary — display-only, packaged by backend */}
      {context && (
        <div className="rounded-card bg-surface-raised border border-border p-4 flex flex-col gap-3 shadow-e1">
          <h3 className="text-body-strong text-ink">Context snapshot</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body">
            <dt className="text-ink-muted">Team</dt>
            <dd className="text-ink">{context.teamName}</dd>
            <dt className="text-ink-muted">Phase</dt>
            <dd className="text-ink">{context.currentPhase}</dd>
            <dt className="text-ink-muted">Problem</dt>
            <dd className="text-ink">{context.problemStatement}</dd>
            <dt className="text-ink-muted">Rubric</dt>
            <dd className="text-ink">
              {context.rubricItems.map(r => `${r.name} (${r.weightPercent}%)`).join(' · ')}
            </dd>
          </dl>
          <p className="text-caption text-ink-muted">
            Snapshotted {new Date(context.snapshotAt).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Question field */}
      {!submitted ? (
        <div className="flex flex-col gap-3">
          <label htmlFor="mentor-question" className="text-body-strong text-ink">
            {COPY.mentor.askLabel}
          </label>
          <textarea
            id="mentor-question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={COPY.mentor.askPlaceholder}
            rows={4}
            className="w-full rounded-control border border-border bg-surface p-3 text-body text-ink placeholder:text-ink-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          />
          <Button
            id="mentor-ask-submit-btn"
            onClick={() => question.trim() && doAsk(question.trim())}
            disabled={!question.trim() || isPending}
            className="self-start"
          >
            {isPending ? 'Sending…' : COPY.mentor.askSubmitLabel}
          </Button>
        </div>
      ) : (
        <div className="rounded-card bg-surface-raised border border-success-stroke p-4 text-body text-ink">
          {COPY.mentor.askSubmitSuccess}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────

export function MentorPage() {
  const { token } = useParams<{ token: string }>();
  const effectiveToken = token ?? 'demo-token'; // OQ-6

  const [activeNav, setActiveNav] = useState<MentorNavItem>('summary');
  const isOnline = useIsOnline();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['mentorContext', effectiveToken],
    queryFn: () => fetchMentorContext(effectiveToken),
  });

  // animations.md §6.2 S30: Read-only chip enters once (fade on mount).
  const [chipVisible, setChipVisible] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setChipVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-sidebar shrink-0" id="mentor-topbar">
        <div className="flex items-center gap-3">
          <span className="text-body-strong text-ink">{data?.context.teamName ?? 'Mentor View'}</span>
        </div>
        {/* Read-only chip — fade entrance per animations §6.2 S30 */}
        <div
          className={cn(
            'transition-opacity duration-[160ms]',
            chipVisible ? 'opacity-100' : 'opacity-0',
          )}
        >
          <ReadOnlyChip />
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        <MentorSidebar active={activeNav} onSelect={setActiveNav} />

        <main className="flex-1 overflow-y-auto flex flex-col">
          {/* Offline banner */}
          {!isOnline && (
            <Banner variant="warning" className="m-4">
              {COPY.mentor.offlineBanner}
            </Banner>
          )}

          {/* Content frames — no edit controls on any */}
          {activeNav === 'summary' && (
            <PlaceholderFrame label="Summary" placeholder={COPY.mentor.summaryFramePlaceholder} />
          )}
          {activeNav === 'plan' && (
            <PlaceholderFrame label="Plan" placeholder={COPY.mentor.planFramePlaceholder} />
          )}
          {activeNav === 'board' && (
            <PlaceholderFrame label="Board snapshot" placeholder={COPY.mentor.boardFramePlaceholder} />
          )}
          {activeNav === 'ask' && (
            <AskMentorCard
              token={effectiveToken}
              context={data?.context}
              isContextLoading={isLoading}
              isContextError={isError}
              onRetry={refetch}
            />
          )}
        </main>
      </div>
    </div>
  );
}

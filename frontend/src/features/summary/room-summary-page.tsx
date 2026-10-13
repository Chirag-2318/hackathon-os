import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/design/api';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  Clock, Users, CheckCircle2, Copy, Printer, ExternalLink,
  Presentation, Video, Globe, Sparkles, AlertCircle, GitBranch
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TeamMemberSummary {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
}

interface TimelineMilestones {
  roomCreated?: string;
  firstTaskCompleted?: string;
  planValidated?: string;
  firstDemoRecorded?: string;
  submissionStarted?: string;
  submittedAt?: string;
}

interface EventStats {
  tasksCompleted: number;
  totalTasks: number;
  ideasAccepted: number;
  docsWritten: number;
}

interface ProjectLinks {
  repoUrl?: string;
  deckUrl?: string;
  demoVideoUrl?: string;
  liveUrl?: string;
}

interface RoomEndSummary {
  roomId: string;
  roomName: string;
  templateName?: string;
  startsAt?: string;
  endsAt?: string;
  submittedAt?: string;
  team?: TeamMemberSummary[];
  timeline?: TimelineMilestones;
  stats?: EventStats;
  links?: ProjectLinks;
  retroHighlights?: string[];
}

function formatOffset(isoTimestamp?: string, startTimestamp?: string): string {
  if (!isoTimestamp || !startTimestamp) return '';
  try {
    const diffMs = new Date(isoTimestamp).getTime() - new Date(startTimestamp).getTime();
    if (diffMs < 0) return 'Hour 0';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    return `Hour ${hours}`;
  } catch {
    return '';
  }
}

function formatTime(isoTimestamp?: string): string {
  if (!isoTimestamp) return '';
  try {
    return new Date(isoTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function RoomSummaryPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const { data: summary, isLoading, error } = useQuery<RoomEndSummary>({
    queryKey: ['rooms', roomId, 'summary'],
    queryFn: () => apiFetch<RoomEndSummary>(`/api/v1/rooms/${roomId}/summary`),
    enabled: Boolean(roomId),
  });

  const timelineItems = useMemo(() => {
    if (!summary) return [];
    const t = summary.timeline || {};
    const start = summary.startsAt || t.roomCreated;

    const milestones = [
      { key: 'created', label: 'Room Created', time: t.roomCreated, done: Boolean(t.roomCreated) },
      { key: 'plan', label: 'Plan Validated', time: t.planValidated, done: Boolean(t.planValidated) },
      { key: 'task', label: 'First Task Shipped', time: t.firstTaskCompleted, done: Boolean(t.firstTaskCompleted) },
      { key: 'demo', label: 'Demo Recorded', time: t.firstDemoRecorded, done: Boolean(t.firstDemoRecorded) },
      { key: 'submitted', label: 'Final Submission', time: t.submittedAt || t.submissionStarted, done: Boolean(t.submittedAt || t.submissionStarted) },
    ];

    return milestones.map((m) => ({
      ...m,
      offset: formatOffset(m.time, start),
      formattedTime: formatTime(m.time),
    }));
  }, [summary]);

  const handleCopyMarkdown = () => {
    if (!summary) return;
    const lines = [
      `# ${summary.roomName} — Hackathon Summary`,
      `**Template:** ${summary.templateName || 'Hackathon Sprint'}`,
      `**Dates:** ${summary.startsAt ? new Date(summary.startsAt).toLocaleDateString() : 'N/A'} - ${summary.endsAt ? new Date(summary.endsAt).toLocaleDateString() : 'N/A'}`,
      '',
      '## Team',
      ...(summary.team || []).map((m) => `- @${m.username} (${m.displayName || m.username}) - ${m.role}`),
      '',
      '## Milestones',
      ...timelineItems.map((m) => `- ${m.label}: ${m.done ? `${m.offset} (${m.formattedTime})` : 'Not yet'}`),
      '',
      '## Metrics',
      `- Tasks Completed: ${summary.stats?.tasksCompleted ?? 0} / ${summary.stats?.totalTasks ?? 0}`,
      `- Ideas Accepted: ${summary.stats?.ideasAccepted ?? 0}`,
      `- Sprint Docs Written: ${summary.stats?.docsWritten ?? 0}`,
      '',
      '## Project Links',
      summary.links?.repoUrl ? `- Repository: ${summary.links.repoUrl}` : null,
      summary.links?.deckUrl ? `- Pitch Deck: ${summary.links.deckUrl}` : null,
      summary.links?.demoVideoUrl ? `- Demo Video: ${summary.links.demoVideoUrl}` : null,
      summary.links?.liveUrl ? `- Live App: ${summary.links.liveUrl}` : null,
      '',
      '## Retro Highlights',
      ...(summary.retroHighlights || ['Solid momentum throughout the event.']).map((h) => `- ${h}`),
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Copied summary as Markdown');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-ink-3 font-mono text-sm">
        Generating room recap…
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <AlertCircle className="size-8 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-ink">Could not load room summary</h2>
        <p className="text-xs text-ink-2 mt-1">This summary becomes available once the room is active.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-shell py-8 px-4 sm:px-8 print:p-0 print:bg-white text-ink font-sans">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-full { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      <div className="max-w-[960px] mx-auto space-y-6 print-full">
        {/* Action Header (hidden in print) */}
        <div className="no-print flex items-center justify-between pb-2 border-b border-border/60">
          <Link
            to={`/app/room/${roomId}/overview`}
            className="text-xs text-ink-2 hover:text-ink transition-colors font-medium"
          >
            ← Back to Overview
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="h-8 text-xs gap-1.5"
            >
              <Copy className="size-3.5" />
              <span>Copy as Markdown</span>
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="size-3.5" />
              <span>Print / PDF</span>
            </Button>
          </div>
        </div>

        {/* 1. Hero */}
        <div className="p-6 sm:p-8 rounded-[20px] bg-card border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {summary.templateName || 'Hackathon Sprint'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-[var(--font-display,serif)] mt-1">
                {summary.roomName}
              </h1>
              <p className="text-xs text-ink-2 font-mono mt-1">
                {summary.startsAt ? new Date(summary.startsAt).toLocaleDateString() : 'Kickoff'}
                {' — '}
                {summary.endsAt ? new Date(summary.endsAt).toLocaleDateString() : 'Finish'}
              </p>
            </div>

            {summary.submittedAt && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shrink-0">
                <CheckCircle2 className="size-3.5" />
                <span>Submitted</span>
              </div>
            )}
          </div>

          {/* Team Row */}
          <div className="pt-3 border-t border-border/50 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-ink-2">Team:</span>
            {(summary.team || []).map((m) => (
              <div
                key={m.userId || m.username}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-xs font-medium"
              >
                <UserAvatar user={m} size={18} />
                <span className="font-semibold text-ink">@{m.username}</span>
                {m.role === 'LEADER' && (
                  <span className="text-[9px] font-mono font-bold px-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    Lead
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2. Horizontal Timeline of Milestones */}
        <div className="p-6 rounded-[20px] bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Journey Milestones</h2>
            <span className="text-[11px] font-mono text-ink-3">Live verified timeline</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {timelineItems.map((item, idx) => (
              <div
                key={item.key}
                className={cn(
                  'p-3 rounded-[14px] border flex flex-col justify-between gap-2 transition-all',
                  item.done
                    ? 'bg-surface border-border text-ink'
                    : 'bg-surface/40 border-dashed border-border/60 text-ink-3 opacity-60'
                )}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-ink-3 block">
                    {item.done ? item.offset : 'Ghost'}
                  </span>
                  <p className="text-xs font-semibold text-ink leading-tight mt-0.5">
                    {item.label}
                  </p>
                </div>
                <div className="text-[11px] font-mono">
                  {item.done ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {item.formattedTime}
                    </span>
                  ) : (
                    <span>Not yet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-[16px] bg-card border border-border shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Tasks Shipped</span>
            <p className="text-2xl font-bold font-mono text-ink mt-1">
              {summary.stats?.tasksCompleted ?? 0}
              <span className="text-xs text-ink-3 font-normal"> / {summary.stats?.totalTasks ?? 0}</span>
            </p>
          </div>
          <div className="p-4 rounded-[16px] bg-card border border-border shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Ideas Accepted</span>
            <p className="text-2xl font-bold font-mono text-ink mt-1">
              {summary.stats?.ideasAccepted ?? 0}
            </p>
          </div>
          <div className="p-4 rounded-[16px] bg-card border border-border shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Docs Vault</span>
            <p className="text-2xl font-bold font-mono text-ink mt-1">
              {summary.stats?.docsWritten ?? 0}
            </p>
          </div>
          <div className="p-4 rounded-[16px] bg-card border border-border shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Team Size</span>
            <p className="text-2xl font-bold font-mono text-ink mt-1">
              {summary.team?.length ?? 0}
            </p>
          </div>
        </div>

        {/* 4. Links Row & Retro Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Project Links */}
          <div className="p-5 rounded-[18px] bg-card border border-border shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2">Project Artifacts</h3>
            <div className="space-y-2">
              {summary.links?.repoUrl ? (
                <a
                  href={summary.links.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface hover:bg-hover border border-border text-xs font-medium text-ink transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <GitBranch className="size-4 text-ink-2" />
                    <span>Source Repository</span>
                  </span>
                  <ExternalLink className="size-3 text-ink-3" />
                </a>
              ) : (
                <div className="p-2.5 rounded-xl border border-dashed border-border text-xs text-ink-3">
                  No repository linked
                </div>
              )}

              {summary.links?.deckUrl && (
                <a
                  href={summary.links.deckUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface hover:bg-hover border border-border text-xs font-medium text-ink transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Presentation className="size-4 text-purple-600" />
                    <span>Pitch Deck</span>
                  </span>
                  <ExternalLink className="size-3 text-ink-3" />
                </a>
              )}

              {summary.links?.demoVideoUrl && (
                <a
                  href={summary.links.demoVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface hover:bg-hover border border-border text-xs font-medium text-ink transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Video className="size-4 text-rose-600" />
                    <span>Demo Recording</span>
                  </span>
                  <ExternalLink className="size-3 text-ink-3" />
                </a>
              )}

              {summary.links?.liveUrl && (
                <a
                  href={summary.links.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface hover:bg-hover border border-border text-xs font-medium text-ink transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="size-4 text-emerald-600" />
                    <span>Live Deployment</span>
                  </span>
                  <ExternalLink className="size-3 text-ink-3" />
                </a>
              )}
            </div>
          </div>

          {/* Retro Highlights */}
          <div className="p-5 rounded-[18px] bg-card border border-border shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2">Retro Highlights</h3>
            <ul className="space-y-2 text-xs text-ink-2 leading-relaxed">
              {(summary.retroHighlights && summary.retroHighlights.length > 0) ? (
                summary.retroHighlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Sparkles className="size-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2 text-ink-3 italic">
                  <span>Collaborative sprint completed on Hackathon OS.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

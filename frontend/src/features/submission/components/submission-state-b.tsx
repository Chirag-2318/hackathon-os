import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ConfirmDialog } from '@/design';
import { SubmittedStamp } from './submitted-stamp';

export interface TeamMember {
  id?: string;
  userId?: string;
  username?: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
}

export interface RoomSummaryData {
  roomId?: string;
  roomName?: string;
  startsAt?: string;
  endsAt?: string;
  submittedAt?: string;
  team?: TeamMember[];
  timeline?: {
    roomCreated?: string;
    briefConfirmed?: string;
    planValidated?: string;
    buildStarted?: string;
    firstTaskCompleted?: string;
    phaseMilestones?: Array<{ name: string; completedAt: string }>;
    submittedAt?: string;
  };
  stats?: {
    completedTasks?: number;
    tasksCompleted?: number;
    totalTasks?: number;
    acceptedIdeas?: number;
    ideasAccepted?: number;
    docsWritten?: number;
  };
}

export interface SubmissionStateBProps {
  roomId: string;
  roomName: string;
  submittedAt?: string | null;
  isLeader: boolean;
  summary?: RoomSummaryData | null;
  canAccessSummary?: boolean;
  onReopen: () => Promise<void>;
  reopening: boolean;
}

function formatSubmittedAt(iso?: string | null): string {
  if (!iso) return 'SUBMITTED';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'SUBMITTED';
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `SUBMITTED, ${month} ${day}, ${time}`;
}

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${month} ${day}, ${time}`;
}

export function SubmissionStateB({
  roomId,
  roomName,
  submittedAt,
  isLeader,
  summary,
  canAccessSummary = true,
  onReopen,
  reopening,
}: SubmissionStateBProps) {
  const [reopenOpen, setReopenOpen] = useState(false);

  // 1. Stats calculation (omit any unknown value, never show 0 for unknown)
  const startTime = summary?.startsAt || summary?.timeline?.roomCreated;
  const submitTime = submittedAt || summary?.submittedAt || summary?.timeline?.submittedAt;

  const hoursFromStart = React.useMemo(() => {
    if (!startTime || !submitTime) return null;
    const s = new Date(startTime).getTime();
    const e = new Date(submitTime).getTime();
    if (isNaN(s) || isNaN(e)) return null;
    return Math.max(0, Math.round((e - s) / 3600000));
  }, [startTime, submitTime]);

  const tasksConfirmed = summary?.stats?.completedTasks ?? summary?.stats?.tasksCompleted;
  const ideasApproved = summary?.stats?.acceptedIdeas ?? summary?.stats?.ideasAccepted;
  const docsWritten = summary?.stats?.docsWritten;

  // 2. Milestones extraction
  const milestones = React.useMemo(() => {
    const t = summary?.timeline;
    if (!t) return [];

    const baseIso = t.roomCreated || startTime;
    const baseMs = baseIso ? new Date(baseIso).getTime() : null;

    const raw: Array<{ label: string; time: string }> = [];
    if (t.roomCreated) raw.push({ label: 'Room created', time: t.roomCreated });
    if (t.briefConfirmed) raw.push({ label: 'Brief confirmed', time: t.briefConfirmed });
    if (t.planValidated) raw.push({ label: 'Plan validated', time: t.planValidated });
    if (t.buildStarted) raw.push({ label: 'Build started', time: t.buildStarted });
    if (t.firstTaskCompleted) raw.push({ label: 'First task confirmed', time: t.firstTaskCompleted });

    if (Array.isArray(t.phaseMilestones)) {
      for (const p of t.phaseMilestones) {
        if (p?.completedAt) {
          raw.push({ label: `${p.name} completed`, time: p.completedAt });
        }
      }
    }

    const finalSub = t.submittedAt || submitTime;
    if (finalSub) raw.push({ label: 'Submitted', time: finalSub });

    // Deduplicate and filter valid dates
    const valid = raw
      .filter((m) => m.time && !isNaN(new Date(m.time).getTime()))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return valid.map((m) => {
      const ms = new Date(m.time).getTime();
      let offset = '+0h';
      if (baseMs && !isNaN(baseMs)) {
        const diffH = Math.max(0, Math.round((ms - baseMs) / 3600000));
        offset = `+${diffH}h`;
      }
      return {
        label: m.label,
        time: m.time,
        offset,
        formattedTime: formatShortTime(m.time),
      };
    });
  }, [summary?.timeline, startTime, submitTime]);

  const team = summary?.team || [];

  const handleConfirmReopen = async () => {
    setReopenOpen(false);
    await onReopen();
  };

  return (
    <div className="w-full max-w-[680px] mx-auto px-6 py-12 md:py-16">
      {/* Top mono muted line */}
      <div className="text-xs sm:text-sm font-mono text-muted-foreground uppercase tracking-wider mb-6">
        {formatSubmittedAt(submitTime)}
      </div>

      {/* Headline & Stamp */}
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
        <div>
          <h1
            className="text-[40px] md:text-[64px] font-normal tracking-tight text-foreground leading-[1.05]"
            style={{ fontFamily: 'var(--font-display, serif)' }}
          >
            Project complete.
          </h1>
          <p className="text-[18px] text-muted-foreground mt-2">
            Congratulations. {roomName || 'Project'} is submitted.
          </p>
        </div>
        <div className="pt-2 md:pt-0">
          <SubmittedStamp />
        </div>
      </div>

      {/* Hairline stat strip with real numbers (mono, 28px) */}
      <div className="border-y border-border py-6 my-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {hoursFromStart !== null && (
            <div>
              <div className="text-[28px] font-mono font-medium text-foreground leading-none">
                {hoursFromStart}h
              </div>
              <div className="text-[13px] text-muted-foreground mt-2">
                hours from start
              </div>
            </div>
          )}

          {tasksConfirmed !== undefined && tasksConfirmed !== null && (
            <div>
              <div className="text-[28px] font-mono font-medium text-foreground leading-none">
                {tasksConfirmed}
              </div>
              <div className="text-[13px] text-muted-foreground mt-2">
                tasks confirmed
              </div>
            </div>
          )}

          {ideasApproved !== undefined && ideasApproved !== null && (
            <div>
              <div className="text-[28px] font-mono font-medium text-foreground leading-none">
                {ideasApproved}
              </div>
              <div className="text-[13px] text-muted-foreground mt-2">
                ideas approved
              </div>
            </div>
          )}

          {docsWritten !== undefined && docsWritten !== null && (
            <div>
              <div className="text-[28px] font-mono font-medium text-foreground leading-none">
                {docsWritten}
              </div>
              <div className="text-[13px] text-muted-foreground mt-2">
                documents written
              </div>
            </div>
          )}
        </div>

        {/* Team UserAvatar row with @usernames */}
        {team.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border flex flex-wrap items-center gap-4">
            {team.map((m) => (
              <div
                key={m.id || m.userId || m.username}
                className="flex items-center gap-2"
              >
                <UserAvatar user={m} size={24} />
                <span className="text-xs font-mono text-muted-foreground">
                  @{m.username}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestone timeline (hairline rail) */}
      {milestones.length > 0 && (
        <div className="my-8">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
            Milestones
          </div>
          <div className="relative pl-6 border-l border-border space-y-4">
            {milestones.map((m, idx) => (
              <div key={`${m.label}-${idx}`} className="relative flex items-baseline gap-3">
                <span className="absolute -left-[29px] top-1.5 size-2 rounded-full border border-border bg-background" />
                <span className="font-mono text-xs text-muted-foreground w-12 shrink-0">
                  {m.offset}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {m.label}
                </span>
                <span className="text-xs font-mono text-muted-foreground ml-auto">
                  {m.formattedTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          to={canAccessSummary ? `/app/room/${roomId}/summary` : `/app/room/${roomId}/overview`}
          className="min-h-[44px] px-6 py-2.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-sm inline-flex items-center justify-center transition-colors select-none"
        >
          View room summary
        </Link>
        <Link
          to={`/app/room/${roomId}/overview`}
          className="min-h-[44px] px-6 py-2.5 rounded-md border border-border text-foreground hover:bg-accent font-medium text-sm inline-flex items-center justify-center transition-colors select-none"
        >
          Back to overview
        </Link>

        {isLeader && (
          <div className="sm:ml-auto pt-2 sm:pt-0">
            <button
              type="button"
              disabled={reopening}
              onClick={() => setReopenOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors cursor-pointer disabled:opacity-50 select-none py-1"
            >
              Not submitted after all? Reopen
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={reopenOpen}
        onOpenChange={setReopenOpen}
        title="Reopen project submission?"
        description="This removes the submitted status and returns the room to active."
        confirmLabel="Reopen"
        cancelLabel="Cancel"
        variant="primary"
        isLoading={reopening}
        onConfirm={handleConfirmReopen}
      />
    </div>
  );
}

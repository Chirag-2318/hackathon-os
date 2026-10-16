import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Copy, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import { computeMvpHealth } from '@/shared/lib/mvp-health';
import { InviteCodeDialog } from '@/features/room/components/InviteCodeDialog';

export interface RubricItem {
  criterion: string;
  weight: number;
}

export interface MvpCheckItem {
  label: string;
  pass: boolean;
}

export interface TeamMemberItem {
  userId: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  isLeader?: boolean;
}

export interface WorkloadItem {
  userId: string;
  name: string;
  avatarUrl?: string;
  confirmedHours: number;
  openHours: number;
}

export interface ProgressChartData {
  totalHours: number;
  nowHour: number;
  deltaPct: number;
  actualPct: number;
  plannedPct: number;
  plannedWaypoints: { hour: number; pct: number }[];
  actualWaypoints: { hour: number; pct: number }[];
}

export interface OverviewRightPanelProps {
  roomId: string;
  roomCode?: string;
  projectName: string;
  projectDescription?: string;
  rubric: RubricItem[];
  mvpChecks: MvpCheckItem[];
  teamMembers: TeamMemberItem[];
  workload: WorkloadItem[];
  skillCoverage: { area: string; covered: boolean }[];
  progress: ProgressChartData;
}

const SEVEN_ROLES = [
  'Frontend',
  'Backend',
  'Design',
  'Fullstack',
  'AI / ML',
  'Product',
  'Pitch',
];

const TONAL_SWATCHES = [
  'bg-foreground',
  'bg-foreground/75',
  'bg-foreground/50',
  'bg-foreground/25',
  'bg-accent',
];

export function OverviewRightPanel({
  roomId,
  roomCode,
  projectName,
  projectDescription,
  rubric,
  mvpChecks,
  teamMembers,
  workload,
  skillCoverage,
  progress,
}: OverviewRightPanelProps) {
  const [teamTab, setTeamTab] = useState<'members' | 'workload' | 'skills'>('members');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tooltip state for chart
  const [tooltip, setTooltip] = useState<{
    hour: number;
    pct: number;
    x: number;
    y: number;
    visible: boolean;
  }>({ hour: 0, pct: 0, x: 0, y: 0, visible: false });
  const svgRef = useRef<SVGSVGElement>(null);

  const mvpHealth = computeMvpHealth(mvpChecks);
  const totalRubricWeight = Math.max(
    1,
    rubric.reduce((sum, item) => sum + item.weight, 0)
  );

  const handleCopyCode = () => {
    const code = roomCode || roomId.slice(0, 8).toUpperCase();
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  };

  // Chart coordinate scales
  const W = 360;
  const H = 140;
  const PAD = { top: 12, right: 12, bottom: 24, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const totalHours = Math.max(1, progress.totalHours || 48);

  const xScale = (h: number) => PAD.left + (h / totalHours) * chartW;
  const yScale = (pct: number) => H - PAD.bottom - (pct / 100) * chartH;

  const plannedPts = progress.plannedWaypoints.length > 0
    ? progress.plannedWaypoints
    : [{ hour: 0, pct: 0 }, { hour: totalHours, pct: 100 }];
  const actualPts = progress.actualWaypoints.length > 0
    ? progress.actualWaypoints
    : [{ hour: 0, pct: 0 }, { hour: progress.nowHour, pct: progress.actualPct }];

  const toPath = (pts: { hour: number; pct: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.hour)} ${yScale(p.pct)}`).join(' ');

  const plannedPath = toPath(plannedPts);
  const actualPath = toPath(actualPts);
  const lastActualPt = actualPts[actualPts.length - 1] || { hour: progress.nowHour, pct: 0 };
  const areaPath = `${actualPath} L ${xScale(lastActualPt.hour)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;

  return (
    <div className="rounded-[14px] border border-border bg-surface divide-y divide-border overflow-hidden shadow-none">
      {/* ── SECTION 1: PROJECT ── */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-medium text-foreground tracking-tight">
            {projectName}
          </h3>
          {projectDescription && (
            <p className="text-xs text-muted-foreground font-normal leading-relaxed mt-1">
              {projectDescription}
            </p>
          )}
        </div>

        {/* Rubric segmented bar & legend */}
        {rubric.length > 0 && (
          <div className="space-y-2">
            <div className="h-2 rounded-full overflow-hidden flex gap-0.5 bg-muted">
              {rubric.map((item, idx) => (
                <div
                  key={item.criterion}
                  style={{ width: `${(item.weight / totalRubricWeight) * 100}%` }}
                  className={cn('h-full', TONAL_SWATCHES[idx % TONAL_SWATCHES.length])}
                  title={`${item.criterion} (${item.weight}%)`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-0.5">
              {rubric.map((item, idx) => (
                <div
                  key={item.criterion}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={cn(
                        'size-1.5 rounded-xs shrink-0',
                        TONAL_SWATCHES[idx % TONAL_SWATCHES.length]
                      )}
                    />
                    <span className="text-muted-foreground truncate font-normal">
                      {item.criterion}
                    </span>
                  </div>
                  <span className="font-mono text-foreground tabular-nums text-xs ml-1">
                    {item.weight}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MVP Health checks */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {mvpChecks.map((chk, i) => (
              <div
                key={i}
                className={cn(
                  'size-3.5 rounded-[3px] flex items-center justify-center transition-colors',
                  chk.pass
                    ? 'bg-inverse text-on-inverse'
                    : 'border border-border bg-page/50 text-muted-foreground'
                )}
                title={chk.label}
              >
                {chk.pass && <Check className="size-2.5 text-current" strokeWidth={2.5} />}
              </div>
            ))}
          </div>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {mvpHealth.done} of {mvpHealth.total} checks
          </span>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <Link
            to={`/app/room/${roomId}/board`}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Core flow &rarr;
          </Link>
          <Link
            to={`/app/room/${roomId}/brief`}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Edit brief &rarr;
          </Link>
        </div>
      </div>

      {/* ── SECTION 2: TEAM ── */}
      <div className="p-6 space-y-4">
        {/* Header with SegmentedControl */}
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-foreground uppercase tracking-wider">
            Team
          </h4>
          <SegmentedControl className="h-7 p-0.5">
            <SegmentedControlItem
              active={teamTab === 'members'}
              onClick={() => setTeamTab('members')}
              className="text-xs px-2.5 py-0.5"
            >
              Members
            </SegmentedControlItem>
            <SegmentedControlItem
              active={teamTab === 'workload'}
              onClick={() => setTeamTab('workload')}
              className="text-xs px-2.5 py-0.5"
            >
              Workload
            </SegmentedControlItem>
            <SegmentedControlItem
              active={teamTab === 'skills'}
              onClick={() => setTeamTab('skills')}
              className="text-xs px-2.5 py-0.5"
            >
              Skills
            </SegmentedControlItem>
          </SegmentedControl>
        </div>

        {/* Tab 1: Members */}
        {teamTab === 'members' && (
          <div className="space-y-3">
            <div className="divide-y divide-border/60">
              {teamMembers.slice(0, 5).map((m) => {
                const isWorking = m.status === 'working';
                const isBlocked = m.status === 'blocked';
                return (
                  <div
                    key={m.userId}
                    className="py-2 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <UserAvatar
                          user={{ id: m.userId, displayName: m.name, avatarUrl: m.avatarUrl }}
                          size={28}
                        />
                        <span
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-1 ring-surface',
                            isWorking && 'bg-emerald-500',
                            isBlocked && 'bg-danger',
                            !isWorking && !isBlocked && 'bg-muted-foreground/40'
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-normal text-foreground truncate leading-tight">
                          {m.username ? `@${m.username}` : m.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-normal capitalize">
                          {m.role}
                        </p>
                      </div>
                    </div>

                    {m.isLeader && (
                      <span title="Team Leader">
                        <Crown className="size-3.5 text-amber-500 shrink-0" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {teamMembers.length > 5 && (
              <Link
                to={`/app/room/${roomId}/team`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-block pt-1 cursor-pointer"
              >
                Open Team &rarr;
              </Link>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInviteOpen(true)}
                className="flex-1 min-h-[44px] sm:min-h-8 rounded-[8px] border border-border bg-surface hover:bg-surface-raised text-xs font-medium text-foreground gap-1.5 cursor-pointer shadow-none"
              >
                <UserPlus className="size-3.5" />
                <span>Invite</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="flex-1 min-h-[44px] sm:min-h-8 rounded-[8px] border border-border bg-surface hover:bg-surface-raised text-xs font-medium text-foreground gap-1.5 cursor-pointer shadow-none"
              >
                {copiedCode ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copiedCode ? 'Copied' : 'Copy room code'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Workload */}
        {teamTab === 'workload' && (
          <div className="space-y-3">
            {workload.length === 0 ? (
              <p className="text-xs text-muted-foreground font-normal py-2">
                No workload records available.
              </p>
            ) : (
              workload.slice(0, 5).map((w) => {
                const total = Math.max(1, w.confirmedHours + w.openHours);
                const maxWorkload = Math.max(16, ...workload.map((m) => m.confirmedHours + m.openHours));
                const confirmedWidth = (w.confirmedHours / maxWorkload) * 100;
                const openWidth = (w.openHours / maxWorkload) * 100;

                return (
                  <div key={w.userId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar
                          user={{ id: w.userId, displayName: w.name, avatarUrl: w.avatarUrl }}
                          size={20}
                        />
                        <span className="text-foreground truncate font-normal">{w.name}</span>
                      </div>
                      <span className="font-mono text-muted-foreground tabular-nums text-xs">
                        {total}h
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-muted">
                      <div
                        style={{ width: `${confirmedWidth}%` }}
                        className="bg-foreground transition-all duration-300"
                        title={`${w.confirmedHours}h confirmed`}
                      />
                      <div
                        style={{ width: `${openWidth}%` }}
                        className="bg-muted-foreground/40 transition-all duration-300"
                        title={`${w.openHours}h open`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Skills */}
        {teamTab === 'skills' && (
          <div className="space-y-1.5">
            {SEVEN_ROLES.map((role) => {
              const match = skillCoverage.find(
                (s) => s.area.toLowerCase() === role.toLowerCase()
              );
              const isCovered = match ? match.covered : false;

              return (
                <div
                  key={role}
                  className="flex items-center justify-between py-1 text-xs border-b border-border/40 last:border-b-0"
                >
                  <span className="text-muted-foreground font-normal">{role}</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        isCovered ? 'bg-emerald-500' : 'border border-muted-foreground/40'
                      )}
                    />
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {isCovered ? 'Covered' : 'Missing'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 3: PROGRESS VS PLAN ── */}
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-foreground uppercase tracking-wider">
            Progress vs plan
          </h4>
          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-foreground inline-block" />
              <span>Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b border-dashed border-muted-foreground inline-block" />
              <span>Planned</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto overflow-visible"
            onMouseMove={(e) => {
              if (!svgRef.current) return;
              const rect = svgRef.current.getBoundingClientRect();
              const relX = ((e.clientX - rect.left) / rect.width) * W;
              const relH = Math.max(0, Math.min(totalHours, ((relX - PAD.left) / chartW) * totalHours));
              const approxPct = Math.round((relH / totalHours) * (progress.actualPct || 50));
              setTooltip({
                hour: Math.round(relH),
                pct: approxPct,
                x: ((e.clientX - rect.left) / rect.width) * W,
                y: ((e.clientY - rect.top) / rect.height) * H,
                visible: true,
              });
            }}
            onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
          >
            {/* Y-axis gridlines & labels (mono 11px that never clip) */}
            {[0, 50, 100].map((pct) => (
              <g key={pct}>
                <line
                  x1={PAD.left}
                  y1={yScale(pct)}
                  x2={W - PAD.right}
                  y2={yScale(pct)}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={PAD.left - 6}
                  y={pct === 0 ? yScale(pct) - 2 : yScale(pct) + 3}
                  textAnchor="end"
                  fill="var(--ink-2)"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                >
                  {pct}%
                </text>
              </g>
            ))}

            {/* X-axis ticks & labels */}
            {[0, Math.round(totalHours / 2), totalHours].map((h) => (
              <g key={h}>
                <line
                  x1={xScale(h)}
                  y1={H - PAD.bottom}
                  x2={xScale(h)}
                  y2={H - PAD.bottom + 3}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={xScale(h)}
                  y={H - 6}
                  textAnchor="middle"
                  fill="var(--ink-2)"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                >
                  {h}h
                </text>
              </g>
            ))}

            {/* Area fill under actual (flat 8% tint, no gradient) */}
            <path
              d={areaPath}
              fill="var(--foreground)"
              fillOpacity={0.08}
            />

            {/* Planned line (dashed muted) */}
            <path
              d={plannedPath}
              fill="none"
              stroke="var(--ink-3)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Actual line (solid) */}
            <path
              d={actualPath}
              fill="none"
              stroke="var(--foreground)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Now marker line */}
            <line
              x1={xScale(progress.nowHour)}
              y1={PAD.top}
              x2={xScale(progress.nowHour)}
              y2={H - PAD.bottom}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={xScale(progress.nowHour) + 4}
              y={PAD.top + 8}
              fill="var(--ink-2)"
              fontSize={10}
              fontFamily="var(--font-mono)"
            >
              Now
            </text>
          </svg>

          {/* Hover Tooltip */}
          {tooltip.visible && (
            <div
              className="absolute pointer-events-none bg-inverse text-on-inverse px-2 py-1 rounded-[6px] text-xs font-mono shadow-sm z-20"
              style={{
                left: `${Math.min(W - 90, Math.max(10, tooltip.x - 40))}px`,
                top: `${Math.max(0, tooltip.y - 36)}px`,
              }}
            >
              Hour {tooltip.hour} · {tooltip.pct}%
            </div>
          )}
        </div>
      </div>

      <InviteCodeDialog roomId={roomId} open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

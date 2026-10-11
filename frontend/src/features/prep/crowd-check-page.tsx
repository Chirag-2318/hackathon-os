/**
 * S26 CrowdCheckPage — Track-crowdedness assessment table
 * PRD 6a §3, S26
 * Route: /app/room/:roomId/crowd-check
 *
 * AC-26: 5 columns (Option, Likely competing ideas, Overlap in your college,
 *         Crowdedness meter, Notes). Footer note verbatim. Row CRUD.
 *         No aggregated-choice column (deferred). Horizontal scroll <768px.
 */
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCrowdCheck, addCrowdRow, updateCrowdRow, deleteCrowdRow } from './api/crowd-api';
import { crowdService, roomService } from '@/services';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { Banner } from '@/components/primitives/banner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Crowdedness, CrowdRow } from './api/types';

// ── Crowdedness meter ─────────────────────────────────────────────

interface CrowdMeterProps {
  value: Crowdedness;
  onChange: (v: Crowdedness) => void;
  disabled?: boolean;
  rowLabel: string;
}

const SEGMENTS: { value: NonNullable<Crowdedness>; label: string; bg: string }[] = [
  { value: 'LOW',    label: 'Low',    bg: '#C9EF84' },
  { value: 'MEDIUM', label: 'Medium', bg: '#FDE781' },
  { value: 'HIGH',   label: 'High',   bg: '#F77271' },
];

function CrowdMeter({ value, onChange, disabled, rowLabel }: CrowdMeterProps) {
  return (
    <div
      role="radiogroup"
      aria-label={`Crowdedness for ${rowLabel}`}
      className="flex w-[120px] h-6 rounded-chip overflow-hidden"
    >
      {SEGMENTS.map(seg => (
        <button
          key={seg.value}
          type="button"
          role="radio"
          aria-checked={value === seg.value}
          aria-label={seg.label}
          disabled={disabled}
          onClick={() => onChange(value === seg.value ? null : seg.value)}
          className={cn(
            'flex-1 text-center text-caption font-semibold text-ink transition-opacity',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-lav-600',
          )}
          style={{
            backgroundColor: seg.bg,
            opacity: value !== null && value !== seg.value ? 0.3 : 1,
          }}
        >
          {seg.label}
        </button>
      ))}
    </div>
  );
}

// ── Inline-editable cell ──────────────────────────────────────────

interface EditableCellProps {
  value: string;
  onCommit: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function EditableCell({ value, onCommit, disabled, placeholder, className }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  };

  if (editing && !disabled) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); }}}
        className="w-full h-8 px-2 text-body text-ink bg-surface border border-lav-600 rounded-control outline-none"
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => { if (!disabled) { setDraft(value); setEditing(true); }}}
      onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { setDraft(value); setEditing(true); }}}
      className={cn(
        'w-full min-h-[32px] px-1 py-1 text-body text-ink rounded-control cursor-text',
        !disabled && 'hover:bg-hover-row',
        !value && 'text-ink-muted italic',
        className,
      )}
    >
      {value || placeholder || ''}
    </div>
  );
}

// ── Number cell ────────────────────────────────────────────────────

interface NumberCellProps {
  value: number | null;
  onCommit: (v: number | null) => void;
  disabled?: boolean;
}

function NumberCell({ value, onCommit, disabled }: NumberCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));

  const commit = () => {
    setEditing(false);
    const n = parseInt(draft, 10);
    const newVal = isNaN(n) || n < 0 ? null : n;
    onCommit(newVal);
  };

  if (editing && !disabled) {
    return (
      <input
        autoFocus
        type="number"
        min={0}
        step={1}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-20 h-8 px-2 text-body tabular-nums text-right text-ink bg-surface border border-lav-600 rounded-control outline-none"
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => { if (!disabled) { setDraft(String(value ?? '')); setEditing(true); }}}
      onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { setDraft(String(value ?? '')); setEditing(true); }}}
      className={cn(
        'w-20 min-h-[32px] px-1 py-1 text-body tabular-nums text-right text-ink rounded-control cursor-text',
        !disabled && 'hover:bg-hover-row',
        value === null && 'text-ink-muted',
      )}
    >
      {value ?? '—'}
    </div>
  );
}

// ── CrowdCheckPage ─────────────────────────────────────────────────

export function CrowdCheckPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = roomId ?? 'unknown';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();
  const { data: room } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomService.getRoom(id),
  });

  const isLeader = room ? (room as any).currentUserRole === 'leader' : true;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['crowd-check', id],
    queryFn: () => fetchCrowdCheck(id),
  });

  useEffect(() => {
    if (id && id !== 'unknown' && room?.stageDone?.ideate && (!data?.rows || data.rows.length === 0)) {
      crowdService.prefillFromApprovedIdeas(id).then((newRows) => {
        if (newRows.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['crowd-check', id] });
        }
      });
    }
  }, [id, room?.stageDone?.ideate, data?.rows?.length, queryClient]);

  const addMutation = useMutation({
    mutationFn: () => addCrowdRow(id),
    onSuccess: (newRow) => {
      queryClient.setQueryData(['crowd-check', id], (old: typeof data) => {
        if (!old) return old;
        return { rows: [...old.rows, newRow] };
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ rowId, patch }: { rowId: string; patch: Partial<CrowdRow> }) =>
      updateCrowdRow(id, rowId, patch),
    onMutate: async ({ rowId, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['crowd-check', id] });
      const prev = queryClient.getQueryData(['crowd-check', id]);
      queryClient.setQueryData(['crowd-check', id], (old: typeof data) => {
        if (!old) return old;
        return { rows: old.rows.map(r => r.id === rowId ? { ...r, ...patch } : r) };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(['crowd-check', id], ctx.prev); },
  });

  const deleteMutation = useMutation({
    mutationFn: (rowId: string) => deleteCrowdRow(id, rowId),
    onSuccess: (_, rowId) => {
      queryClient.setQueryData(['crowd-check', id], (old: typeof data) => {
        if (!old) return old;
        return { rows: old.rows.filter(r => r.id !== rowId) };
      });
    },
  });

  const handleDelete = (row: CrowdRow, rowCount: number) => {
    if (rowCount <= 1) return; // last row cannot be deleted
    deleteMutation.mutate(row.id);
  };

  if (isLoading) return <CrowdLoadingSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-6">
        <p className="text-body text-ink-muted">Could not load crowd check data.</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="size-4 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  const rows = data.rows;

  return (
    <div className="flex flex-col gap-6 p-6 pb-12">
      {!isOnline && (
        <Banner variant="warning">
          Offline — table is read-only while offline.
        </Banner>
      )}

      {room && !room.stageDone?.ideate && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-card bg-amber-500/10 border border-amber-500/20 text-ink">
          <div className="flex items-center gap-2 text-caption font-medium text-amber-700 dark:text-amber-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>Finish ideation first to pull in approved ideas into your crowd check.</span>
          </div>
          <Link
            to={`/app/room/${id}/ideate`}
            className="text-caption font-semibold text-lav-600 hover:text-lav-700 underline underline-offset-2 flex items-center gap-1"
          >
            Go to Ideate <ChevronRight className="size-3.5" />
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-h1 text-ink">Crowd Check</h1>
        <p className="text-caption text-ink-muted mt-1">
          Estimate how many teams will work on the same idea space. Choose knowingly.
        </p>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => addMutation.mutate()}
          disabled={!isOnline || addMutation.isPending}
        >
          <Plus className="size-4 mr-1.5" />
          Add row
        </Button>
        <span className="text-caption text-ink-muted">
          Add each track or problem area you're considering.
        </span>
      </div>

      {/* Table — horizontal scroll below 768px */}
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className="px-4 py-3 text-label text-ink-muted font-semibold w-[22%]">Option</th>
              <th className="px-4 py-3 text-label text-ink-muted font-semibold w-[26%] hidden md:table-cell">Likely competing ideas</th>
              <th className="px-4 py-3 text-label text-ink-muted font-semibold w-[12%] text-right">Overlap in your college</th>
              <th className="px-4 py-3 text-label text-ink-muted font-semibold w-[16%]">Crowdedness</th>
              <th className="px-4 py-3 text-label text-ink-muted font-semibold w-[20%]">Notes</th>
              <th className="px-4 py-3 w-10" aria-label="Row actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-b-0 hover:bg-hover-row transition-colors"
              >
                <td className="px-4 py-2">
                  <EditableCell
                    value={row.option}
                    placeholder="Track or problem…"
                    onCommit={v => updateMutation.mutate({ rowId: row.id, patch: { option: v } })}
                    disabled={!isOnline}
                  />
                </td>
                <td className="px-4 py-2 hidden md:table-cell">
                  <EditableCell
                    value={row.likelyCompetingIdeas}
                    placeholder="Other teams might build…"
                    onCommit={v => updateMutation.mutate({ rowId: row.id, patch: { likelyCompetingIdeas: v } })}
                    disabled={!isOnline}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <NumberCell
                    value={row.collegeOverlap}
                    onCommit={v => updateMutation.mutate({ rowId: row.id, patch: { collegeOverlap: v } })}
                    disabled={!isOnline}
                  />
                </td>
                <td className="px-4 py-2">
                  <CrowdMeter
                    value={row.crowdedness}
                    onChange={c => updateMutation.mutate({ rowId: row.id, patch: { crowdedness: c } })}
                    disabled={!isOnline}
                    rowLabel={row.option || `Row ${rows.indexOf(row) + 1}`}
                  />
                </td>
                <td className="px-4 py-2">
                  <EditableCell
                    value={row.notes}
                    placeholder="Notes…"
                    onCommit={v => updateMutation.mutate({ rowId: row.id, patch: { notes: v } })}
                    disabled={!isOnline}
                  />
                </td>
                <td className="px-4 py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {rows.length <= 1 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block">
                              <DropdownMenuItem disabled>
                                <span className="text-caption text-ink-muted">Delete row</span>
                              </DropdownMenuItem>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Keep at least one option</TooltipContent>
                        </Tooltip>
                      ) : (
                        <DropdownMenuItem
                          className="text-danger-text"
                          onClick={() => handleDelete(row, rows.length)}
                        >
                          Delete row
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note — verbatim from PRD */}
      <p className="text-caption text-ink-muted">
        Popularity is not quality. Choose knowingly.
      </p>

      {/* Sticky footer bar */}
      <div className="sticky bottom-0 -mx-6 -mb-12 mt-6 px-6 py-4 bg-surface/95 backdrop-blur border-t border-border flex items-center justify-between z-10">
        <div className="text-caption text-ink-muted">
          Crowdedness is a heuristic, not a measurement.
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await crowdService.skipToPlan(id);
              queryClient.invalidateQueries({ queryKey: ['room', id] });
              navigate(`/app/room/${id}/plan`);
            }}
          >
            Skip
          </Button>

          {isLeader ? (
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                await crowdService.continueToPlan(id);
                queryClient.invalidateQueries({ queryKey: ['room', id] });
                toast.success('Moved to Plan stage');
                navigate(`/app/room/${id}/plan`);
              }}
            >
              Continue to Plan
              <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="default" size="sm" disabled>
                    Continue to Plan
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Only the leader can do this</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function CrowdLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Skeleton className="h-9 w-40 mb-1" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-28" />
      <div className="rounded-card border border-border overflow-hidden">
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full border-t border-border rounded-none" />
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomService } from '@/services';
import type { EventTemplate } from '@/services/types';
import { useOverlay } from '@/app/providers/overlay-store';
import { useSidebarStore } from '@/app/layout/use-sidebar-store';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, X, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

import { CrNameField } from './create-room/cr-name-field';
import { CrTemplateCard } from './create-room/cr-template-card';
import { CrScheduleField } from './create-room/cr-schedule-field';
import { CrMoreSection } from './create-room/cr-more-section';
import { SectionErrorBoundary } from '@/design/components/error-state';
import { useMeta } from '@/api/useMeta';
import { useAiAction } from '@/features/ai-gate';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextSaturday9AM(): Date {
  const d = new Date();
  const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat);
  d.setHours(9, 0, 0, 0);
  return d;
}

function toInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDateInput(s: string): Date | null {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

type ModeHint = 'prep' | null;

function getModeHint(start: Date | null, end: Date | null): ModeHint {
  if (!start) return null;
  const now = Date.now();
  if (start.getTime() > now) return 'prep';
  return null;
}

export interface CreateRoomPrefill {
  name?: string;
  startsAt?: string | Date;
  endsAt?: string | Date;
  durationHours?: number;
  templateId?: string;
  teamSize?: number;
}

// ── Main component ────────────────────────────────────────────────────────────

export function CreateRoomDialogInner({ prefill: directPrefill }: { prefill?: CreateRoomPrefill } = {}) {
  const { isOpen, close, data } = useOverlay<{ defaultTemplateId?: string; prefill?: CreateRoomPrefill }>('create-room-dialog');
  const prefill = directPrefill || data?.prefill;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setContext = useSidebarStore((s) => s.setContext);
  const titleId = useId();

  // ── Form state ───────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const defaultStart = getNextSaturday9AM();
  const [startValue, setStartValue] = useState(toInputValue(defaultStart));
  const [endValue, setEndValue] = useState(
    toInputValue(new Date(defaultStart.getTime() + 36 * 60 * 60 * 1000))
  );
  const [endManuallyEdited, setEndManuallyEdited] = useState(false);
  const [endTouched, setEndTouched] = useState(false);

  const [moreOpen, setMoreOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Template list — fetched ONLY from GET /api/v1/event-templates
  const { data: templates = [] } = useQuery({
    queryKey: ['event-templates'],
    queryFn: () => roomService.getEventTemplates(),
    enabled: isOpen,
  });

  // Auto-open More if fields populated
  useEffect(() => {
    if (description || projectDescription) setMoreOpen(true);
  }, [description, projectDescription]);

  // Apply prefill
  useEffect(() => {
    if (isOpen && prefill) {
      if (prefill.name) {
        setName(prefill.name.trim().slice(0, 60));
      }
      if (prefill.startsAt) {
        const s = new Date(prefill.startsAt);
        const validStart = isNaN(s.getTime()) ? getNextSaturday9AM() : (s.getTime() < Date.now() ? new Date() : s);
        setStartValue(toInputValue(validStart));
        let duration = prefill.durationHours;
        if (!duration && prefill.endsAt) {
          const e = new Date(prefill.endsAt);
          if (!isNaN(e.getTime())) {
            duration = Math.round((e.getTime() - new Date(prefill.startsAt).getTime()) / 3600_000);
          }
        }
        const clampedDuration = Math.max(1, Math.min(168, duration || 36));
        setEndValue(toInputValue(new Date(validStart.getTime() + clampedDuration * 3600_000)));
        setEndManuallyEdited(true);
      }
      if (prefill.teamSize) {
        setDescription((prev) => prev || `Teams of up to ${prefill.teamSize}`);
      }
    }
  }, [isOpen, prefill]);

  // Apply defaultTemplateId from Playbooks if in templates; otherwise clear it
  useEffect(() => {
    if (isOpen && data?.defaultTemplateId) {
      if (templates.some((t) => t.id === data.defaultTemplateId)) {
        setSelectedTemplateId(data.defaultTemplateId);
      } else {
        setSelectedTemplateId(null);
      }
    }
  }, [isOpen, data?.defaultTemplateId, templates]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setNameTouched(false);
      setDescription('');
      setProjectDescription('');
      setSelectedTemplateId(null);
      const s = getNextSaturday9AM();
      setStartValue(toInputValue(s));
      setEndValue(toInputValue(new Date(s.getTime() + 36 * 60 * 60 * 1000)));
      setEndManuallyEdited(false);
      setEndTouched(false);
      setMoreOpen(false);
      setSubmitError(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Preselect closest template if prefilled, or first template
  useEffect(() => {
    if (templates.length > 0) {
      if (prefill?.templateId && templates.some((t) => t.id === prefill.templateId)) {
        setSelectedTemplateId(prefill.templateId);
      } else if (prefill?.durationHours || prefill?.endsAt) {
        let duration = prefill.durationHours;
        if (!duration && prefill.endsAt && prefill.startsAt) {
          const e = new Date(prefill.endsAt);
          const s = new Date(prefill.startsAt);
          if (!isNaN(e.getTime()) && !isNaN(s.getTime())) {
            duration = Math.round((e.getTime() - s.getTime()) / 3600_000);
          }
        }
        const target = Math.max(1, Math.min(168, duration || 36));
        let closest = templates[0];
        let minDiff = Math.abs(closest.durationHours - target);
        for (const t of templates) {
          const diff = Math.abs(t.durationHours - target);
          if (diff < minDiff) {
            minDiff = diff;
            closest = t;
          }
        }
        setSelectedTemplateId(closest.id);
      } else if (!selectedTemplateId || !templates.some((t) => t.id === selectedTemplateId)) {
        setSelectedTemplateId(templates[0].id);
      }
    } else {
      setSelectedTemplateId(null);
    }
  }, [templates, selectedTemplateId, prefill]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? templates[0] ?? null;

  // Auto-fill end from start + template duration
  const handleStartChange = useCallback((val: string) => {
    setStartValue(val);
    if (!endManuallyEdited && selectedTemplate) {
      const d = parseDateInput(val);
      if (d) {
        const end = new Date(d.getTime() + selectedTemplate.durationHours * 60 * 60 * 1000);
        setEndValue(toInputValue(end));
      }
    }
  }, [endManuallyEdited, selectedTemplate]);

  const handleEndChange = useCallback((val: string) => {
    setEndValue(val);
    setEndManuallyEdited(true);
  }, []);

  // When template changes, also update end if not manually edited
  useEffect(() => {
    if (!endManuallyEdited && selectedTemplate && startValue) {
      const d = parseDateInput(startValue);
      if (d) {
        const end = new Date(d.getTime() + selectedTemplate.durationHours * 60 * 60 * 1000);
        setEndValue(toInputValue(end));
      }
    }
  }, [selectedTemplateId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mode hint
  const startDate = parseDateInput(startValue);
  const endDate = parseDateInput(endValue);
  const modeHint: ModeHint = getModeHint(startDate, endDate);

  // End validation
  const endError = (() => {
    if (!startDate || !endDate) return null;
    return endDate <= startDate ? 'End must be after the start.' : null;
  })();

  // Suggest name
  const { data: meta } = useMeta();
  const { handleAiError } = useAiAction();
  const aiAllowed = meta?.aiEnabled ?? true;
  const [alternativeNames, setAlternativeNames] = useState<string[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const suggestMutation = useMutation({
    mutationFn: () => roomService.suggestRoomName({
      description: (description ?? '').trim() || undefined,
      templateId: selectedTemplateId || undefined,
      currentName: (name ?? '').trim() || undefined,
    }),
    onSuccess: (res) => {
      const names = Array.isArray(res?.names) ? res.names.filter(Boolean) : [];
      if (names.length > 0) {
        setName(names[0] ?? '');
        setAlternativeNames(names.slice(1).map(n => n ?? ''));
      }
      setSuggestError(null);
      setSubmitError(null);
    },
    onError: (err: any) => {
      handleAiError(err);
      setSuggestError(err?.message || 'Failed to suggest names. Please try again.');
    },
  });

  const handleSelectAlternative = (selectedAlt: string) => {
    if (!selectedAlt) return;
    const oldName = (name ?? '').trim();
    setName(selectedAlt);
    setAlternativeNames((prev) => {
      const filtered = prev.filter((n) => n !== selectedAlt);
      if (oldName && !filtered.includes(oldName)) {
        filtered.push(oldName);
      }
      return filtered;
    });
  };

  // Create room
  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      projectDescription?: string;
      templateId: string;
      eventStart?: string;
      eventEnd?: string;
      timezone?: string;
    }) => roomService.createRoom(payload),
    onSuccess: (newRoom) => {
      setIsSuccess(true);
      queryClient.setQueryData(['room', newRoom.id], newRoom);
      queryClient.setQueryData(['room', String(newRoom.id)], newRoom);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setTimeout(() => {
        close();
        setContext('room');
        navigate(`/app/room/${newRoom.id}/overview`);
      }, 180);
    },
    onError: (err: any) => {
      setSubmitError(err?.message ?? 'Failed to create room. Please try again.');
    },
  });

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const safeName = (name ?? '').trim();
  const safeDesc = (description ?? '').trim();
  const safeProjDesc = (projectDescription ?? '').trim();

  const nameError = safeName.length > 0 && safeName.length < 3
    ? 'Name must be at least 3 characters.'
    : safeName.length > 60
    ? 'Name must be 60 characters or fewer.'
    : null;

  const isFormValid =
    safeName.length >= 3 &&
    safeName.length <= 60 &&
    !!selectedTemplateId &&
    !endError;

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setNameTouched(true);
    setEndTouched(true);
    if (!isFormValid) return;
    setSubmitError(null);

    createMutation.mutate({
      name: safeName,
      description: safeDesc || undefined,
      projectDescription: safeProjDesc || undefined,
      templateId: selectedTemplateId,
      eventStart: startDate?.toISOString(),
      eventEnd: endDate?.toISOString(),
      timezone: userTimezone,
    });
  }, [isFormValid, safeName, safeDesc, safeProjDesc, selectedTemplateId, startDate, endDate, userTimezone, createMutation]);

  const handleClose = () => {
    if (createMutation.isPending) return;
    close();
  };

  // Cmd/Ctrl+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Template keyboard navigation
  const handleTemplateKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      setSelectedTemplateId(templates[(index + 1) % templates.length].id);
    } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      setSelectedTemplateId(templates[(index - 1 + templates.length) % templates.length].id);
    }
  };

  // Summary line
  const summaryParts: string[] = [];
  if (selectedTemplate?.durationHours) {
    const h = selectedTemplate.durationHours;
    summaryParts.push(h >= 168 ? '1 week' : `${h}h`);
  }
  const phaseCount = (selectedTemplate as any)?.phaseCount;
  if (phaseCount) summaryParts.push(`${phaseCount} phases`);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        showCloseButton={false}
        data-testid="cr-dialog"
        aria-labelledby={titleId}
        className={cn(
          'w-[min(560px,calc(100vw-32px))] max-h-[min(720px,calc(100dvh-48px))]',
          'sm:max-w-none',
          'rounded-[var(--r-card)] bg-card border border-border',
          'p-0 shadow-none ring-0',
          'flex flex-col overflow-hidden',
          'transition-all duration-150 ease-[var(--ease)]',
          'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98]',
          'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.98]',
        )}
        onKeyDown={handleKeyDown}
      >
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2
              id={titleId}
              data-testid="cr-title"
              className="text-[20px] font-semibold text-ink leading-7 tracking-[-0.01em]"
            >
              Create a room
            </h2>
            <p className="text-[13px] text-ink-2 leading-5 mt-0.5">
              Set up your team's workspace. You can change everything later.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className={cn(
              'size-8 rounded-[var(--r-control)] flex items-center justify-center shrink-0',
              'text-ink-2 hover:bg-hover hover:text-ink',
              'transition-colors duration-150 cursor-pointer',
              'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
              'mt-0.5'
            )}
          >
            <X className="size-4 stroke-[1.75]" />
          </button>
        </div>

        {/* ── Body ── */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5 panel-scroll"
        >
          {/* 1. Room name */}
          <CrNameField
            value={name}
            onChange={setName}
            onClearError={() => {
              setSubmitError(null);
              setSuggestError(null);
            }}
            isSuggesting={suggestMutation.isPending}
            onSuggest={() => suggestMutation.mutate()}
            error={nameError ?? undefined}
            touched={nameTouched}
            onBlur={() => setNameTouched(true)}
            alternativeNames={alternativeNames}
            onSelectAlternative={handleSelectAlternative}
            suggestError={suggestError}
            onRetrySuggest={() => suggestMutation.mutate()}
            aiAllowed={aiAllowed}
          />

          {/* 2. Event template */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-ink leading-5">
              Event template
            </label>

            <div
              role="radiogroup"
              aria-label="Event template"
              data-testid="cr-template-group"
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              {templates.map((tpl, idx) => (
                <CrTemplateCard
                  key={tpl.id}
                  template={tpl}
                  isSelected={selectedTemplateId === tpl.id}
                  index={idx}
                  totalCount={templates.length}
                  onSelect={setSelectedTemplateId}
                  onKeyDown={handleTemplateKeyDown}
                />
              ))}
            </div>

            {/* Selection summary */}
            {selectedTemplate && (
              <div
                data-testid="cr-summary"
                className="flex items-start gap-1.5 text-[13px] text-ink-2 leading-5 mt-1"
              >
                <Layers className="size-3.5 shrink-0 mt-0.5 stroke-[1.75]" />
                <span>
                  {summaryParts.length > 0
                    ? `${summaryParts.join(' · ')}. `
                    : ''}
                  Phases and checkpoints are pre-filled from this template.
                </span>
              </div>
            )}
          </div>

          {/* 3. Event schedule */}
          <CrScheduleField
            startValue={startValue}
            endValue={endValue}
            onStartChange={handleStartChange}
            onEndChange={handleEndChange}
            onStartBlur={() => {}}
            onEndBlur={() => setEndTouched(true)}
            endError={endError ?? undefined}
            endTouched={endTouched}
            modeHint={modeHint}
          />

          {/* 4. More details */}
          <CrMoreSection
            description={description}
            projectDescription={projectDescription}
            onDescriptionChange={setDescription}
            onProjectDescriptionChange={setProjectDescription}
            isOpen={moreOpen}
            onToggle={() => setMoreOpen((o) => !o)}
          />

          {/* Submit error */}
          {submitError && (
            <div
              data-testid="cr-error"
              className="rounded-xl border border-border bg-card p-3 text-[13px] text-danger leading-5"
            >
              {submitError}
            </div>
          )}
        </form>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-card shrink-0">
          <button
            type="button"
            data-testid="cr-cancel"
            onClick={handleClose}
            className={cn(
              'h-9 px-4 rounded-[var(--r-control)] text-[14px] font-medium text-ink',
              'hover:bg-hover transition-colors duration-150 cursor-pointer',
              'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
              'sm:flex-none flex-1'
            )}
          >
            Cancel
          </button>

          <button
            type="button"
            data-testid="cr-submit"
            onClick={() => handleSubmit()}
            disabled={createMutation.isPending}
            className={cn(
              'h-9 px-5 rounded-[var(--r-control)] text-[14px] font-medium transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
              'sm:flex-none flex-1',
              createMutation.isPending || !isFormValid
                ? 'bg-active text-ink-3 cursor-not-allowed'
                : isSuccess
                ? 'bg-primary text-primary-foreground cursor-default'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
            )}
          >
            {createMutation.isPending ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </span>
            ) : (
              'Create room'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreateRoomDialogOverlay({ prefill }: { prefill?: CreateRoomPrefill } = {}) {
  return (
    <SectionErrorBoundary fallbackMessage="Unable to load the Create Room dialog.">
      <CreateRoomDialogInner prefill={prefill} />
    </SectionErrorBoundary>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { briefService, roomService } from '@/services';
import type { Brief, BriefFields } from '@/services/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/apiClient';
import { BriefIntake } from './components/brief-intake';
import { StructuringBanner } from './components/structuring-banner';
import { BriefFieldsList, RULE_KEYS } from './components/brief-fields-list';

export function BriefPage() {
  const { roomId, id } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isLeader = true;
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [applyDates, setApplyDates] = useState(false);
  const [incompleteErrors, setIncompleteErrors] = useState<string[]>([]);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: brief } = useQuery({
    queryKey: ['brief', activeRoomId],
    queryFn: () => briefService.getBrief(activeRoomId),
    enabled: Boolean(activeRoomId),
  });

  const { data: room } = useQuery({
    queryKey: ['room', activeRoomId],
    queryFn: () => roomService.getRoom(activeRoomId),
    enabled: Boolean(activeRoomId),
  });

  const [confirmedChecks, setConfirmedChecks] = useState<Record<string, boolean>>({});
  const confirmedChecksRef = useRef<Record<string, boolean>>({});
  confirmedChecksRef.current = confirmedChecks;

  useEffect(() => {
    if (brief?.confirmedFields) {
      setConfirmedChecks((prev) => ({
        ...brief.confirmedFields,
        ...prev,
      }));
    }
  }, [brief?.confirmedFields]);

  const canEdit = isLeader && (brief?.permissions?.canEdit ?? true) && !brief?.confirmed;

  const saveBriefMutation = useMutation({
    mutationFn: (updated: Brief) => briefService.saveBrief(updated),
    onSuccess: (saved) => {
      setSaveStatus('saved');
      queryClient.setQueryData(['brief', activeRoomId], (old: Brief | null | undefined) => {
        if (!old) return saved;
        return {
          ...old,
          ...saved,
          fields: {
            ...old.fields,
            ...saved.fields,
          },
          confirmedFields: {
            ...saved.confirmedFields,
            ...confirmedChecksRef.current,
          },
        };
      });
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => setSaveStatus('idle'),
  });

  const confirmBriefMutation = useMutation({
    mutationFn: () => briefService.confirmBrief(activeRoomId, applyDates),
    onSuccess: () => {
      setIncompleteErrors([]);
      queryClient.invalidateQueries({ queryKey: ['brief', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toast.success('Brief confirmed');
      navigate(`/app/room/${activeRoomId}/ideate`);
    },
    onError: (err: any) => {
      if (err instanceof ApiError && err.code === 'BRIEF_INCOMPLETE') {
        const missing = Array.isArray(err.details) ? err.details : [err.message];
        setIncompleteErrors(missing);
        toast.error('Please complete all required fields before confirming.');
      } else {
        toast.error(err.message || 'Confirmation failed');
      }
    },
  });

  const handleToggleCheck = async (key: string) => {
    if (!canEdit) {
      toast.error('Only the leader can confirm rules');
      return;
    }
    const nextVal = !confirmedChecks[key];
    const updated = { ...confirmedChecks, [key]: nextVal };
    setConfirmedChecks(updated);
    confirmedChecksRef.current = updated;

    try {
      await briefService.updateConfirmedField(activeRoomId, key, nextVal);
      queryClient.setQueryData(['brief', activeRoomId], (old: Brief | null | undefined) => {
        if (!old) return old;
        return {
          ...old,
          confirmedFields: {
            ...old.confirmedFields,
            [key]: nextVal,
          },
        };
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to update check');
    }
  };

  const handleFieldsChange = (newFields: BriefFields) => {
    if (!brief || !canEdit) return;
    const mergedFields: BriefFields = {
      ...brief.fields,
      ...newFields,
    };
    queryClient.setQueryData(['brief', activeRoomId], (old: Brief | null | undefined) => {
      if (!old) return old;
      return {
        ...old,
        fields: {
          ...old.fields,
          ...mergedFields,
        },
      };
    });
    setSaveStatus('saving');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      saveBriefMutation.mutate({
        ...brief,
        fields: mergedFields,
        confirmedFields: {
          ...(brief.confirmedFields || {}),
          ...confirmedChecksRef.current,
        },
      });
    }, 800);
  };

  const handleExtracted = (extractedFields: any, updatedBrief?: any) => {
    if (updatedBrief) {
      queryClient.setQueryData(['brief', activeRoomId], updatedBrief);
    } else if (brief) {
      const mergedFields = {
        ...brief.fields,
        ...extractedFields,
      };
      const newBrief = {
        ...brief,
        fields: mergedFields,
        needsStructuring: false,
      };
      queryClient.setQueryData(['brief', activeRoomId], newBrief);
      saveBriefMutation.mutate(newBrief);
    }
    queryClient.invalidateQueries({ queryKey: ['brief', activeRoomId] });
  };

  const rubricList = brief?.fields?.rubric ?? [];
  const rubricSum = rubricList.reduce((acc, r) => acc + (Number(r.weight) || 0), 0);
  const rubricValid = rubricList.length === 0 || rubricSum === 100;
  const hasProblemStatement = Boolean(brief?.fields?.problemStatement?.trim());
  const canConfirm = isLeader && hasProblemStatement && rubricValid;
  const hasDates = Boolean(brief?.fields?.deadlines?.start && brief?.fields?.deadlines?.submission);

  return (
    <div className="w-full flex flex-col gap-6 p-8 max-w-[1320px] mx-auto font-sans pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-display font-normal tracking-tight text-foreground leading-none">Hackathon Brief</h1>
            {brief?.confirmed ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                CONFIRMED
              </span>
            ) : hasProblemStatement ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                NEEDS CONFIRMATION
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border shrink-0 bg-muted/80 text-muted-foreground border-border/60">
                NOT ADDED
              </span>
            )}
            {saveStatus === 'saving' && <span className="text-xs font-mono text-muted-foreground">Saving...</span>}
            {saveStatus === 'saved' && <span className="text-xs font-mono text-emerald-600">Saved</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Every rule, rubric weight, and deadline in one verified source of truth.
          </p>
        </div>

        {brief?.hasSource && canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => briefService.deleteBrief(activeRoomId).then(() => queryClient.invalidateQueries({ queryKey: ['brief', activeRoomId] }))}
            className="text-xs font-semibold gap-1.5"
          >
            <RefreshCw className="size-3.5" /> Replace brief
          </Button>
        )}
      </div>

      {/* Intake Section (when brief has no source) */}
      {!brief?.hasSource && (
        <BriefIntake
          roomId={activeRoomId}
          isLeader={isLeader}
          aiAllowed={(room as any)?.aiAllowed ?? true}
          onSuccess={(b) => {
            queryClient.setQueryData(['brief', activeRoomId], b);
            queryClient.invalidateQueries({ queryKey: ['brief', activeRoomId] });
          }}
        />
      )}

      {/* Review Section */}
      {brief?.hasSource && (
        <div className="flex flex-col gap-6">
          {brief.needsStructuring && (
            <StructuringBanner
              roomId={activeRoomId}
              onExtracted={handleExtracted}
            />
          )}

          {incompleteErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 space-y-1">
              <span className="font-semibold block mb-1">Incomplete brief requirements:</span>
              {incompleteErrors.map((err, i) => (
                <div key={i}>&bull; {err}</div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <BriefFieldsList
                brief={brief}
                canEdit={canEdit}
                confirmedChecks={confirmedChecks}
                onToggleCheck={handleToggleCheck}
                onFieldsChange={handleFieldsChange}
              />
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
                <div className="px-6 pt-5 pb-3 border-b border-border/60 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Source Text</h3>
                  <span className="text-xs text-muted-foreground capitalize">{brief.source}</span>
                </div>
                <div className="p-6">
                  <div className="max-h-[500px] overflow-y-auto p-4 rounded-xl bg-muted/30 border border-border/50 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap">
                    {brief.rawText || 'No raw source text available.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      {brief?.hasSource && !brief.confirmed && (
        <div className="fixed bottom-0 left-[232px] right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-foreground">
              {RULE_KEYS.filter((k) => confirmedChecks[k]).length} of 9 rules confirmed
              {rubricList.length > 0 && rubricSum !== 100 && (
                <span className="text-red-500 ml-2 font-normal">(Rubric weights sum to {rubricSum}%, must be 100%)</span>
              )}
              {!hasProblemStatement && (
                <span className="text-amber-500 ml-2 font-normal">(Problem statement required)</span>
              )}
            </span>

            {hasDates && canEdit && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={applyDates}
                  onChange={(e) => setApplyDates(e.target.checked)}
                  className="rounded border-border"
                />
                Use these dates for the room clock
              </label>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isLeader && (
              <span className="text-xs text-muted-foreground">Only the leader can confirm the brief</span>
            )}
            <Button
              onClick={() => confirmBriefMutation.mutate()}
              disabled={!canConfirm || confirmBriefMutation.isPending}
              className="h-9 px-6 rounded-[12px] text-xs font-semibold"
            >
              {confirmBriefMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Confirm brief
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

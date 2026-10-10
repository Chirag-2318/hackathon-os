import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomService, EVENT_TEMPLATES } from '@/services';
import type { EventTemplate } from '@/services/types';
import { useOverlay } from '@/app/providers/overlay-store';
import { useSidebarStore } from '@/app/layout/use-sidebar-store';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function getNextSaturday9AM(): Date {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat);
  d.setHours(9, 0, 0, 0);
  return d;
}

function formatDateString(d: Date): string {
  const datePart = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart}, ${timePart}`;
}

function toLocalDatetimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function CreateRoomDialogOverlay() {
  const { isOpen, close } = useOverlay('create-room-dialog');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setContext = useSidebarStore((s) => s.setContext);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('pb-sih');
  const [eventStartDate, setEventStartDate] = useState<Date>(getNextSaturday9AM());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ message: string; request?: any; response?: any } | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Template list query
  const { data: templates = EVENT_TEMPLATES } = useQuery({
    queryKey: ['event-templates'],
    queryFn: () => roomService.getEventTemplates(),
    enabled: isOpen,
    initialData: EVENT_TEMPLATES,
  });

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Suggest mutation
  const suggestMutation = useMutation({
    mutationFn: () => roomService.suggestName(),
    onSuccess: (data) => {
      setName(data.suggestion);
      if (errorInfo) setErrorInfo(null);
    },
  });

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      projectDescription?: string;
      templateId: string;
      eventStart: string;
      eventEnd: string;
      timezone: string;
    }) => {
      return roomService.createRoom(payload);
    },
    onSuccess: (newRoom) => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      setTimeout(() => {
        close();
        setIsSuccess(false);
        setName('');
        setDescription('');
        setProjectDescription('');
        setErrorInfo(null);
        setContext('room');
        navigate(`/app/room/${newRoom.id}/overview`);
      }, 180);
    },
    onError: (err: any) => {
      setErrorInfo({
        message: err?.message || 'Failed to create room. Please try again.',
        request: {
          name,
          description,
          projectDescription,
          templateId: selectedTemplateId,
          eventStart: eventStartDate.toISOString(),
          timezone: userTimezone,
        },
        response: {
          error: String(err),
        },
      });
    },
  });

  const handleClose = () => {
    if (createMutation.isPending) return;
    setErrorInfo(null);
    setShowDatePicker(false);
    setIsSuccess(false);
    close();
  };

  const isFormValid = name.trim().length >= 3 && name.trim().length <= 60 && !!selectedTemplateId;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;
    setErrorInfo(null);

    const end = new Date(eventStartDate);
    end.setHours(end.getHours() + (selectedTemplate?.durationHours || 36));

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      projectDescription: projectDescription.trim() || undefined,
      templateId: selectedTemplateId,
      eventStart: eventStartDate.toISOString(),
      eventEnd: end.toISOString(),
      timezone: userTimezone,
    });
  };

  // Keyboard navigation for template tiles
  const handleTemplateKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const nextIdx = (index + 1) % templates.length;
      setSelectedTemplateId(templates[nextIdx].id);
    } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const prevIdx = (index - 1 + templates.length) % templates.length;
      setSelectedTemplateId(templates[prevIdx].id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { if (!openState) handleClose(); }}>
      <DialogContent
        className={cn(
          'w-full max-w-[560px] rounded-[24px] bg-card border border-border p-0 shadow-2xl overflow-hidden font-sans',
          'transition-all duration-200 ease-out'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/70">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Create a room</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Room Name */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="room-name" className="text-[12px] font-medium text-muted-foreground">
                Room name <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {name.length}/60
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                id="room-name"
                type="text"
                maxLength={60}
                placeholder="e.g. Campus Build Sprint 2026"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorInfo) setErrorInfo(null);
                }}
                className={cn(
                  'w-full h-10 px-3.5 pr-20 rounded-[14px] bg-[#F3F3F3] dark:bg-muted/70 text-sm text-foreground placeholder:text-muted-foreground/60',
                  'outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent'
                )}
              />
              <button
                type="button"
                onClick={() => suggestMutation.mutate()}
                disabled={suggestMutation.isPending}
                className="absolute right-2 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {suggestMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                Suggest
              </button>
            </div>
          </div>

          {/* 2. Room Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="room-desc" className="text-[12px] font-medium text-muted-foreground">
                Room description
              </label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {description.length}/200
              </span>
            </div>
            <textarea
              id="room-desc"
              rows={2}
              maxLength={200}
              placeholder="A brief note about your team workspace or event setup..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                'w-full p-3 rounded-[14px] bg-[#F3F3F3] dark:bg-muted/70 text-sm text-foreground placeholder:text-muted-foreground/60',
                'outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all border border-transparent'
              )}
            />
          </div>

          {/* 3. Project Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="project-desc" className="text-[12px] font-medium text-muted-foreground">
                Project description
              </label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {projectDescription.length}/500
              </span>
            </div>
            <textarea
              id="project-desc"
              rows={3}
              maxLength={500}
              placeholder="What are you building? One or two sentences. You can refine it in the brief."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className={cn(
                'w-full p-3 rounded-[14px] bg-[#F3F3F3] dark:bg-muted/70 text-sm text-foreground placeholder:text-muted-foreground/60',
                'outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all border border-transparent'
              )}
            />
            <p className="text-[11px] text-muted-foreground">
              What are you building? One or two sentences. You can refine it in the brief.
            </p>
          </div>

          {/* 4. Event Template (2x3 grid) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">
              Event template <span className="text-red-500">*</span>
            </label>
            <div
              role="radiogroup"
              aria-label="Event template"
              className="grid grid-cols-2 gap-2.5"
            >
              {templates.map((tpl, idx) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    onKeyDown={(e) => handleTemplateKeyDown(e, idx)}
                    className={cn(
                      'relative flex items-start gap-2.5 p-3 rounded-[16px] border text-left cursor-pointer transition-all duration-150',
                      'hover:-translate-y-0.5 hover:shadow-xs outline-none',
                      isSelected
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900/[0.03] dark:bg-white/[0.05] ring-1 ring-neutral-900 dark:ring-neutral-100'
                        : 'border-border bg-card hover:border-neutral-400'
                    )}
                  >
                    <div className="size-8 rounded-xl bg-muted/80 flex items-center justify-center text-lg shrink-0">
                      {tpl.icon || '🏆'}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="text-[13px] font-semibold text-foreground leading-tight truncate">
                        {tpl.name}
                      </div>
                      <div className="text-[12px] text-muted-foreground leading-tight mt-1 truncate">
                        {tpl.meta || `${tpl.durationHours}h · ${tpl.teamSize} members`}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute bottom-2 right-2 size-4 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center">
                        <Check className="size-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedTemplate && (
              <p className="text-[12px] text-muted-foreground mt-1">
                {selectedTemplate.prefills || `Pre-fills: ${selectedTemplate.durationHours >= 168 ? '1-week' : `${selectedTemplate.durationHours}h`} clock and phase plan`}
              </p>
            )}
          </div>

          {/* 5. Event Starts Collapsible Row */}
          <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground">Event starts</span>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/70 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                <span>{formatDateString(eventStartDate)}</span>
                <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', showDatePicker && 'rotate-180')} />
              </button>
            </div>

            {showDatePicker && (
              <div className="flex flex-col gap-2 p-3 rounded-2xl bg-muted/40 border border-border mt-1">
                <input
                  type="datetime-local"
                  value={toLocalDatetimeInput(eventStartDate)}
                  onChange={(e) => {
                    const parsed = new Date(e.target.value);
                    if (!isNaN(parsed.getTime())) {
                      setEventStartDate(parsed);
                    }
                  }}
                  className="h-9 px-3 rounded-xl bg-card border border-border text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-muted-foreground">
                  Timezone: <strong className="text-foreground">{userTimezone}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Error Message inside dialog */}
          {errorInfo && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <div className="flex items-center justify-between">
                <span>{errorInfo.message}</span>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="font-semibold underline ml-2 cursor-pointer hover:opacity-80"
                >
                  Retry
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="flex items-center gap-1 text-[11px] text-red-700/80 dark:text-red-300/80 mt-1 cursor-pointer"
              >
                {showErrorDetails ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                Details
              </button>
              {showErrorDetails && (
                <pre className="mt-2 text-[10px] bg-red-950/10 p-2 rounded-lg font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify({ request: errorInfo.request, response: errorInfo.response }, null, 2)}
                </pre>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/70 bg-card">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={createMutation.isPending}
            className="text-xs font-medium h-9 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!isFormValid || createMutation.isPending}
            className={cn(
              'h-9 px-5 rounded-[12px] text-xs font-semibold transition-all duration-200',
              isSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900'
            )}
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                Creating...
              </span>
            ) : isSuccess ? (
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5" />
                Created!
              </span>
            ) : (
              'Create room'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

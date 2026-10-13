import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, Clock, Users, ChevronDown, ChevronUp, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/design/api';
import { toast } from 'sonner';

interface EventTemplate {
  id: string;
  name: string;
  description?: string;
  durationHours: number;
  teamMin: number;
  teamMax: number;
  icon?: string;
}

const FALLBACK_TEMPLATES: EventTemplate[] = [
  { id: 'sih-36h', name: 'SIH-Style', durationHours: 36, teamMin: 4, teamMax: 6, description: '36-hour non-stop national hackathon' },
  { id: 'weekend-48h', name: 'Weekend Sprint', durationHours: 48, teamMin: 2, teamMax: 4, description: 'Classic 48h weekend competition' },
  { id: 'fast-24h', name: '24h Hackathon', durationHours: 24, teamMin: 2, teamMax: 4, description: 'Rapid 1-day build and pitch' },
  { id: 'global-72h', name: 'Global Online', durationHours: 72, teamMin: 2, teamMax: 5, description: 'Multi-timezone asynchronous build' },
  { id: 'mini-12h', name: 'Mini Hack', durationHours: 12, teamMin: 1, teamMax: 3, description: 'Half-day sprint or workshop' },
  { id: 'internal-corp', name: 'Company Hack', durationHours: 24, teamMin: 3, teamMax: 6, description: 'Internal team hackathon' },
];

export function CreateRoomWizard() {
  const navigate = useNavigate();

  // Form State in required order
  const [name, setName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('sih-36h');
  const [scheduledStart, setScheduledStart] = useState(false);
  const [startDateTime, setStartDateTime] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 1. Templates query
  const { data: serverTemplates } = useQuery<EventTemplate[]>({
    queryKey: ['event-templates'],
    queryFn: () => apiFetch<EventTemplate[]>('/api/v1/event-templates'),
  });

  const templates = (serverTemplates && serverTemplates.length > 0)
    ? serverTemplates
    : FALLBACK_TEMPLATES;

  // 2. AI status query to disable naming sparkle button if AI unavailable
  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => apiFetch<{ healthy?: boolean; available?: boolean }>('/api/v1/ai/status').catch(() => ({ healthy: false, available: false })),
  });
  const isAiDisabled = aiStatus?.healthy === false || aiStatus?.available === false;

  // "Suggest a name" sparkle mutation
  const { mutate: suggestName, isPending: isSuggesting } = useMutation({
    mutationFn: () => apiFetch<{ suggestion: string }>('/api/v1/rooms/suggest-name', { method: 'POST' }),
    onSuccess: (data) => {
      if (data?.suggestion) {
        setName(data.suggestion);
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.name;
          return next;
        });
        toast.success(`Suggested: ${data.suggestion}`);
      }
    },
    onError: () => {
      toast.error('Could not generate name at this time.');
    },
  });

  // Create room mutation
  const { mutate: submitCreateRoom, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      setFieldErrors({});
      const template = templates.find((t) => t.id === selectedTemplateId) || templates[0];
      const payload: any = {
        name: name.trim(),
        templateId: template.id,
        template: template.id,
        description: description.trim() || undefined,
      };

      if (scheduledStart && startDateTime) {
        payload.startsAt = new Date(startDateTime).toISOString();
      }

      return apiFetch<{ id: string; name: string }>('/api/v1/rooms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (room) => {
      toast.success('Room created successfully!');
      navigate(`/app/room/${room.id}/overview`);
    },
    onError: (err: any) => {
      if (err?.details && typeof err.details === 'object') {
        setFieldErrors(err.details);
      } else {
        toast.error(err?.message || 'Failed to create room.');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFieldErrors({ name: 'Room name is required' });
      return;
    }
    submitCreateRoom();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] p-4 sm:p-6 bg-shell text-ink">
      <Card className="w-full max-w-[620px] p-6 sm:p-8 rounded-[20px] bg-card border border-border shadow-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink font-sans">
            Create Hackathon Room
          </h1>
          <p className="text-xs text-ink-2 mt-1">
            Set up your shared workspace, invite teammates, and start building.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Name with "Suggest a name" sparkle button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="room-name" className="text-xs font-semibold text-ink">
                Room Name <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => suggestName()}
                disabled={isSuggesting || isAiDisabled}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
                  'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title={isAiDisabled ? 'AI naming assistant currently unavailable' : 'Suggest a project name'}
              >
                {isSuggesting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3 text-blue-600 dark:text-blue-400" />
                )}
                <span>Suggest a name</span>
              </button>
            </div>

            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              placeholder="e.g. HealthPulse AI, SolarGrid OS"
              className={cn(
                'w-full h-10 px-3.5 rounded-[12px] border bg-surface text-sm text-ink outline-none transition-all',
                fieldErrors.name
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
              )}
            />
            {fieldErrors.name && (
              <p className="text-[11px] font-medium text-rose-500">{fieldErrors.name}</p>
            )}
          </div>

          {/* 2. Event template visual 2x3 card picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink">
              Event Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {templates.slice(0, 6).map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={cn(
                      'p-3 rounded-[14px] border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5',
                      isSelected
                        ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-surface hover:bg-hover border-border'
                    )}
                  >
                    <div>
                      <p className="text-[13px] font-bold text-ink leading-snug line-clamp-1">
                        {tpl.name}
                      </p>
                      {tpl.description && (
                        <p className="text-[10px] text-ink-3 line-clamp-1 mt-0.5">
                          {tpl.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-[10px] font-mono text-ink-2">
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="size-3 text-ink-3" />
                        <span>{tpl.durationHours}h</span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Users className="size-3 text-ink-3" />
                        <span>{tpl.teamMin}-{tpl.teamMax}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Start date and time */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-surface border border-border">
              <div>
                <p className="text-xs font-semibold text-ink">Schedule Start Time</p>
                <p className="text-[11px] text-ink-3">
                  {scheduledStart ? 'Pick future kickoff time' : 'Defaults to starting right now'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setScheduledStart(!scheduledStart)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                  scheduledStart
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-card text-ink-2 hover:text-ink border-border'
                )}
              >
                {scheduledStart ? 'Scheduled' : 'Starting now'}
              </button>
            </div>

            {scheduledStart && (
              <div className="p-3 rounded-[12px] bg-surface border border-border animate-in fade-in duration-200">
                <label className="text-[11px] font-medium text-ink-2 block mb-1">
                  Kickoff Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs text-ink outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* 4. Description collapsed under "Add details" */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-ink transition-colors cursor-pointer"
            >
              <span>Add details</span>
              {showDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {showDetails && (
              <div className="mt-2 animate-in fade-in duration-200">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Problem theme, sponsor track, or short project description (optional)"
                  rows={3}
                  className="w-full p-3 rounded-[12px] border border-border bg-surface text-xs text-ink outline-none focus:border-blue-500 resize-none"
                />
              </div>
            )}
          </div>

          {/* 5. Primary button */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/app/rooms')}
              disabled={isCreating}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creating room…</span>
                </>
              ) : (
                <>
                  <span>Create room</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

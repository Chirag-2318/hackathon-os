import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEventTemplates, suggestRoomName } from '@/api/client';
import { roomApi } from '@/features/room/api';
import { useOverlay } from '@/app/providers/overlay-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Plus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CreateRoomDialogOverlay() {
  const { isOpen, close } = useOverlay('create-room-dialog');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch event templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['event-templates'],
    queryFn: fetchEventTemplates,
    enabled: isOpen,
  });

  // Suggest room name mutation
  const suggestMutation = useMutation({
    mutationFn: suggestRoomName,
    onSuccess: (data) => {
      setName(data.suggestion);
    },
  });

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => roomApi.createRoom(payload),
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: ['home'] });
      close();
      setName('');
      setDescription('');
      setSelectedTemplateId('');
      navigate(`/app/room/${newRoom.id}/overview`);
    },
    onError: () => {
      setError('Failed to create room. Please try again.');
    },
  });

  const handleClose = () => {
    setError(null);
    close();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a room name.');
      return;
    }
    setError(null);
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { if (!openState) handleClose(); }}>
      <DialogContent className="sm:max-w-[540px] rounded-[var(--r-card)] bg-surface border border-border p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-ink">
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plus className="size-5" />
            </div>
            Create a new room
          </DialogTitle>
          <DialogDescription className="text-sm text-ink-2">
            Set up your hackathon project command center. Choose a template or start from scratch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Room Name with Suggest button */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="create-room-name" className="text-xs font-semibold uppercase tracking-wider text-ink-2">
                Room Name <span className="text-danger">*</span>
              </Label>
              <button
                type="button"
                onClick={() => suggestMutation.mutate()}
                disabled={suggestMutation.isPending}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {suggestMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                Suggest name
              </button>
            </div>
            <Input
              id="create-room-name"
              placeholder="e.g. Campus Build Sprint 2026"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="h-10 text-sm bg-card border-border focus:border-border-strong rounded-[var(--r-control)]"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-room-desc" className="text-xs font-semibold uppercase tracking-wider text-ink-2">
              Project Description (Optional)
            </Label>
            <Input
              id="create-room-desc"
              placeholder="What are you building this weekend?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 text-sm bg-card border-border focus:border-border-strong rounded-[var(--r-control)]"
            />
          </div>

          {/* Template Picker */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-ink-2">
              Event Template
            </Label>
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center p-4 text-xs text-ink-3">
                <Loader2 className="size-4 animate-spin mr-2" /> Loading templates…
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {templates.map((tpl: any) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        if (!name) setName(tpl.name);
                      }}
                      className={cn(
                        'flex flex-col text-left p-3 rounded-xl border text-xs transition-all cursor-pointer',
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                          : 'border-border bg-card hover:border-border-strong'
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-ink truncate mb-1">
                        <Calendar className="size-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{tpl.name}</span>
                      </div>
                      <p className="text-[11px] text-ink-3 line-clamp-1">{tpl.duration ?? '36h sprint'}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-ink-3">No preset templates found.</p>
            )}
          </div>

          {error && <p className="text-xs text-danger font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="bg-ink text-white hover:bg-ink/90 font-medium px-5"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Creating…
                </>
              ) : (
                'Create Room'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

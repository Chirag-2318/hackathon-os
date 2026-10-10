import { createElement } from 'react';
import { X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Lozenge } from '@/shared/ui';
import { getPlaybookIcon } from '../playbook-icons';
import { useOverlay } from '@/app/providers/overlay-store';
import type { PlaybookDetail } from '@/api/client';

interface PlaybookDialogProps {
  playbook: PlaybookDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaybookDialog({ playbook, isOpen, onClose }: PlaybookDialogProps) {
  const createRoomOverlay = useOverlay('create-room-dialog');

  const icon = playbook ? getPlaybookIcon(playbook.id, playbook.illustrationKey) : null;

  const handleUsePlaybook = () => {
    if (!playbook) return;
    const playbookId = playbook.id;
    onClose();
    setTimeout(() => {
      createRoomOverlay.open({ defaultTemplateId: playbookId });
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="pb-dialog"
        showCloseButton={false}
        className="sm:max-w-none w-[min(960px,calc(100vw-32px))] max-h-[min(720px,calc(100dvh-48px))] p-0 gap-0 border border-border rounded-[var(--r-card)] bg-card shadow-none ring-0 flex flex-col overflow-hidden"
      >
        {!playbook ? (
          <div className="p-8 flex items-center justify-center">
            <div className="text-sm text-ink-2 animate-pulse">Loading playbook...</div>
          </div>
        ) : (
          <>
            {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-8 rounded-[10px] bg-active flex items-center justify-center shrink-0">
              {createElement(icon, {
                className: 'size-4 text-ink-2',
                strokeWidth: 1.75,
              })}
            </div>
            <div className="min-w-0">
              <div className="text-xs leading-4 text-ink-2 truncate">
                {playbook.eventType} format
              </div>
              <DialogTitle className="text-dialog-title font-semibold text-ink m-0 truncate">
                {playbook.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {playbook.eventType}
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            data-testid="pb-dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
            className="size-7 rounded-md flex items-center justify-center text-ink-2 hover:text-ink hover:bg-hover transition-colors cursor-pointer shrink-0 ml-4"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Deliverables section */}
              {playbook.checklistPreview && playbook.checklistPreview.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold text-ink-2">Deliverables</h3>
                    <Lozenge variant="neutral">{playbook.checklistPreview.length}</Lozenge>
                  </div>
                  <ul className="space-y-2">
                    {playbook.checklistPreview.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-[13px] leading-[18px] text-ink"
                      >
                        <Check
                          className="size-3.5 text-ink-2 mt-0.5 shrink-0"
                          strokeWidth={2}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Starter rules section */}
              {playbook.defaultRubric && playbook.defaultRubric.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold text-ink-2">Starter rules</h3>
                    <Lozenge variant="neutral">{playbook.defaultRubric.length}</Lozenge>
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-[13px] leading-[18px] text-ink marker:text-ink-2">
                    {playbook.defaultRubric.map((rule, idx) => (
                      <li key={idx}>
                        <span className="text-ink">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right column / Details panel */}
            <div className="w-full md:w-72 shrink-0 md:border-l md:border-border md:pl-6 space-y-4 sticky bottom-0 md:static bg-card md:bg-transparent -mx-6 md:mx-0 px-6 md:px-0 py-3 md:py-0 border-t md:border-t-0 border-border">
              <button
                type="button"
                data-testid="pb-use"
                onClick={handleUsePlaybook}
                className="w-full h-9 rounded-[var(--r-control)] bg-brand text-brand-foreground font-medium text-sm hover:bg-brand/90 transition-colors flex items-center justify-center cursor-pointer"
              >
                Use this playbook
              </button>

              <div className="space-y-3 pt-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-ink-2">Format</span>
                  <span className="font-medium text-ink">{playbook.eventType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-2">Team size</span>
                  <span className="font-medium text-ink">{playbook.teamSizeLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-2">Phases</span>
                  <span className="font-medium text-ink">
                    {playbook.phases || `${playbook.phaseCount} phases`}
                  </span>
                </div>
              </div>

              <p className="text-xs leading-4 text-ink-2 pt-2 border-t border-border">
                You can adjust phases, timers and deliverables after creating the room.
              </p>
            </div>
          </div>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>
  );
}

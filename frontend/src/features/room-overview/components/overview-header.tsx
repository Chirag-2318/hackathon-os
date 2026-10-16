import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Download, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InviteCodeDialog } from '@/features/room/components/InviteCodeDialog';
import { API_BASE_URL } from '@/lib/apiClient';
import type { BoardPhase } from '@/services/types';

export interface OverviewHeaderProps {
  roomId: string;
  roomName: string;
  stage?: string;
  templateName?: string;
  durationHours?: number;
  clockStatusText: string;
  hasPhases: boolean;
  totalPhasesCount: number;
  firstPhaseKey: string;
  isBuildStage: boolean;
}

export function OverviewHeader({
  roomId,
  roomName,
  stage = 'build',
  templateName = 'Hackathon Sprint',
  durationHours = 36,
  clockStatusText,
  totalPhasesCount,
  firstPhaseKey,
  isBuildStage,
}: OverviewHeaderProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(`overview_banner_dismissed_${roomId}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem(`overview_banner_dismissed_${roomId}`, 'true');
    } catch {}
  };

  const handleExportZip = () => {
    if (!roomId) return;
    const base = API_BASE_URL;
    window.open(`${base}/api/v1/rooms/${roomId}/export.zip`, '_blank');
  };

  const stageWord = stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
  const showBanner = isBuildStage && !bannerDismissed;

  return (
    <div className="space-y-4">
      {/* 1. Build Phase Live Banner */}
      {showBanner && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-[10px] border border-emerald-500/20 bg-emerald-500/[0.08] text-xs text-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-normal">
              Build is live. {totalPhasesCount} phases planned. Next: generate tasks for {firstPhaseKey}.
            </span>
            <Link
              to={`/app/room/${roomId}/board`}
              className="font-medium underline hover:opacity-80 text-foreground ml-1"
            >
              Go to Board &rarr;
            </Link>
          </div>
          <button
            type="button"
            onClick={handleDismissBanner}
            aria-label="Dismiss banner"
            className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* 2. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[40px] leading-none font-normal text-foreground tracking-tight">
            {roomName}
          </h1>
          <div className="text-sm text-muted-foreground font-normal mt-2 flex items-center gap-2 flex-wrap">
            <span>{stageWord}</span>
            <span>·</span>
            <span>{clockStatusText}</span>
            <span>·</span>
            <span>{templateName}</span>
            {durationHours > 0 && (
              <>
                <span>·</span>
                <span>{durationHours}h</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportZip}
            className="min-h-[44px] sm:min-h-9 px-3.5 rounded-[8px] border border-border bg-surface hover:bg-surface-raised text-xs font-medium text-foreground gap-1.5 cursor-pointer shadow-none"
          >
            <Download className="size-3.5" />
            <span>Export room (.zip)</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setInviteOpen(true)}
            className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 rounded-[8px] border border-border bg-surface hover:bg-surface-raised text-foreground cursor-pointer shadow-none"
            title="Invite teammates"
            aria-label="Invite teammates"
          >
            <UserPlus className="size-4" />
          </Button>
        </div>
      </div>

      <InviteCodeDialog roomId={roomId} open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

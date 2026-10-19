import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { RotateCcw, Clock, Loader2 } from 'lucide-react';
import { fetchPitchVersions, type PitchVersionSummary } from '../api/pitch-kit-api';

export interface VersionHistoryDrawerProps {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (version: number) => void;
  isRestoring?: boolean;
}

export function VersionHistoryDrawer({
  roomId,
  open,
  onOpenChange,
  onRestore,
  isRestoring = false,
}: VersionHistoryDrawerProps) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['pitch-versions', roomId],
    queryFn: () => fetchPitchVersions(roomId),
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border p-6 space-y-4">
        <SheetHeader>
          <SheetTitle className="font-display text-xl font-normal text-foreground">
            Version history
          </SheetTitle>
          <p className="font-mono text-xs text-muted-foreground">
            Last 20 revisions of this pitch
          </p>
        </SheetHeader>

        <div className="space-y-3 pt-2 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground text-xs">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading versions...
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center p-8 text-xs text-muted-foreground">
              No previous versions saved yet.
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-lg bg-background">
              {versions.map((ver) => {
                const dateStr = new Date(ver.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={ver.id}
                    className="p-3 space-y-1.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        v{ver.version}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {dateStr}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/90 font-medium">
                      {ver.note || 'Manual edit'}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground">
                        by @{ver.createdByName || 'teammate'} · {ver.beatCount} beats
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isRestoring}
                        onClick={() => onRestore(ver.version)}
                        className="h-6 px-2 text-[11px] font-mono"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Restore
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

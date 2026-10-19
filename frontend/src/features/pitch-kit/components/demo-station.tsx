import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDemoAssets,
  createDemoAsset,
  uploadScreenshot,
  updateDemoAsset,
  deleteDemoAsset,
  checkDemoAsset,
  fetchDemoLadder,
  updateDemoLadderRung,
  markDemoLadderTested,
  fetchDemoPreflight,
  toggleDemoPreflightItem,
  addDemoPreflightItem,
  resetDemoPreflight,
  type PitchSettings,
} from '../api/pitch-kit-api';
import type { RoomMember } from '@/services/types';
import { DemoProofOfWork } from './demo-proof-of-work';
import { DemoScreenshots } from './demo-screenshots';
import { DemoLadder } from './demo-ladder';
import { DemoPreflight } from './demo-preflight';
import { DemoStageRoles } from './demo-stage-roles';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface DemoStationProps {
  roomId: string;
  isLeader: boolean;
  members: RoomMember[];
  settings: PitchSettings | null;
  onUpdateRole: (role: 'presenter' | 'operator', userId: string | null) => Promise<void>;
  lastUpdatedBy?: string | null;
}

export function DemoStation({
  roomId,
  isLeader,
  members,
  settings,
  onUpdateRole,
  lastUpdatedBy,
}: DemoStationProps) {
  const queryClient = useQueryClient();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Assets Query
  const {
    data: assets = [],
    isLoading: assetsLoading,
    isError: assetsError,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: ['demo-assets', roomId],
    queryFn: () => fetchDemoAssets(roomId),
    staleTime: 30_000,
  });

  // Ladder Query
  const {
    data: ladder = [],
    isLoading: ladderLoading,
    isError: ladderError,
    refetch: refetchLadder,
  } = useQuery({
    queryKey: ['demo-ladder', roomId],
    queryFn: () => fetchDemoLadder(roomId),
    staleTime: 30_000,
  });

  // Preflight Query
  const {
    data: preflight = [],
    isLoading: preflightLoading,
    isError: preflightError,
    refetch: refetchPreflight,
  } = useQuery({
    queryKey: ['demo-preflight', roomId],
    queryFn: () => fetchDemoPreflight(roomId),
    staleTime: 30_000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['demo-assets', roomId] });
    queryClient.invalidateQueries({ queryKey: ['demo-ladder', roomId] });
    queryClient.invalidateQueries({ queryKey: ['demo-preflight', roomId] });
    queryClient.invalidateQueries({ queryKey: ['pitchkit-readiness', roomId] });
  };

  // Asset mutations
  const saveLinkMutation = useMutation({
    mutationFn: (vars: { kind: string; url: string; title?: string }) =>
      createDemoAsset(roomId, vars),
    onSuccess: () => invalidateAll(),
  });

  const checkLinkMutation = useMutation({
    mutationFn: (assetId: string) => checkDemoAsset(roomId, assetId),
    onSuccess: () => invalidateAll(),
  });

  const removeAssetMutation = useMutation({
    mutationFn: (assetId: string) => deleteDemoAsset(roomId, assetId),
    onSuccess: () => invalidateAll(),
  });

  const uploadScreenshotMutation = useMutation({
    mutationFn: (file: File) => uploadScreenshot(roomId, file),
    onSuccess: () => invalidateAll(),
  });

  const updateAssetMutation = useMutation({
    mutationFn: (vars: { assetId: string; req: { caption?: string; position?: number } }) =>
      updateDemoAsset(roomId, vars.assetId, vars.req),
    onSuccess: () => invalidateAll(),
  });

  // Ladder mutations
  const updateSayMutation = useMutation({
    mutationFn: (vars: { rung: string; sayText: string }) =>
      updateDemoLadderRung(roomId, vars.rung, { sayText: vars.sayText }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['demo-ladder', roomId] }),
  });

  const testLadderMutation = useMutation({
    mutationFn: (rung: string) => markDemoLadderTested(roomId, rung),
    onSuccess: () => invalidateAll(),
  });

  // Preflight mutations
  const togglePreflightMutation = useMutation({
    mutationFn: (vars: { itemId: string; checked: boolean }) =>
      toggleDemoPreflightItem(roomId, vars.itemId, vars.checked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['demo-preflight', roomId] }),
  });

  const addPreflightMutation = useMutation({
    mutationFn: (label: string) => addDemoPreflightItem(roomId, label),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['demo-preflight', roomId] }),
  });

  const resetPreflightMutation = useMutation({
    mutationFn: () => resetDemoPreflight(roomId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['demo-preflight', roomId] }),
  });

  const linkAssets = assets.filter((a) => a.kind !== 'SCREENSHOT');
  const screenshots = assets.filter((a) => a.kind === 'SCREENSHOT');

  return (
    <div className="space-y-4">
      {/* Sync / Offline notices */}
      <div className="flex items-center justify-between min-h-6">
        {lastUpdatedBy ? (
          <span className="text-xs font-mono text-muted-foreground animate-pulse">
            Updated by @{lastUpdatedBy}
          </span>
        ) : (
          <span />
        )}
        {isOffline && (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <WifiOff className="w-3 h-3" /> Offline · Viewing cached demo station
          </span>
        )}
      </div>

      {/* Main 7 / 5 Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border border-border rounded-xl bg-card overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* LEFT COLUMN: Proof of work (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-10">
          {assetsLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : assetsError ? (
            <div className="p-6 text-center space-y-3 border border-dashed border-border rounded-lg">
              <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
              <p className="text-xs text-muted-foreground">Unable to load demo assets</p>
              <Button size="sm" variant="outline" onClick={() => refetchAssets()}>
                <RefreshCw className="w-3 h-3 mr-1" /> Retry
              </Button>
            </div>
          ) : (
            <>
              <DemoProofOfWork
                assets={linkAssets}
                onSaveLink={async (kind, url, title) => {
                  await saveLinkMutation.mutateAsync({ kind, url, title });
                }}
                onCheckLink={async (assetId) => {
                  await checkLinkMutation.mutateAsync(assetId);
                }}
                onRemoveAsset={async (assetId) => {
                  await removeAssetMutation.mutateAsync(assetId);
                }}
              />

              <div className="pt-4 border-t border-border">
                <DemoScreenshots
                  roomId={roomId}
                  screenshots={screenshots}
                  onUploadScreenshot={async (file) => {
                    await uploadScreenshotMutation.mutateAsync(file);
                  }}
                  onUpdateAsset={async (assetId, req) => {
                    await updateAssetMutation.mutateAsync({ assetId, req });
                  }}
                  onDeleteAsset={async (assetId) => {
                    await removeAssetMutation.mutateAsync(assetId);
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: If it breaks & On stage (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 space-y-10 bg-muted/10">
          {ladderLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-44 w-full" />
            </div>
          ) : ladderError ? (
            <div className="p-6 text-center space-y-3 border border-dashed border-border rounded-lg">
              <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
              <p className="text-xs text-muted-foreground">Unable to load failure ladder</p>
              <Button size="sm" variant="outline" onClick={() => refetchLadder()}>
                <RefreshCw className="w-3 h-3 mr-1" /> Retry
              </Button>
            </div>
          ) : (
            <DemoLadder
              ladder={ladder}
              onUpdateSayText={async (rung, sayText) => {
                await updateSayMutation.mutateAsync({ rung, sayText });
              }}
              onMarkAsTested={async (rung) => {
                await testLadderMutation.mutateAsync(rung);
              }}
            />
          )}

          {preflightLoading ? (
            <div className="space-y-3 pt-6 border-t border-border">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : preflightError ? (
            <div className="p-6 text-center space-y-3 border border-dashed border-border rounded-lg">
              <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
              <p className="text-xs text-muted-foreground">Unable to load preflight checklist</p>
              <Button size="sm" variant="outline" onClick={() => refetchPreflight()}>
                <RefreshCw className="w-3 h-3 mr-1" /> Retry
              </Button>
            </div>
          ) : (
            <div className="pt-6 border-t border-border">
              <DemoPreflight
                items={preflight}
                isLeader={isLeader}
                onToggleItem={async (itemId, checked) => {
                  await togglePreflightMutation.mutateAsync({ itemId, checked });
                }}
                onAddItem={async (label) => {
                  await addPreflightMutation.mutateAsync(label);
                }}
                onResetItems={async () => {
                  await resetPreflightMutation.mutateAsync();
                }}
              />
            </div>
          )}

          <div className="pt-6 border-t border-border">
            <DemoStageRoles
              settings={settings}
              members={members}
              onUpdateRole={onUpdateRole}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

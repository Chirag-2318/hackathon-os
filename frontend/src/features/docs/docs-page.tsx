import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { docsService } from '@/services/docsService';
import type { DocFile, DocVersion } from '@/services/types';
import { DocsListPane } from './components/docs-list-pane';
import { DocsCenterPane } from './components/docs-center-pane';
import { DocsRightPane } from './components/docs-right-pane';
import { downloadZip } from '@/utils/zip';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PanelRightClose, PanelRightOpen, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { saveCachedDocs, getCachedDocs, EmptyState, ErrorState, ConflictBanner, apiFetch, useLiveContext } from '@/design';
import { ConflictDialog } from '@/components/conflict/ConflictDialog';
import { exportRoomZip } from '@/shared/utils/room-export';

export function DocsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const [files, setFiles] = useState<DocFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);
  const [showRightPane, setShowRightPane] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    docsService.getDocs(roomId)
      .then(async (docs) => {
        if (mounted) {
          if (docs && docs.length > 0) {
            const returnDocId = (location.state as any)?.docId;
            const returnDocName = (location.state as any)?.docName;
            let target = docs[0];
            if (returnDocId || returnDocName) {
              const matched = docs.find(d => (returnDocId && d.id === returnDocId) || (returnDocName && d.name === returnDocName));
              if (matched) target = matched;
            }
            try {
              const detail = await docsService.getDoc(roomId, target.name);
              const fullDocs = docs.map(d => d.id === target.id && detail ? { ...d, content: detail.content, versions: detail.versions } : d);
              setFiles(fullDocs);
              saveCachedDocs(roomId, fullDocs);
            } catch {
              setFiles(docs);
              saveCachedDocs(roomId, docs);
            }
            setSelectedFileId(target.id);
          } else {
            setFiles([]);
            setSelectedFileId(null);
            saveCachedDocs(roomId, []);
          }
          setError(null);
          setLoading(false);
        }
      })
      .catch(async (err: any) => {
        console.error('Failed to load docs:', err);
        if (mounted) {
          const cached = await getCachedDocs(roomId);
          if (cached?.data && cached.data.length > 0) {
            setFiles(cached.data);
            setSelectedFileId(cached.data[0].id);
          } else {
            setFiles([]);
            setSelectedFileId(null);
          }
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !selectedFileId) return;
    const current = files.find(f => f.id === selectedFileId);
    if (current && !current.content) {
      docsService.getDoc(roomId, current.name).then(detail => {
        if (detail && detail.content) {
          setFiles(prev => prev.map(f => f.id === selectedFileId ? { ...f, content: detail.content, versions: detail.versions } : f));
        }
      });
    }
  }, [roomId, selectedFileId]);

  const selectedFile = files.find(f => f.id === selectedFileId);

  const { lastEvent } = useLiveContext();
  const [remoteUpdateBanner, setRemoteUpdateBanner] = useState<{
    editorName: string;
    serverVersion: number;
    serverContent: string;
    updatedAt?: string;
  } | null>(null);

  const [conflictDialogState, setConflictDialogState] = useState<{
    open: boolean;
    localContent: string;
    remoteContent: string;
    serverVersion: number;
    lastEditorName?: string;
    updatedAt?: string;
  }>({
    open: false,
    localContent: '',
    remoteContent: '',
    serverVersion: 0,
  });

  // SSE Collision Avoidance: non-blocking banner if current doc updated by teammate
  useEffect(() => {
    if (!lastEvent || !selectedFile || !roomId) return;
    if (lastEvent.type === 'docs' || lastEvent.resource === 'doc' || lastEvent.resource === 'docs') {
      const isCurrentDoc = !lastEvent.id || lastEvent.id === selectedFile.id || lastEvent.id === selectedFile.name;
      if (isCurrentDoc) {
        docsService.getDoc(roomId, selectedFile.name).then((fresh) => {
          if (fresh && (fresh.version || 1) > (selectedFile.version || 1)) {
            setRemoteUpdateBanner({
              editorName: fresh.lastEditedBy?.displayName || fresh.lastEditedBy?.login || 'A teammate',
              serverVersion: fresh.version || 1,
              serverContent: fresh.content || '',
              updatedAt: fresh.updatedAt,
            });
          }
        }).catch(() => {});
      }
    }
  }, [lastEvent, roomId, selectedFile?.id, selectedFile?.name, selectedFile?.version]);

  // Save new version
  const handleSaveContent = async (newContent: string, explicitVersion?: number) => {
    if (!roomId || !selectedFile) return;

    try {
      const targetVersion = explicitVersion !== undefined ? explicitVersion : selectedFile.version;
      const updated = await docsService.updateDoc(roomId, selectedFile.name, {
        content: newContent,
        baseVersion: targetVersion,
      });
      setConflictDialogState(prev => ({ ...prev, open: false }));
      setRemoteUpdateBanner(null);
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? {
        ...f,
        content: updated.content,
        version: updated.version ?? updated.currentVersion ?? ((f.version || 1) + 1),
        versions: updated.versions || f.versions,
        health: updated.health || (f as any).health,
      } : f));
      toast.success(`Saved ${selectedFile.name}`);
    } catch (err: any) {
      if (err?.status === 409 || err?.code === 'EDIT_CONFLICT' || err?.message?.includes('DOC_CHANGED')) {
        const fresh = await docsService.getDoc(roomId, selectedFile.name).catch(() => null);
        const serverVersion = Number(err?.details?.currentVersion ?? err?.details?.version ?? fresh?.version ?? (selectedFile.version || 1) + 1);
        const remoteContent = err?.details?.currentContent ?? fresh?.content ?? '';
        const editorName = err?.details?.lastEditorName ?? err?.details?.lastEditedBy?.displayName ?? fresh?.lastEditedBy?.displayName ?? 'A teammate';
        const updatedAt = err?.details?.updatedAt ?? fresh?.updatedAt ?? new Date().toISOString();

        // Stash local draft
        try {
          localStorage.setItem(`hos:doc:conflict:${selectedFile.name}`, JSON.stringify({
            content: newContent,
            timestamp: Date.now()
          }));
        } catch {}

        setConflictDialogState({
          open: true,
          localContent: newContent,
          remoteContent,
          serverVersion,
          lastEditorName: editorName,
          updatedAt,
        });

        toast.error('This document was updated by another team member.');
      } else {
        toast.error(err?.message || 'Failed to save document');
      }
    }
  };

  // Restore version
  const handleRestoreVersion = async (content: string) => {
    await handleSaveContent(content);
  };

  // Add Comment
  const handleAddComment = async (text: string) => {
    if (!roomId || !selectedFile) return;
    try {
      const newComment = await docsService.addComment(roomId, selectedFile.name, text);
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? {
        ...f,
        comments: [...(f.comments || []), newComment],
      } : f));
      toast.success('Comment added');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add comment');
    }
  };

  // Download All as ZIP from server endpoint
  const handleDownloadAllZip = async () => {
    if (!roomId) return;
    try {
      const res = await fetch(docsService.downloadAllZipUrl(roomId), { credentials: 'include' });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brackit-docs.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded all docs as ZIP');
    } catch {
      window.open(docsService.downloadAllZipUrl(roomId), '_blank');
    }
  };

  const [pushErrorNotice, setPushErrorNotice] = useState<string | null>(null);
  const [prResultUrl, setPrResultUrl] = useState<string | null>(null);
  const [isPushingDocs, setIsPushingDocs] = useState(false);

  const handlePushDocsToGithub = async () => {
    if (!roomId) return;
    setIsPushingDocs(true);
    setPushErrorNotice(null);
    setPrResultUrl(null);
    try {
      const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/export/push-docs`, { method: 'POST' });
      const prUrl = res?.pullRequestUrl || res?.prUrl || res?.url;
      if (prUrl) {
        setPrResultUrl(prUrl);
        toast.success('Pushed docs to GitHub! Pull request opened.');
      } else {
        toast.success('Pushed docs to repository.');
      }
    } catch (err: any) {
      if (err?.status === 409 || err?.code === 'CONFLICT' || err?.code === 'GITHUB_PERMISSIONS_MISSING') {
        setPushErrorNotice(err?.message || 'Permissions issue or conflict creating Pull Request on repository.');
      } else {
        toast.error(err?.message || 'Failed to push docs to GitHub');
      }
    } finally {
      setIsPushingDocs(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-full flex-1 bg-page p-6">
        <ErrorState
          message={error.message}
          requestId={error.requestId}
          onRetry={() => {
            setLoading(true);
            setError(null);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 w-full p-4 gap-4 bg-page">
        <Skeleton className="w-[260px] h-full rounded-xl" />
        <Skeleton className="flex-1 h-full rounded-xl" />
        <Skeleton className="w-[260px] h-full rounded-xl hidden lg:block" />
      </div>
    );
  }

  // Empty state
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-full flex-1 bg-page p-6">
        <EmptyState
          headline="Your vault is empty"
          subtext="You haven't generated any plan documents yet. Complete the Plan phase to auto-generate your sprint documents."
          primaryAction={{
            label: 'Go to Plan',
            onClick: () => {
              if (roomId) window.location.href = `/app/room/${roomId}/plan`;
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full flex-1 w-full flex flex-col bg-page overflow-hidden">
      {/* 3-Pane Full-Height Container with Hairlines */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
        {/* LEFT list pane (260px) */}
        <DocsListPane
          files={files}
          selectedFileId={selectedFileId}
          onSelectFile={setSelectedFileId}
          onDownloadAllZip={handleDownloadAllZip}
          onExportRoomZip={() => roomId && exportRoomZip(roomId, 'room')}
          onPushDocsToGithub={handlePushDocsToGithub}
          isPushingDocs={isPushingDocs}
          isLeader={true}
          pushErrorNotice={pushErrorNotice}
          prResultUrl={prResultUrl}
        />

        {/* CENTER document pane (flex-1) */}
        {selectedFile ? (
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            {remoteUpdateBanner && (
              <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Updated by <strong>@{remoteUpdateBanner.editorName}</strong> just now.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConflictDialogState({
                        open: true,
                        localContent: selectedFile.content || '',
                        remoteContent: remoteUpdateBanner.serverContent,
                        serverVersion: remoteUpdateBanner.serverVersion,
                        lastEditorName: remoteUpdateBanner.editorName,
                        updatedAt: remoteUpdateBanner.updatedAt,
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors"
                  >
                    View changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoteUpdateBanner(null)}
                    className="px-2 py-0.5 rounded hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 transition-colors"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            )}

            <ConflictDialog
              open={conflictDialogState.open}
              onOpenChange={(open) => setConflictDialogState(prev => ({ ...prev, open }))}
              entityType="document"
              entityName={selectedFile?.name}
              localContent={conflictDialogState.localContent}
              remoteContent={conflictDialogState.remoteContent}
              serverVersion={conflictDialogState.serverVersion}
              lastEditorName={conflictDialogState.lastEditorName}
              updatedAt={conflictDialogState.updatedAt}
              onKeepMine={(serverVersion) => handleSaveContent(conflictDialogState.localContent, serverVersion)}
              onTakeTheirs={(serverContent, serverVersion) => {
                setFiles(prev => prev.map(f => f.id === selectedFile.id ? { ...f, content: serverContent, version: serverVersion } : f));
                setConflictDialogState(prev => ({ ...prev, open: false }));
                setRemoteUpdateBanner(null);
                toast.info('Loaded latest document version.');
              }}
              onSaveMerged={(mergedContent, serverVersion) => handleSaveContent(mergedContent, serverVersion)}
            />
            <div className="flex-1 min-h-0">
              <DocsCenterPane
                file={selectedFile}
                onSaveContent={handleSaveContent}
                roomId={roomId}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a document from the left
          </div>
        )}

        {/* RIGHT info pane (260px, togglable below 1280px) */}
        {selectedFile && (
          <div className={showRightPane ? 'block' : 'hidden xl:block'}>
            <DocsRightPane
              file={selectedFile}
              onRestoreVersion={handleRestoreVersion}
              onAddComment={handleAddComment}
            />
          </div>
        )}

        {/* Toggle Right Pane button on smaller screens */}
        {selectedFile && (
          <button
            onClick={() => setShowRightPane(!showRightPane)}
            className="xl:hidden absolute top-3 right-4 z-20 size-8 rounded-lg bg-card border border-border shadow-xs flex items-center justify-center text-muted-foreground hover:text-foreground"
            title={showRightPane ? 'Hide outline' : 'Show outline'}
          >
            {showRightPane ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

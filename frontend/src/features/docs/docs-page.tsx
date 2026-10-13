import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { saveCachedDocs, getCachedDocs, EmptyState, ErrorState, ConflictBanner, apiFetch } from '@/design';
import { exportRoomZip } from '@/shared/utils/room-export';

export function DocsPage() {
  const { roomId } = useParams<{ roomId: string }>();
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
            const first = docs[0];
            try {
              const detail = await docsService.getDoc(roomId, first.name);
              const fullDocs = docs.map((d, i) => i === 0 && detail ? { ...d, content: detail.content, versions: detail.versions } : d);
              setFiles(fullDocs);
              saveCachedDocs(roomId, fullDocs);
            } catch {
              setFiles(docs);
              saveCachedDocs(roomId, docs);
            }
            setSelectedFileId(first.id);
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

  const [conflictState, setConflictState] = useState<{
    remoteContent: string;
    localContent: string;
    lastEditedBy?: string;
  } | null>(null);

  // Save new version
  const handleSaveContent = async (newContent: string) => {
    if (!roomId || !selectedFile) return;

    try {
      const updated = await docsService.updateDoc(roomId, selectedFile.name, {
        content: newContent,
        baseVersion: selectedFile.version,
      });
      setConflictState(null);
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? {
        ...f,
        content: updated.content,
        version: updated.currentVersion ?? ((f.version || 1) + 1),
        versions: updated.versions || f.versions,
        health: updated.health || (f as any).health,
      } : f));
      toast.success(`Saved ${selectedFile.name}`);
    } catch (err: any) {
      if (err?.status === 409 || err?.message?.includes('DOC_CHANGED')) {
        const fresh = await docsService.getDoc(roomId, selectedFile.name);
        setConflictState({
          remoteContent: fresh.content,
          localContent: newContent,
          lastEditedBy: err?.lastEditedBy || fresh?.lastEditedBy || (fresh as any)?.updatedBy || 'teammate',
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
      a.download = 'hackathon-os-docs.zip';
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
      <div className="flex items-center justify-center h-[calc(100vh-64px)] p-6">
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
      <div className="flex h-[calc(100vh-64px)] w-full p-4 gap-4">
        <Skeleton className="w-[260px] h-full rounded-xl" />
        <Skeleton className="flex-1 h-full rounded-xl" />
        <Skeleton className="w-[260px] h-full rounded-xl hidden lg:block" />
      </div>
    );
  }

  // Empty state
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] p-6">
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
    <div className="h-[calc(100vh-64px)] max-h-[calc(100dvh-64px)] w-full flex flex-col bg-background overflow-hidden">
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
            {conflictState && (
              <ConflictBanner
                lastEditedBy={conflictState.lastEditedBy || 'Another teammate'}
                remoteContent={conflictState.remoteContent}
                localContent={conflictState.localContent}
                onKeepMine={() => {
                  handleSaveContent(conflictState.localContent);
                }}
                onUseRemote={() => {
                  setFiles(prev => prev.map(f => f.id === selectedFile.id ? { ...f, content: conflictState.remoteContent } : f));
                  setConflictState(null);
                  toast.info('Loaded latest document version.');
                }}
                onManualMerge={(merged) => {
                  handleSaveContent(merged);
                }}
              />
            )}
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

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
import { CURRENT_USER_ID } from '@/services/mockStore';

export function DocsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [files, setFiles] = useState<DocFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRightPane, setShowRightPane] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    docsService.getDocs(roomId)
      .then((docs) => {
        if (mounted) {
          setFiles(docs || []);
          if (docs && docs.length > 0) {
            setSelectedFileId(docs[0].id);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load docs:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [roomId]);

  const selectedFile = files.find(f => f.id === selectedFileId);

  // Save new version
  const handleSaveContent = async (newContent: string) => {
    if (!roomId || !selectedFile) return;

    const currentVersions = selectedFile.versions || [
      {
        id: 'v1',
        version: 1,
        content: selectedFile.content,
        authorName: 'Plan Generator',
        createdAt: selectedFile.createdAt || new Date().toISOString(),
        note: 'Generated from the plan',
      },
    ];

    const newVersionNum = (selectedFile.version || 1) + 1;
    const newVersionRecord: DocVersion = {
      id: `v${newVersionNum}`,
      version: newVersionNum,
      content: newContent,
      authorName: 'Aarav Mehta',
      createdAt: new Date().toISOString(),
      note: 'Edited document',
    };

    const updatedFile: DocFile = {
      ...selectedFile,
      content: newContent,
      version: newVersionNum,
      versions: [newVersionRecord, ...currentVersions],
      updatedAt: new Date().toISOString(),
    };

    const nextFiles = files.map(f => f.id === selectedFile.id ? updatedFile : f);
    setFiles(nextFiles);
    await docsService.saveDocs(roomId, nextFiles);
  };

  // Restore version
  const handleRestoreVersion = async (content: string) => {
    await handleSaveContent(content);
  };

  // Add Comment
  const handleAddComment = async (text: string) => {
    if (!roomId || !selectedFile) return;

    const newComment = {
      id: `comm-${Date.now()}`,
      authorId: CURRENT_USER_ID,
      text,
      createdAt: new Date().toISOString(),
    };

    const updatedFile: DocFile = {
      ...selectedFile,
      comments: [...(selectedFile.comments || []), newComment],
    };

    const nextFiles = files.map(f => f.id === selectedFile.id ? updatedFile : f);
    setFiles(nextFiles);
    await docsService.saveDocs(roomId, nextFiles);
  };

  // Download All as ZIP
  const handleDownloadAllZip = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const zipFiles = files.map(f => ({
      name: f.name,
      content: f.content,
    }));

    // Add README.txt
    let readme = `Hackathon OS - Sprint Documentation Archive\nGenerated on: ${new Date().toUTCString()}\n\nIncluded Documents:\n`;
    files.forEach((f, i) => {
      readme += `${i + 1}. ${f.name} (v${f.version || 1})\n`;
    });
    zipFiles.push({
      name: 'README.txt',
      content: readme,
    });

    downloadZip(zipFiles, `hackathon-docs-${dateStr}.zip`);
  };

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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-6 text-center">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Your vault is empty</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          You haven't generated any plan documents yet. Complete the Plan phase to auto-generate your sprint documents.
        </p>
        <Link to={`/app/room/${roomId}/plan`}>
          <Button className="rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black">
            Go to Plan
          </Button>
        </Link>
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
        />

        {/* CENTER document pane (flex-1) */}
        {selectedFile ? (
          <DocsCenterPane
            file={selectedFile}
            onSaveContent={handleSaveContent}
          />
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

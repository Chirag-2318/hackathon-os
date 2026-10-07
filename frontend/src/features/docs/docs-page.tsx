import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FramedScreen } from '@/components/primitives/framed-screen';
import { Button } from '@/components/ui/button';
import { fetchDocsVault, type DocsVaultFile } from '@/api/client';
import { DocsFileTree } from './components/docs-file-tree';
import { DocsEditor } from './components/docs-editor';
import { DocsMetaPane } from './components/docs-meta-pane';
import { EmptyState } from '@/components/primitives/empty-state';
import { Loader2, Download } from 'lucide-react';
import { IconBrandGithub } from '@tabler/icons-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export function DocsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<DocsVaultFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    fetchDocsVault(roomId)
      .then((res) => {
        setFiles(res.files);
        if (res.files.length > 0) {
          setSelectedFileId(res.files[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-ink-muted" />
      </div>
    );
  }

  // S13 Empty state
  if (files.length === 0) {
    return (
      <FramedScreen title="Docs Vault" >
        <div className="flex flex-1 items-center justify-center bg-surface w-full h-full">
          <EmptyState
            title="Your vault is empty"
            description="You haven't generated any plan documents yet."
            illustrationSrc="solo" // using existing illustration key
            action={
              <Link to={`/app/room/${roomId}/plan`}>
                <Button variant="default">Generate your plan</Button>
              </Link>
            }
          />
        </div>
      </FramedScreen>
    );
  }

  const selectedFile = files.find(f => f.id === selectedFileId);

  return (
    <FramedScreen
      title="Docs Vault"
      noPadding
      headerActions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="gap-2">
            <Download className="size-4" /> Export zip
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="secondary" disabled className="gap-2 opacity-50 cursor-not-allowed">
                    <IconBrandGithub className="size-4" /> Push to repo /docs
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Connect GitHub first (coming in a future phase)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      }
    >
      <div className="flex h-full w-full overflow-hidden">
        {/* Left pane: File tree */}
        <DocsFileTree
          files={files}
          selectedFileId={selectedFileId}
          onSelect={setSelectedFileId}
        />

        {/* Center pane: Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedFile ? (
            <DocsEditor 
              file={selectedFile} 
              onChange={(newContent) => {
                // Update local state for demo purposes
                setFiles(prev => prev.map(f => f.id === selectedFile.id ? { ...f, content: newContent } : f));
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-ink-muted">
              Select a file to view
            </div>
          )}
        </div>

        {/* Right pane: Meta outline */}
        {selectedFile && (
          <DocsMetaPane file={selectedFile} />
        )}
      </div>
    </FramedScreen>
  );
}

import { useEffect, useState, useRef } from 'react';
import { fetchDiagrams, type DiagramStudioResponse } from '@/api/client';
import { MermaidEditor } from './components/mermaid-editor';
import { MermaidPreview } from './components/mermaid-preview';
import { TemplateGallery } from './components/template-gallery';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Copy, ArrowLeft, Loader2 } from 'lucide-react';
import { useDraftStore } from '@/app/layout/use-draft-store';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { docsService } from '@/services/docsService';
import { toast } from 'sonner';

const DEFAULT_DIAGRAM = 'graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Result 1]\n  B -->|No| D[Result 2]';

export function DiagramPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<DiagramStudioResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'studio' | 'excalidraw' | 'templates'>('studio');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSavingBack, setIsSavingBack] = useState(false);

  const handoff = location.state?.source === 'docs' ? location.state : null;
  const originalCodeRef = useRef<string | null>(null);

  const code = useDraftStore((s) => s.drafts[roomId || '']?.diagram?.code ?? DEFAULT_DIAGRAM);
  const setCode = useDraftStore((s) => s.setDiagramCode);

  useEffect(() => {
    if (location.state?.mermaidCode && roomId) {
      setCode(roomId, location.state.mermaidCode);
      if (originalCodeRef.current === null) {
        originalCodeRef.current = location.state.originalCode || location.state.mermaidCode;
      }
    }
  }, [location.state, roomId, setCode]);

  useEffect(() => {
    if (!roomId) return;
    fetchDiagrams(roomId).then(setData);
  }, [roomId]);

  const handleBackToDocsClick = () => {
    if (!handoff || !roomId) {
      navigate(`/app/room/${roomId}/docs`);
      return;
    }
    const original = originalCodeRef.current?.trim() || '';
    const current = code.trim();
    if (original && current !== original) {
      setShowSaveDialog(true);
    } else {
      navigate(`/app/room/${roomId}/docs`, {
        state: { ...handoff, highlight: true },
      });
    }
  };

  const handleDiscardAndReturn = () => {
    setShowSaveDialog(false);
    if (!roomId) return;
    navigate(`/app/room/${roomId}/docs`, {
      state: { ...handoff, highlight: true },
    });
  };

  const handleReplaceAndReturn = async () => {
    if (!roomId || !handoff) return;
    setIsSavingBack(true);
    try {
      const docName = handoff.docName || 'ARCHITECTURE.md';
      const doc = await docsService.getDoc(roomId, docName);
      if (!doc) throw new Error(`Document ${docName} not found`);

      let curr = 0;
      const targetIndex = handoff.blockIndex ?? 0;
      let replaced = false;

      const newContent = (doc.content || '').replace(
        /```mermaid\s*[\r\n]+([\s\S]*?)```/g,
        (match: string) => {
          if (curr === targetIndex) {
            curr++;
            replaced = true;
            return `\`\`\`mermaid\n${code.trim()}\n\`\`\``;
          }
          curr++;
          return match;
        }
      );

      const finalContent = replaced
        ? newContent
        : (doc.content || '') + `\n\n\`\`\`mermaid\n${code.trim()}\n\`\`\``;

      await docsService.updateDoc(roomId, docName, {
        content: finalContent,
        baseVersion: doc.currentVersion ?? doc.version ?? 1,
      });

      toast.success(`Updated diagram in ${docName}`);
      setShowSaveDialog(false);
      navigate(`/app/room/${roomId}/docs`, {
        state: { ...handoff, highlight: true },
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update document');
    } finally {
      setIsSavingBack(false);
    }
  };

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading Diagram Studio...</div>;
  }

  return (
    <div className="min-h-full flex-1 flex flex-col overflow-hidden bg-page">
      {/* Top Header */}
      <div className="h-14 border-b border-border bg-page flex items-center px-4 shrink-0 justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back to Docs button */}
          {handoff && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDocsClick}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Docs
            </Button>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40 text-xs font-medium shrink-0">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'studio'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Diagram Studio
            </button>
            <button
              onClick={() => setActiveTab('excalidraw')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'excalidraw'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Excalidraw
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'templates'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Templates
            </button>
          </div>

          <Select defaultValue="mermaid">
            <SelectTrigger className="w-[120px] h-8 text-xs font-medium">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mermaid">Mermaid.js</SelectItem>
            </SelectContent>
          </Select>

          <TemplateGallery templates={data.templates} onSelect={(c) => setCode(roomId || '', c)} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(`\`\`\`mermaid\n${code}\n\`\`\``);
              toast.success('Mermaid markdown copied to clipboard');
            }}
            className="gap-2 text-xs h-8"
          >
            <Copy className="h-3 w-3" /> Insert into doc
          </Button>
        </div>
      </div>

      {/* Split Editor/Preview */}
      <div className="flex flex-1 min-h-0 h-full overflow-hidden bg-page">
        <div className="w-1/3 min-w-[320px] max-w-2xl border-r border-border bg-surface flex flex-col">
          <MermaidEditor value={code} onChange={(c) => setCode(roomId || '', c)} />
        </div>
        <div className="flex-1 flex flex-col relative bg-page">
          <MermaidPreview
            code={code}
            mode="studio"
            roomId={roomId}
            onCodeChange={(c) => setCode(roomId || '', c)}
          />
        </div>
      </div>

      {/* Save back to doc confirmation dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save back to doc?</DialogTitle>
            <DialogDescription>
              Replace the diagram in {handoff?.docName || 'ARCHITECTURE.md'} with this version?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleDiscardAndReturn}
              disabled={isSavingBack}
            >
              Discard
            </Button>
            <Button
              variant="default"
              onClick={handleReplaceAndReturn}
              disabled={isSavingBack}
            >
              {isSavingBack && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

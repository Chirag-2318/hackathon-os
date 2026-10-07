import { useEffect } from 'react';
import { fetchDiagrams, type DiagramStudioResponse } from '@/api/client';
import { MermaidEditor } from './components/mermaid-editor';
import { MermaidPreview } from './components/mermaid-preview';
import { TemplateGallery } from './components/template-gallery';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Copy, Play } from 'lucide-react';
import { useDraftStore } from '@/app/layout/use-draft-store';
import { useParams } from 'react-router-dom';
import { useState } from 'react';

const DEFAULT_DIAGRAM = 'graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Result 1]\n  B -->|No| D[Result 2]';

export function DiagramPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [data, setData] = useState<DiagramStudioResponse | null>(null);
  
  const code = useDraftStore((s) => s.drafts[roomId || '']?.diagram?.code ?? DEFAULT_DIAGRAM);
  const setCode = useDraftStore((s) => s.setDiagramCode);

  useEffect(() => {
    if (!roomId) return;
    fetchDiagrams(roomId).then(setData);
  }, [roomId]);

  if (!data) {
    return <div className="p-8 text-center text-slate-500">Loading Diagram Studio...</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1C1C1E]">
      {/* Top Header */}
      <div className="h-14 border-b flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold px-2">Diagram Studio</h1>
          <Select defaultValue="mermaid">
            <SelectTrigger className="w-[140px] h-8 text-xs font-medium">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mermaid">Mermaid.js</SelectItem>
            </SelectContent>
          </Select>
          <TemplateGallery templates={data.templates} onSelect={(c) => setCode(roomId || '', c)} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs h-8">
            <Download className="h-3 w-3" /> Export SVG
          </Button>
          <Button variant="default" size="sm" className="gap-2 text-xs h-8">
            <Copy className="h-3 w-3" /> Insert into doc
          </Button>
        </div>
      </div>

      {/* Split Editor/Preview */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 min-w-[320px] max-w-2xl border-r flex flex-col">
          <MermaidEditor value={code} onChange={(c) => setCode(roomId || '', c)} />
        </div>
        <div className="flex-1 flex flex-col relative">
          <MermaidPreview code={code} />
        </div>
      </div>
    </div>
  );
}

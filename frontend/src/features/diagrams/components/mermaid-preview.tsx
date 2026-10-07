import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Maximize, Minimize, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MermaidPreviewProps {
  code: string;
}

export function MermaidPreview({ code }: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        fontFamily: 'var(--font-sans)',
      }
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!containerRef.current) return;
      try {
        const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), code);
        if (isMounted) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e.message || 'Syntax Error in Mermaid diagram');
        }
      }
    };

    renderDiagram();
    return () => { isMounted = false; };
  }, [code]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#1C1C1E] relative">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button variant="outline" size="icon" className="h-8 w-8 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="absolute top-0 left-0 right-0 bg-coral-500/10 text-coral-600 dark:text-coral-400 p-3 text-sm flex items-start gap-2 border-b border-coral-500/20 z-20 font-mono">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1 overflow-x-auto whitespace-pre-wrap">{error}</div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-12 flex items-center justify-center cursor-move"
           style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div ref={containerRef} className="max-w-full max-h-full transition-transform duration-200" />
      </div>
    </div>
  );
}

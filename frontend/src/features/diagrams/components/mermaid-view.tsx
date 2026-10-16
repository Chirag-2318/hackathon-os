import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import {
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Download, Copy, Check,
  AlertCircle, Sparkles, Wand2, ArrowLeft, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiFetch } from '@/design';
import { AiGate, useAiAction } from '@/features/ai-gate';

export interface MermaidViewProps {
  code: string;
  theme?: 'light' | 'dark';
  mode?: 'studio' | 'inline';
  roomId?: string;
  docId?: string;
  docName?: string;
  blockIndex?: number;
  headingSlug?: string;
  onCodeChange?: (newCode: string) => void;
  onErrorChange?: (err: { message: string; line?: number } | null) => void;
  className?: string;
}

// Clean and sanitize Mermaid input before parsing
export function cleanMermaidCode(raw: string): string {
  if (!raw) return '';
  let code = raw.trim();
  // Trim BOM
  code = code.replace(/^\uFEFF/, '');
  // Strip code fences
  code = code.replace(/^```(?:mermaid)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  // Strip leading standalone mermaid keyword
  code = code.replace(/^mermaid\s*\n/i, '');
  // Normalise line endings
  code = code.replace(/\r\n/g, '\n');
  // Replace smart quotes
  code = code.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  // Replace non-breaking spaces
  code = code.replace(/\u00A0/g, ' ');
  // Remove trailing semicolon-only lines
  code = code.replace(/^\s*;\s*$/gm, '');

  // 1. Replace standalone lowercase "end" node id
  code = code.replace(/\b([a-zA-Z0-9_-]+)\s*-->\s*end\b/g, '$1 --> endNode');
  code = code.replace(/\bend\s*-->/g, 'endNode -->');
  code = code.replace(/\bend\[/g, 'endNode[');
  code = code.replace(/\bend\(/g, 'endNode(');

  // 2. Quote node labels that contain parentheses, brackets, slashes, colons, or ampersands
  code = code.replace(/(\[|\(|\{\{)([^"'\n\]\}\)]*[\(\)\/:\&][^"'\n\]\}\)]*)(\]|\)|\}\})/g, (match, open, inner, close) => {
    const trimmed = inner.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return match;
    }
    return `${open}"${trimmed}"${close}`;
  });

  return code.trim();
}

let mermaidInstance: any = null;
async function getMermaid(isDark: boolean) {
  if (!mermaidInstance) {
    const m = (await import('mermaid')).default;
    mermaidInstance = m;
  }
  mermaidInstance.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: isDark ? 'dark' : 'base',
    themeVariables: {
      fontFamily: 'var(--font-sans, Inter, sans-serif)',
      darkMode: isDark,
      background: isDark ? '#121214' : '#ffffff',
      primaryColor: isDark ? '#1e1e24' : '#f4f4f5',
      primaryTextColor: isDark ? '#f4f4f5' : '#09090b',
      primaryBorderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)',
      lineColor: isDark ? '#a1a1aa' : '#52525b',
      secondaryColor: isDark ? '#27272a' : '#e4e4e7',
      tertiaryColor: isDark ? '#18181b' : '#fafafa',
    },
  });
  return mermaidInstance;
}

export function MermaidView({
  code,
  theme,
  mode = 'studio',
  roomId,
  docId,
  docName,
  blockIndex = 0,
  headingSlug,
  onCodeChange,
  onErrorChange,
  className
}: MermaidViewProps) {
  const { resolvedTheme } = useTheme();
  const currentTheme = theme || resolvedTheme || 'dark';
  const isDark = currentTheme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [svgContent, setSvgContent] = useState<string>('');
  const [lastGoodSvg, setLastGoodSvg] = useState<string>('');
  const [error, setError] = useState<{ message: string; line?: number } | null>(null);
  const [isFixingWithAi, setIsFixingWithAi] = useState(false);
  const [suggestedFix, setSuggestedFix] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedError, setCopiedError] = useState(false);

  // Pan and Zoom state for Studio mode
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Debounced live rendering (400ms)
  const debounceTimerRef = useRef<any>(null);

  const renderDiagram = useCallback(async (sourceCode: string) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return; // wait until visible
    }

    const cleaned = cleanMermaidCode(sourceCode);
    if (!cleaned) {
      setSvgContent('');
      setError(null);
      if (onErrorChange) onErrorChange(null);
      return;
    }

    try {
      const mermaid = await getMermaid(isDark);
      await mermaid.parse(cleaned);

      const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
      const { svg } = await mermaid.render(uniqueId, cleaned);

      setSvgContent(svg);
      setLastGoodSvg(svg);
      setError(null);
      if (onErrorChange) onErrorChange(null);
    } catch (err: any) {
      const msg = err?.message || 'Syntax Error in Mermaid diagram';
      let lineNum: number | undefined;
      const lineMatch = msg.match(/(?:line|Line)\s+(\d+)/);
      if (lineMatch) {
        lineNum = parseInt(lineMatch[1], 10);
      }
      const errObj = { message: msg, line: lineNum };
      setError(errObj);
      if (onErrorChange) onErrorChange(errObj);
    }
  }, [isDark, onErrorChange]);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      renderDiagram(code);
    }, 400);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [code, renderDiagram]);

  // Center & Fit when diagram renders or window resizes
  const handleFit = useCallback(() => {
    if (!viewportRef.current || !containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;

    const vpRect = viewportRef.current.getBoundingClientRect();
    const viewBox = svgEl.viewBox?.baseVal;
    const svgW = viewBox?.width || svgEl.getBoundingClientRect().width || 600;
    const svgH = viewBox?.height || svgEl.getBoundingClientRect().height || 400;

    const availW = Math.max(100, vpRect.width - 48);
    const availH = Math.max(100, vpRect.height - 48);

    const scaleX = availW / svgW;
    const scaleY = availH / svgH;
    const fitScale = Math.min(Math.min(scaleX, scaleY), 1.2);

    setZoom(fitScale > 0.1 ? fitScale : 1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (svgContent && mode === 'studio') {
      handleFit();
    }
  }, [svgContent, mode, handleFit]);

  useEffect(() => {
    const handleResize = () => {
      if (mode === 'studio') handleFit();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mode, handleFit]);

  // Keyboard zoom controls (+ / -)
  useEffect(() => {
    if (mode !== 'studio') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(z * 1.2, 5));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(z / 1.2, 0.2));
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'studio') return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || mode !== 'studio') return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mode !== 'studio') return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(z => Math.min(Math.max(z * delta, 0.15), 5));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  // Export handlers
  const handleExportSvg = () => {
    const svgToExport = svgContent || lastGoodSvg;
    if (!svgToExport) return;
    const blob = new Blob([svgToExport], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported SVG');
  };

  const handleExportPng2x = () => {
    const svgToExport = svgContent || lastGoodSvg;
    if (!svgToExport) return;
    const img = new Image();
    const svgBlob = new Blob([svgToExport], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = (img.width || 800) * scale;
      canvas.height = (img.height || 600) * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isDark ? '#121214' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `diagram-${Date.now()}@2x.png`;
        link.click();
        toast.success('Exported PNG (2x)');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const { handleAiError } = useAiAction();

  // AI Fix Repair
  const handleFixWithAi = async () => {
    if (!roomId) {
      toast.error('Room context required for AI fix');
      return;
    }
    setIsFixingWithAi(true);
    try {
      const res = await apiFetch<{ fixedCode: string; diffAvailable: boolean }>(
        `/api/v1/rooms/${roomId}/diagrams/fix`,
        {
          method: 'POST',
          body: JSON.stringify({ code, error: error?.message }),
        }
      );
      if (res.fixedCode) {
        setSuggestedFix(res.fixedCode);
      } else {
        toast.error('AI was unable to repair diagram syntax');
      }
    } catch (err: any) {
      handleAiError(err);
      toast.error(err?.message || 'Failed to repair with AI');
    } finally {
      setIsFixingWithAi(false);
    }
  };

  const handleAcceptFix = () => {
    if (suggestedFix && onCodeChange) {
      onCodeChange(suggestedFix);
      setSuggestedFix(null);
      toast.success('Accepted AI diagram fix');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success('Diagram code copied');
  };

  const handleCopyError = () => {
    if (error?.message) {
      navigator.clipboard.writeText(error.message);
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 2000);
      toast.success('Error copied to clipboard');
    }
  };

  // Render SVG element with strict styling
  const activeSvg = svgContent || lastGoodSvg;
  const isDimmed = !svgContent && !!lastGoodSvg && !!error;

  return (
    <div className={cn('relative flex flex-col w-full h-full min-h-0 min-w-0 overflow-hidden select-none', className)}>
      {/* Error / AI Fix Panel */}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-rose-950/90 text-rose-200 border-b border-rose-800/80 px-4 py-2.5 backdrop-blur-md text-xs font-mono flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 overflow-hidden">
            <AlertCircle className="size-4 text-rose-400 shrink-0" />
            <div className="truncate">
              {error.line && <span className="font-bold text-rose-300 mr-2">[Line {error.line}]</span>}
              <span>{error.message}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyError}
              className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-[11px] text-rose-200 transition-colors cursor-pointer"
            >
              {copiedError ? 'Copied' : 'Copy error'}
            </button>
            <AiGate>
              <button
                type="button"
                onClick={handleFixWithAi}
                disabled={isFixingWithAi}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {isFixingWithAi ? <Loader2 className="size-3 animate-spin" /> : <Wand2 className="size-3" />}
                <span>Fix with AI</span>
              </button>
            </AiGate>
          </div>
        </div>
      )}

      {/* Suggested Fix Diff Dialog / Banner */}
      {suggestedFix && (
        <div className="absolute top-12 left-4 right-4 z-40 p-4 rounded-xl bg-surface border border-border shadow-2xl flex flex-col gap-3 font-sans">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="size-4 text-indigo-500" />
              <span>AI Corrected Mermaid Code</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSuggestedFix(null)}>
                Discard
              </Button>
              <Button size="sm" variant="default" onClick={handleAcceptFix}>
                Accept Fix
              </Button>
            </div>
          </div>
          <pre className="p-3 rounded-lg bg-surface-sunken text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap text-foreground">
            <code>{suggestedFix}</code>
          </pre>
        </div>
      )}

      {/* Pan & Zoom Controls Toolbar (Studio Mode) */}
      {mode === 'studio' && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-surface/90 border border-border shadow-xs backdrop-blur-md">
          <button
            type="button"
            onClick={handleFit}
            className="px-2 py-1 text-xs font-mono font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
            title="Fit to view"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="px-2 py-1 text-xs font-mono font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
            title="100% Zoom"
          >
            100%
          </button>
          <div className="w-px h-3.5 bg-border mx-0.5" />
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(z * 1.2, 5))}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
            title="Zoom in (+)"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(z / 1.2, 0.2))}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
            title="Zoom out (-)"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <div className="w-px h-3.5 bg-border mx-0.5" />
          <button
            type="button"
            onClick={handleExportSvg}
            className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
            title="Export SVG"
          >
            SVG
          </button>
          <button
            type="button"
            onClick={handleExportPng2x}
            className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
            title="Export PNG 2x"
          >
            PNG 2x
          </button>
        </div>
      )}

      {/* Viewport Container */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={cn(
          'flex-1 w-full h-full flex items-center justify-center overflow-hidden p-6',
          mode === 'studio' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
          mode === 'studio' && 'bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:24px_24px]'
        )}
      >
        <div
          ref={containerRef}
          style={mode === 'studio' ? {
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          } : undefined}
          className={cn(
            'flex items-center justify-center max-w-full max-h-full transition-opacity duration-200',
            isDimmed && 'opacity-40',
            mode === 'inline' && 'w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[600px] [&>svg]:mx-auto',
            mode === 'studio' && '[&>svg]:max-w-none [&>svg]:max-h-none'
          )}
          dangerouslySetInnerHTML={{ __html: activeSvg }}
        />
      </div>
    </div>
  );
}

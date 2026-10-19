import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, RefreshCw, Sparkles, Play, Copy, Download,
  ExternalLink, ChevronDown, ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/api/client';
import { AiGate, useAiAction } from '@/features/ai-gate';

interface DocStatus {
  hasDemoScript: boolean;
  demoScriptVersion: number;
  hasQna: boolean;
  qnaVersion: number;
}

interface PitchDocPanelProps {
  roomId: string;
  rehearse: any;
  meta: any;
  onStartRehearsal: (slides: any[], targetSec: number) => void;
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const SPK_COLORS = ['#FF7A1A', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

export function PitchDocPanel({
  roomId,
  rehearse,
  meta,
  onStartRehearsal,
}: PitchDocPanelProps) {
  const [docStatus, setDocStatus] = useState<DocStatus | null>(null);
  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingDoc, setRefreshingDoc] = useState(false);
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  // AI Wizard secondary state
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [pitchType, setPitchType] = useState('live_3min');
  const [speakerCount, setSpeakerCount] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const { handleAiError } = useAiAction();

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, scriptRes] = await Promise.all([
        apiFetch<DocStatus>(`/api/v1/rooms/${roomId}/pitch/doc-status`).catch(() => null),
        apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/script`).catch(() => null),
      ]);
      setDocStatus(statusRes);
      setScript(scriptRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roomId]);

  const handleUseDemoScript = async () => {
    try {
      setRefreshingDoc(true);
      const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/from-doc`, {
        method: 'POST',
      });
      setScript(res.script || res);
      toast.success('Loaded pitch script from DEMO_SCRIPT.md');
      setShowAiWizard(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load demo script');
    } finally {
      setRefreshingDoc(false);
    }
  };

  const handleAiGenerate = async () => {
    try {
      setGenerating(true);
      const s = await apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/generate`, {
        method: 'POST',
        body: JSON.stringify({ type: pitchType, speakerCount, instructions }),
      });
      setScript(s);
      setShowAiWizard(false);
      toast.success('AI pitch script generated');
    } catch (e: any) {
      handleAiError(e);
      const msg = e?.message || '';
      if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('groq')) {
        toast.error("You haven't added your API key yet. Add your Groq API key in Settings.");
      } else {
        toast.error('Could not generate script. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-20 bg-muted/30 rounded-xl animate-pulse" />
        <div className="h-44 bg-muted/20 rounded-xl animate-pulse" />
      </div>
    );
  }

  const slides: any[] = script?.slides ?? [];
  const totalSec: number =
    script?.totalSeconds ??
    slides.reduce((s: number, sl: any) => s + (sl.seconds ?? 30), 0);
  const targetSec: number = rehearse?.targetSeconds ?? 180;
  const runs: any[] = rehearse?.runs ?? [];
  const rehearsalCount = runs.length;

  return (
    <div className="p-4 space-y-5">
      {/* Primary Card: DEMO_SCRIPT.md integration */}
      {docStatus?.hasDemoScript ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground">
                  From DEMO_SCRIPT.md, version {docStatus.demoScriptVersion}
                </span>
                {script?.source === 'DOC' && (
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/50 font-semibold">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Documented in Docs. You can edit the markdown file or refresh beats here.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={handleUseDemoScript}
                disabled={refreshingDoc}
                className="h-8 text-xs px-3 gap-1.5 cursor-pointer font-medium"
              >
                <RefreshCw className={`size-3.5 ${refreshingDoc ? 'animate-spin' : ''}`} />
                <span>{script?.source === 'DOC' ? 'Refresh from doc' : 'Use my demo script'}</span>
              </Button>
              <Link
                to={`/app/room/${roomId}/docs?doc=DEMO_SCRIPT.md`}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 p-1.5 rounded-lg border border-border/40 hover:bg-muted"
                title="Edit in Docs"
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">No DEMO_SCRIPT.md doc found</p>
            <p className="text-muted-foreground">
              Create your official demo script in Plan, step 4 to sync structured beats.
            </p>
          </div>
          <Link
            to={`/app/room/${roomId}/plan?step=4`}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Generate demo script in Plan</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      )}

      {/* Script Timeline & Run of show */}
      {slides.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              {script.hook || 'Pitch Run of Show'}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {fmt(totalSec)} total ({slides.length} beats)
            </span>
          </div>

          <div className="flex rounded-xl overflow-hidden h-7 border border-border/40">
            {slides.map((sl: any, i: number) => {
              const w = ((sl.seconds ?? 30) / Math.max(1, totalSec)) * 100;
              const c = SPK_COLORS[(sl.speakerIndex ?? 0) % 6];
              const cardId = sl.id ? String(sl.id) : `slide-${i}`;
              return (
                <button
                  key={cardId}
                  type="button"
                  onClick={() =>
                    setExpandedCardIds((prev) => ({ ...prev, [cardId]: !prev[cardId] }))
                  }
                  title={`${sl.headline} (${sl.seconds ?? 30}s)`}
                  style={{ width: `${w}%`, background: c, minWidth: 6 }}
                  className="flex items-center justify-center text-[10px] text-white font-mono font-bold px-1 transition-opacity hover:opacity-85"
                >
                  {w > 8 ? i + 1 : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Script Cards Grid */}
      {slides.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          {slides.map((sl: any, i: number) => {
            const cardId = sl.id ? String(sl.id) : `slide-${i}`;
            const isExpanded = Boolean(expandedCardIds[cardId]);
            const c = SPK_COLORS[(sl.speakerIndex ?? 0) % 6];

            return (
              <div
                key={cardId}
                onClick={() =>
                  setExpandedCardIds((prev) => ({ ...prev, [cardId]: !prev[cardId] }))
                }
                className={`p-3.5 rounded-xl border bg-card cursor-pointer transition-all space-y-2 ${
                  isExpanded ? 'border-primary/80 ring-1 ring-primary/40' : 'border-border hover:bg-muted/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold size-5 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-xs text-foreground flex-1 truncate">
                    {sl.headline}
                  </span>
                  <span
                    className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: c + '20', color: c }}
                  >
                    {sl.seconds ?? 30}s
                  </span>
                </div>

                {isExpanded && (
                  <div className="space-y-2 pt-1 text-xs border-t border-border/40">
                    {sl.say && (
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Say
                        </span>
                        <p className="text-foreground leading-relaxed mt-0.5">{sl.say}</p>
                      </div>
                    )}
                    {sl.show && (
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Show
                        </span>
                        <p className="text-muted-foreground leading-relaxed mt-0.5">{sl.show}</p>
                      </div>
                    )}
                    {sl.cue && (
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Cue
                        </span>
                        <p className="text-muted-foreground leading-relaxed mt-0.5">{sl.cue}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Script Actions & Rehearsal sticky bar */}
      {slides.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const text = slides
                  .map((s: any, i: number) => `${i + 1}. ${s.headline}\n${s.say ?? ''}`)
                  .join('\n\n');
                navigator.clipboard.writeText(text);
                toast.success('Script copied to clipboard');
              }}
              className="h-8 text-xs px-2.5 gap-1.5 cursor-pointer"
            >
              <Copy className="size-3" />
              <span>Copy</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const blob = new Blob(
                  [
                    slides
                      .map(
                        (s: any, i: number) =>
                          `# ${i + 1}. ${s.headline}\n\n**Say:** ${s.say ?? ''}\n\n**Show:** ${
                            s.show ?? ''
                          }\n\n**Cue:** ${s.cue ?? ''}`
                      )
                      .join('\n\n'),
                  ],
                  { type: 'text/markdown' }
                );
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'pitch-script.md';
                a.click();
              }}
              className="h-8 text-xs px-2.5 gap-1.5 cursor-pointer"
            >
              <Download className="size-3" />
              <span>.md</span>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">
              Rehearsals: {rehearsalCount}/3
            </span>
            <Button
              size="sm"
              onClick={() => onStartRehearsal(slides, targetSec)}
              className="h-8 text-xs px-3.5 gap-1.5 cursor-pointer font-semibold"
            >
              <Play className="size-3" />
              <span>Start rehearsal</span>
            </Button>
          </div>
        </div>
      )}

      {/* Secondary AI Pitch Wizard (Collapsible) */}
      <div className="pt-2 border-t border-border/40">
        <button
          type="button"
          onClick={() => setShowAiWizard(!showAiWizard)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
        >
          {showAiWizard ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <span>Generate a different pitch with AI</span>
        </button>

        {showAiWizard && (
          <div className="mt-3 p-4 rounded-xl border border-border bg-card space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'live_3min', label: 'Live pitch', dur: '3 min' },
                { id: 'demo_90s', label: 'Demo pitch', dur: '90 sec' },
                { id: 'ppt_first', label: 'Screening deck', dur: '5 min' },
                { id: 'async_video', label: 'Video pitch', dur: '2 min' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPitchType(t.id)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                    pitchType === t.id
                      ? 'border-primary bg-primary/10 font-semibold'
                      : 'border-border/60 hover:bg-muted/30'
                  }`}
                >
                  <p className="font-semibold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground">{t.dur}</p>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Instructions</span>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Key problem, features to emphasize, tone..."
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-muted/20 text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <AiGate>
              <Button
                size="sm"
                onClick={handleAiGenerate}
                disabled={generating}
                className="w-full text-xs h-8 gap-1.5 cursor-pointer font-semibold"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Generating script...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Generate AI pitch script</span>
                  </>
                )}
              </Button>
            </AiGate>
          </div>
        )}
      </div>
    </div>
  );
}

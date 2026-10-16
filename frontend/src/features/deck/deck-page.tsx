import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { fetchPitchDeck } from '@/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExternalLink, X, ChevronLeft, AlertCircle, RefreshCw, Activity, CheckCircle2, Sparkles, CheckSquare, TrendingUp, Code2, Palette, Mic, ShieldCheck } from 'lucide-react';

interface DeckSource {
  provider: 'canva' | 'pptx' | 'gslides';
  url: string;
  title: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  fileUrl?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  canva: 'Canva',
  pptx: 'PowerPoint',
  gslides: 'Google Slides',
};

const RUBRIC = [
  { id: 'innovation', name: 'Innovation', weight: 25 },
  { id: 'feasibility', name: 'Feasibility', weight: 20 },
  { id: 'impact', name: 'Impact', weight: 25 },
  { id: 'technical_depth', name: 'Technical depth', weight: 15 },
  { id: 'ux', name: 'UX', weight: 10 },
  { id: 'presentation', name: 'Presentation', weight: 5 },
];

const RUBRIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  innovation: Sparkles,
  feasibility: CheckSquare,
  impact: TrendingUp,
  technical_depth: Code2,
  ux: Palette,
  presentation: Mic,
};

function StarBurst({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M14 2l2.4 7.5L22 5.6l-3.9 5.9 7.9.5-6.7 4 3.9 7-5.2-4.4L14 26l-2-7.4L6.8 23l3.9-7-6.7-4 7.9-.5L8 6l5.6 3.5z"
        fill="#FF7A1A"
        stroke="#fff"
        strokeWidth="1.5"
        style={{ filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,.18))' }}
      />
    </svg>
  );
}

function ArtTile({ n = 1, className }: { n?: number; className?: string }) {
  return <div className={cn(`stage-art-tile stage-art-tile-${((n - 1) % 4) + 1}`, className)} />;
}

function ChoiceCard({
  title, badge, logoUrl, description, onClick,
}: {
  title: string; badge?: string; logoUrl: string; description: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      id={`deck-choice-${title.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      className="stage-card stage-card-light p-5 text-left flex flex-col gap-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] w-full rounded-2xl group border border-border/50"
      style={{ borderColor: 'transparent', border: '2px solid transparent' }}
    >
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-card border border-border/70 shadow-xs flex items-center justify-center p-2 overflow-hidden transition-transform group-hover:scale-105">
          <img src={logoUrl} alt={title} className="w-full h-full object-contain" />
        </div>
        {badge && (
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: '#FF7A1A', color: '#fff' }}>{badge}</span>
        )}
      </div>
      <div>
        <p className="font-semibold text-[15px]">{title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#737373' }}>{description}</p>
      </div>
    </button>
  );
}

function ProviderPanel({
  provider, roomId, onSave, onBack,
}: {
  provider: 'canva' | 'pptx' | 'gslides'; roomId: string;
  onSave: (src: DeckSource) => void; onBack: () => void;
}) {
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    if (!url.trim()) return;
    setSaving(true); setErr(null);
    try {
      const src = await apiFetch<DeckSource>(`/api/v1/rooms/${roomId}/pitch/deck/source`, {
        method: 'PUT',
        body: JSON.stringify({ provider, url: url.trim(), title: '' }),
      });
      onSave(src);
    } catch (e: any) {
      setErr(e?.message ?? 'Could not save. Check the link and try again.');
    } finally { setSaving(false); }
  };

  return (
    <div className="stage-rise stage-card stage-card-light p-6 space-y-4">
      <button type="button" onClick={onBack}
        className="flex items-center gap-1 text-xs transition-colors mb-2"
        style={{ color: '#737373' }}>
        <ChevronLeft className="w-3 h-3" /> Back
      </button>
      {provider === 'gslides' && (
        <p className="text-xs rounded-xl px-3 py-2" style={{ background: '#FFF1D6', color: '#737373' }}>
          Set sharing to "Anyone with the link can view" so the preview works.
        </p>
      )}
      <div className="flex gap-2">
        <input
          id={`deck-url-input-${provider}`}
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
          placeholder={
            provider === 'canva'  ? 'https://www.canva.com/design/…' :
            provider === 'pptx'   ? 'https://onedrive.live.com/…' :
                                    'https://docs.google.com/presentation/…'
          }
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button
          id={`deck-save-${provider}`}
          type="button" onClick={handleSave} disabled={saving}
          className="stage-pill stage-pill-orange disabled:opacity-50 text-sm">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {provider === 'pptx' && (
        <p className="text-xs rounded-xl px-3 py-2" style={{ background: '#f8f8f8', color: '#737373' }}>
          Or <strong>upload a PDF or PPTX</strong> (max 25 MB).
        </p>
      )}
      {err && (
        <div className="flex items-center gap-2 text-xs rounded-xl px-3 py-2" style={{ background: '#fef2f2', color: '#dc2626' }}>
          <AlertCircle className="w-3 h-3 shrink-0" /> {err}
        </div>
      )}
    </div>
  );
}

function FilmstripTile({ slide, index, selected, onClick }: {
  slide: any; index: number; selected: boolean; onClick: () => void;
}) {
  const colors = ['#FF7A1A','#FF5C8A','#C9B8F4','#BFEBD3','#BFE3FF','#FFB81C'];
  const spkColor = colors[(slide.speakerIndex ?? 0) % 6];
  return (
    <button type="button" onClick={onClick}
      className={cn('stage-card flex-shrink-0 w-40 p-3 text-left cursor-pointer transition-all', 'border-2')}
      style={{
        background: '#1A1A1D',
        borderColor: selected ? '#FF7A1A' : 'transparent',
      }}>
      <ArtTile n={(index % 4) + 1} className="w-full h-16 mb-2 rounded-lg" />
      <div className="flex items-center gap-1.5 mb-1">
        <span className="stage-num" style={{ width: 20, height: 20, fontSize: 10 }}>{index + 1}</span>
        <span className="text-[10px] font-semibold truncate" style={{ color: '#F4F1EA' }}>
          {slide.headline || slide.title || `Slide ${index + 1}`}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
          style={{ background: spkColor }}>
          {(slide.speakerName || 'S').charAt(0)}
        </div>
        <span className="text-[9px]" style={{ color: '#9C9AA3' }}>{slide.seconds ?? 30}s</span>
      </div>
    </button>
  );
}

export function DeckPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [source, setSource] = useState<DeckSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<'canva' | 'pptx' | 'gslides' | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<any>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    Promise.all([
      apiFetch<DeckSource | null>(`/api/v1/rooms/${roomId}/pitch/deck/source`).catch(() => null),
      fetchPitchDeck(roomId).catch(() => null),
    ]).then(([src, dk]) => {
      setSource(src as DeckSource | null);
      setDeck(dk);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [roomId]);

  const handleSave = useCallback((src: DeckSource) => {
    setSource(src);
    setSelectedProvider(null);
    setTitleVal(src.title || '');
  }, []);

  const handleDisconnect = async () => {
    if (!roomId) return;
    await apiFetch(`/api/v1/rooms/${roomId}/pitch/deck/source`, { method: 'DELETE' }).catch(() => {});
    setSource(null);
  };

  const handleTitleSave = async () => {
    if (!roomId || !source) return;
    const updated = await apiFetch<DeckSource>(`/api/v1/rooms/${roomId}/pitch/deck/source`, {
      method: 'PUT',
      body: JSON.stringify({ ...source, title: titleVal }),
    }).catch(() => source);
    setSource(updated);
    setEditingTitle(false);
  };

  const slides: any[] = deck?.slides ?? [];
  const script: any[] = deck?.script ?? [];
  const filmstrip = script.length > 0 ? script : slides;
  const lintIssues: any[] = deck?.lint ?? [];
  const coverage: Record<string, string[]> = deck?.coverage ?? {};
  const rehearsalCount: number = deck?.rehearsalCount ?? 0;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
        <AlertCircle className="w-8 h-8" style={{ color: '#d1d5db' }} />
        <p className="text-sm" style={{ color: '#737373' }}>Could not load deck data.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  /* ── State A ── */
  if (!source) {
    return (
      <div className="stage-theme flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <div className="stage-rise stage-card stage-card-dark p-8 text-center" style={{ '--delay': '0ms' } as React.CSSProperties}>
            <div className="flex justify-center mb-3"><StarBurst size={32} /></div>
            <h1 className="text-2xl font-display font-normal mb-1" style={{ color: '#F4F1EA' }}>Where does your deck live?</h1>
            <p className="text-sm" style={{ color: '#9C9AA3' }}>Pick a source and we'll pull it into your stage.</p>
          </div>
          {!selectedProvider && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'canva' as const, title: 'Canva', badge: 'Recommended', logoUrl: '/images/canvalogo.png', desc: 'Design tool with live preview and Canva connect.' },
                { id: 'pptx'  as const, title: 'PowerPoint', logoUrl: '/images/ppt.webp', desc: 'Paste a OneDrive / SharePoint link or upload a PDF or PPTX.' },
                { id: 'gslides' as const, title: 'Google Slides', logoUrl: '/images/google slide.png', desc: 'Paste a presentation link for an embedded preview.' },
              ].map((c, i) => (
                <div key={c.id} className="stage-rise" style={{ '--delay': `${i * 40}ms` } as React.CSSProperties}>
                  <ChoiceCard title={c.title} badge={'badge' in c ? (c as any).badge : undefined} logoUrl={c.logoUrl} description={c.desc} onClick={() => setSelectedProvider(c.id)} />
                </div>
              ))}
            </div>
          )}
          {selectedProvider && roomId && (
            <ProviderPanel provider={selectedProvider} roomId={roomId} onSave={handleSave} onBack={() => setSelectedProvider(null)} />
          )}
        </div>
      </div>
    );
  }

  /* ── State B ── */
  const openUrl = source.url;
  const embedUrl = source.embedUrl;
  const providerLabel = PROVIDER_LABELS[source.provider] ?? source.provider;

  return (
    <div className="stage-theme flex-1 overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {/* Top bar */}
        <div className="stage-rise flex items-center flex-wrap gap-3" style={{ '--delay': '0ms' } as React.CSSProperties}>
          <span className="text-xs font-mono font-semibold rounded-full px-2 py-0.5 border" style={{ background: '#f5f5f5', color: '#525252' }}>
            {providerLabel}
          </span>
          {editingTitle ? (
            <input
              id="deck-title-input"
              className="flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold"
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
              autoFocus
            />
          ) : (
            <button type="button" id="deck-title-btn" onClick={() => { setTitleVal(source.title || ''); setEditingTitle(true); }}
              className="flex-1 min-w-0 text-left text-sm font-semibold hover:underline truncate">
              {source.title || 'Untitled deck'}
            </button>
          )}
          <a href={openUrl} target="_blank" rel="noopener noreferrer" id="deck-open-btn"
            className="stage-pill stage-pill-orange text-sm py-1.5">
            <ExternalLink className="w-3 h-3" /> Open in {providerLabel}
          </a>
          <button type="button" id="deck-change-src-btn" onClick={() => setSource(null)}
            className="text-xs transition-colors" style={{ color: '#737373' }}>Change source</button>
          <button type="button" id="deck-disconnect-btn" onClick={handleDisconnect}
            className="text-xs flex items-center gap-0.5 transition-colors" style={{ color: '#dc2626' }}>
            <X className="w-3 h-3" /> Disconnect
          </button>
        </div>

        {/* Bento grid */}
        <div className="stage-bento">
          {/* Embed + filmstrip (8/12) */}
          <div className="stage-rise col-span-12 lg:col-span-8 space-y-3" style={{ '--delay': '40ms' } as React.CSSProperties}>
            <div className="stage-card relative overflow-hidden"
              style={{ aspectRatio: '16/9', background: '#0E0E10', borderRadius: 24,
                boxShadow: '0 0 0 1px #2B2B30, 0 8px 40px rgba(255,122,26,0.15)' }}>
              {embedUrl ? (
                <iframe src={embedUrl} title="Deck preview" className="absolute inset-0 w-full h-full border-0" allow="fullscreen" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <ArtTile n={2} className="w-24 h-24" />
                  <p className="text-sm font-medium" style={{ color: '#F4F1EA' }}>Preview not available for this file type.</p>
                  <a href={openUrl} target="_blank" rel="noopener noreferrer" className="stage-pill stage-pill-orange text-xs py-1.5">
                    Open in {providerLabel}
                  </a>
                </div>
              )}
            </div>
            {embedUrl && (
              <p className="text-[11px] text-center" style={{ color: '#9ca3af' }}>
                Preview not loading?{' '}
                <a href={openUrl} target="_blank" rel="noopener noreferrer" className="underline">Open it in {providerLabel}</a>
              </p>
            )}
          </div>

          {/* Sidebar (4/12) */}
          <div className="stage-rise col-span-12 lg:col-span-4 space-y-4" style={{ '--delay': '80ms' } as React.CSSProperties}>
            {/* Redesigned Premium Deck Health Card (Matching Reference Layout) */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4 font-sans">
              {/* Top Control Bar */}
              <div className="flex items-center justify-between bg-muted/40 rounded-xl px-3.5 py-2.5 border border-border/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-sans font-bold uppercase tracking-wider text-foreground">Deck Health</span>
                </div>
                <div>
                  {lintIssues.length === 0 ? (
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      {lintIssues.length} suggestions
                    </span>
                  )}
                </div>
              </div>

              {/* Suggestions / Audits Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggestions & Audits</span>
                  <span className="text-[11px] text-muted-foreground">{lintIssues.length} found</span>
                </div>
                {lintIssues.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {lintIssues.map((issue: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/40 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{issue.message || issue.type}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{issue.rule || 'Actionable slide presentation improvement'}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 font-medium">Review</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>All slides meet rubric requirements.</span>
                  </div>
                )}
              </div>

              {/* Rubric Criteria Coverage Section */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rubric Coverage</span>
                  <span className="text-[11px] text-muted-foreground">Target: 100%</span>
                </div>
                <div className="space-y-2">
                  {RUBRIC.map(c => {
                    const pct = slides.length > 0 ? Math.round(((coverage[c.id]?.length ?? 0) / slides.length) * 100) : 0;
                    const gap = pct < 50;
                    const Icon = RUBRIC_ICONS[c.id] || Sparkles;
                    return (
                      <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/20 border border-border/40">
                        <div className="w-9 h-9 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center shrink-0 text-foreground">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground truncate">{c.name}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{pct}% ({c.weight}% wt)</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1.5">
                            <div
                              className={cn('h-full rounded-full transition-all duration-500', gap ? 'bg-amber-500' : 'bg-primary')}
                              style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                            />
                          </div>
                        </div>
                        <div className="shrink-0 pl-1">
                          {gap ? (
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Needs slide
                            </span>
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Rehearsals Row (Matching Reference Bottom Action Row) */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {rehearsalCount}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">Rehearsals {rehearsalCount}/3</span>
                    <span className="text-[10px] text-muted-foreground">Practice stage delivery</span>
                  </div>
                </div>
                <Link
                  to={`/app/room/${roomId}/pitch-kit?open=pitch&rehearse=1`}
                  id="deck-rehearsal-link"
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  Practice <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

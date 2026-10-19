import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { apiFetch, fetchDemo, fetchRehearse, fetchQa } from '@/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, AlertCircle, RefreshCw, Mic, Play, Square, SkipForward, Check, WifiOff, Database, Camera, Video, Laptop, Radio } from 'lucide-react';
import { PitchDocPanel } from './components/pitch-doc-panel';
import { QnaDocPanel } from './components/qna-doc-panel';

/* ── Helpers ── */
function fmt(s: number) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }

function ArtTile({ n = 1, className }: { n?: number; className?: string }) {
  return <div className={cn(`stage-art-tile stage-art-tile-${((n-1)%4)+1}`, className)} />;
}

function StarBurst({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M14 2l2.4 7.5L22 5.6l-3.9 5.9 7.9.5-6.7 4 3.9 7-5.2-4.4L14 26l-2-7.4L6.8 23l3.9-7-6.7-4 7.9-.5L8 6l5.6 3.5z"
        fill="#FF7A1A" stroke="#fff" strokeWidth="1.5" style={{ filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,.18))' }} />
    </svg>
  );
}

function PaperPlane({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polygon points="22 2 15 22 11 13 2 9 22 2" style={{ filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,.2))' }} />
    </svg>
  );
}

function RingProgress({ pct, size = 48, color = '#FF7A1A' }: { pct: number; size?: number; color?: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="3" stroke="#2B2B30" strokeDasharray={circ} strokeDashoffset={0} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="3" stroke={color}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)' }} />
    </svg>
  );
}

/* ── Panel header ── */
function PanelHeader({
  artN, artColor, title, status, badgeCount, pct, open, onToggle,
}: {
  artN: number; artColor: string; title: string; status: string; badgeCount: number;
  pct: number; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      type="button"
      id={`pitchkit-panel-${title.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-black/5"
      aria-expanded={open}
    >
      <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: artColor, opacity: 0.9 }}>
        <ArtTile n={artN} className="w-full h-full rounded-xl" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs truncate" style={{ color: '#9C9AA3' }}>{status}</p>
      </div>
      {badgeCount > 0 && <span className="stage-badge">{badgeCount}</span>}
      <RingProgress pct={pct} size={32} color={artColor} />
      <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none', color: '#9C9AA3' }} />
    </button>
  );
}

/* ── DEMO PANEL ── */
function DemoPanel({ roomId, demo }: { roomId: string; demo: any }) {
  const beats: any[] = demo?.beats ?? demo?.sections ?? [];
  const shots: any[] = demo?.shots ?? [];
  const insurance: any[] = demo?.insurance ?? [];
  const media = demo?.media ?? {};

  const [vaultLinks, setVaultLinks] = useState({
    full: media.videoUrl ?? '',
    backup: media.fallbackUrl ?? '',
    live: demo?.liveUrl ?? '',
  });
  const [insuranceState, setInsuranceState] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {};
    insurance.forEach((it: any) => { s[it.id ?? it.key] = it.done ?? false; });
    return s;
  });

  const vaultSlots = [
    { key: 'full', label: 'Full screen recording', field: 'videoUrl' },
    { key: 'backup', label: 'Backup recording (~60 s)', field: 'fallbackUrl' },
    { key: 'live', label: 'Live link', field: 'liveUrl' },
  ] as const;

  const insurancePills = [
    { key: 'wifi', icon: WifiOff, label: 'Wi-Fi off mode' },
    { key: 'cached', icon: Database, label: 'Cached data' },
    { key: 'screenshots', icon: Camera, label: 'Screenshots ready' },
    { key: 'backup', icon: Video, label: 'Backup recording' },
    { key: 'spare', icon: Laptop, label: 'Spare laptop' },
    { key: 'hotspot', icon: Radio, label: 'Hotspot' },
  ];

  const totalBeat = beats.reduce((s: number, b: any) => s + (b.seconds ?? b.durationSec ?? 0), 0);
  const maxSec = demo?.videoMaxSeconds ?? 120;

  return (
    <div className="p-4 space-y-5">
      {/* Vault slots */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {vaultSlots.map(slot => {
          const val = vaultLinks[slot.key];
          return (
            <div key={slot.key} className="stage-card stage-card-light p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">{slot.label}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: val ? '#BFEBD3' : '#f3f4f6', color: val ? '#166534' : '#737373' }}>
                  {val ? 'Saved' : 'Missing'}
                </span>
              </div>
              <div className="flex gap-1.5">
                <input
                  id={`vault-${slot.key}`}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
                  placeholder="Paste link…"
                  value={val}
                  onChange={e => setVaultLinks(p => ({ ...p, [slot.key]: e.target.value }))}
                />
                {val && (
                  <a href={val} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    ↗
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Screenshots to capture */}
      {shots.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9C9AA3' }}>
            Screenshots to capture
            <span className="stage-badge ml-2">{shots.filter((s: any) => s.done).length}/{shots.length}</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {shots.map((shot: any, i: number) => (
              <label key={shot.id || i} className="stage-card stage-card-light p-2.5 flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={shot.done} className="rounded" />
                <span className="stage-num" style={{ width: 18, height: 18, fontSize: 9 }}>{i + 1}</span>
                <span className="text-xs truncate">{shot.title || shot.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* If it breaks: insurance pills */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#9C9AA3' }}>If it breaks on stage</h4>
        <div className="flex flex-wrap gap-2">
          {insurancePills.map(p => {
            const on = insuranceState[p.key] ?? false;
            const Icon = p.icon;
            return (
              <button key={p.key} id={`insurance-${p.key}`} type="button"
                onClick={() => setInsuranceState(s => ({ ...s, [p.key]: !s[p.key] }))}
                className={cn(
                  "text-xs py-1.5 px-3 rounded-full transition-all flex items-center gap-1.5 font-medium cursor-pointer shadow-xs",
                  on
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-surface-raised border border-border/80 text-ink hover:bg-surface-sunken"
                )}>
                <Icon className={cn("w-3.5 h-3.5 shrink-0", on ? "text-emerald-600 dark:text-emerald-400" : "text-ink-muted")} />
                <span>{p.label}</span>
                {on && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Demo script bar */}
      {beats.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#9C9AA3' }}>
            Demo script <span className="stage-badge ml-1">{totalBeat}s / {maxSec}s</span>
          </h4>
          <div className="flex rounded-xl overflow-hidden h-8">
            {beats.map((b: any, i: number) => {
              const colors = ['#FF7A1A','#FF5C8A','#C9B8F4','#BFEBD3','#BFE3FF','#FFB81C'];
              const w = ((b.seconds ?? b.durationSec ?? 0) / Math.max(1, totalBeat)) * 100;
              return (
                <div key={i} title={`${b.label || b.title} — ${b.seconds ?? b.durationSec}s`}
                  className="flex items-center justify-center text-[9px] font-bold text-white truncate px-1"
                  style={{ width: `${w}%`, background: colors[i % 6], minWidth: 4 }}>
                  {w > 6 ? (b.label || b.title) : ''}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}



/* ── REHEARSAL STAGE ── */
function RehearsalStage({ roomId, slides, targetSec, onClose }: {
  roomId: string; slides: any[]; targetSec: number; onClose: () => void;
}) {
  const [phase, setPhase] = useState<'preflight' | 'live' | 'result'>('preflight');
  const [elapsed, setElapsed] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideTimes, setSlideTimes] = useState<number[]>([]);
  const [slideStart, setSlideStart] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const startLive = () => {
    setPhase('live'); setElapsed(0); setSlideIdx(0); setSlideTimes([]);
    startRef.current = Date.now();
    setSlideStart(Date.now());
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 500);
  };

  const nextSlide = () => {
    const spent = Math.floor((Date.now() - slideStart) / 1000);
    setSlideTimes(p => [...p, spent]);
    setSlideStart(Date.now());
    setSlideIdx(p => Math.min(p + 1, slides.length - 1));
  };

  const stopLive = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('result');
  };

  const saveRun = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/v1/rooms/${roomId}/pitch/rehearse`, {
        method: 'POST',
        body: JSON.stringify({
          durationSec: elapsed,
          sectionPaces: slides.map((sl: any, i: number) => ({
            label: sl.headline, targetSec: sl.seconds ?? 30, actualSec: slideTimes[i] ?? 0,
          })),
          notes: '',
          stats: { wordsPerMinute: 0, fillerCount: 0, keyPointsHit: 0, keyPointsTotal: 0 },
        }),
      });
    } catch {} finally { setSaving(false); onClose(); }
  };

  const over = elapsed > targetSec;
  const timePct = Math.min(100, (elapsed / Math.max(1, targetSec)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0E0E10' }}>
      {/* Preflight */}
      {phase === 'preflight' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 max-w-md mx-auto text-center">
          <div className="stage-card stage-card-dark p-6 w-full space-y-4">
            <Mic className="w-8 h-8 mx-auto" style={{ color: '#FF7A1A' }} />
            <h2 className="text-lg font-bold" style={{ color: '#F4F1EA' }}>Ready to rehearse?</h2>
            <p className="text-sm" style={{ color: '#9C9AA3' }}>Make sure your mic is working. Hit Start when you're ready.</p>
            <button id="rehearsal-start-btn" type="button" onClick={startLive}
              className="stage-pill stage-pill-orange w-full justify-center">
              <Play className="w-4 h-4" /> Start
            </button>
            <button type="button" onClick={onClose} className="text-xs" style={{ color: '#9C9AA3' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Live */}
      {phase === 'live' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="relative">
            <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={80} cy={80} r={72} fill="none" strokeWidth={6} stroke="#2B2B30" />
              <circle cx={80} cy={80} r={72} fill="none" strokeWidth={6}
                stroke={over ? '#FF5C8A' : elapsed > targetSec * 0.85 ? '#FFB81C' : '#FF7A1A'}
                strokeDasharray={2 * Math.PI * 72}
                strokeDashoffset={2 * Math.PI * 72 * (1 - timePct / 100)}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold tabular-nums" style={{ color: over ? '#FF5C8A' : '#F4F1EA' }}>{fmt(elapsed)}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold mb-1" style={{ color: '#9C9AA3' }}>Slide {slideIdx + 1} of {slides.length}</p>
            <p className="text-lg font-bold" style={{ color: '#F4F1EA' }}>{slides[slideIdx]?.headline}</p>
            <p className="text-sm mt-1" style={{ color: '#F4F1EA' }}>{slides[slideIdx]?.say}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" id="rehearsal-next-btn" onClick={nextSlide} className="stage-pill stage-pill-orange">
              <SkipForward className="w-4 h-4" /> Next
            </button>
            <button type="button" id="rehearsal-stop-btn" onClick={stopLive} className="stage-pill stage-pill-ghost">
              <Square className="w-4 h-4" /> Stop
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {phase === 'result' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-center space-y-2">
              <StarBurst size={40} />
              <h2 className="text-xl font-bold" style={{ color: '#F4F1EA' }}>Rehearsal done!</h2>
              <p className="text-sm" style={{ color: '#9C9AA3' }}>
                {fmt(elapsed)} vs target {fmt(targetSec)} ({elapsed <= targetSec ? '✓ on time' : `+${fmt(elapsed - targetSec)} over`})
              </p>
            </div>
            <div className="stage-card stage-card-dark p-4 space-y-2">
              {slides.map((sl: any, i: number) => {
                const actual = slideTimes[i] ?? 0;
                const target = sl.seconds ?? 30;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] mb-0.5" style={{ color: '#9C9AA3' }}>
                      <span>{sl.headline}</span>
                      <span>{fmt(actual)} / {fmt(target)}</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: '#2B2B30' }}>
                      <div className="h-1 rounded-full" style={{
                        width: `${Math.min(100, (actual / Math.max(1, target)) * 100)}%`,
                        background: actual <= target ? '#BFEBD3' : '#FF5C8A',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button id="save-rehearsal-btn" type="button" onClick={saveRun} disabled={saving}
                className="stage-pill stage-pill-orange flex-1 justify-center disabled:opacity-50">
                {saving ? 'Saving…' : 'Save rehearsal'}
              </button>
              <button id="try-again-btn" type="button" onClick={() => { setPhase('preflight'); setElapsed(0); }}
                className="stage-pill stage-pill-ghost">
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



/* ── MAIN PAGE ── */
export function PitchKitPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();

  const [demo, setDemo] = useState<any>(null);
  const [rehearse, setRehearse] = useState<any>(null);
  const [qa, setQa] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rehearsalOpen, setRehearsalOpen] = useState(false);
  const [rehearsalSlides, setRehearsalSlides] = useState<any[]>([]);
  const [rehearsalTargetSec, setRehearsalTargetSec] = useState<number>(180);

  const openParam = searchParams.get('open') ?? '';
  const [openPanels, setOpenPanels] = useState<Set<string>>(() => {
    const s = new Set<string>();
    openParam.split(',').forEach(p => p && s.add(p));
    return s;
  });

  useEffect(() => {
    if (!roomId) return;
    Promise.all([
      fetchDemo(roomId).catch(() => null),
      fetchRehearse(roomId).catch(() => null),
      fetchQa(roomId).catch(() => null),
      apiFetch<any>('/api/v1/meta').catch(() => null),
    ]).then(([d, r, q, m]) => {
      setDemo(d); setRehearse(r); setQa(q); setMeta(m);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, [roomId]);

  const togglePanel = (id: string) => {
    setOpenPanels(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
        <AlertCircle className="w-8 h-8" style={{ color: '#d1d5db' }} />
        <p className="text-sm" style={{ color: '#737373' }}>Could not load pitch kit data.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  const qQuestions: any[] = qa?.questions ?? qa?.items ?? [];
  const runs: any[] = rehearse?.runs ?? [];
  const rehearsalCount = runs.length;
  const practicedCount = qQuestions.filter((q: any) => q.practiced).length;

  const demoSlots = 3;
  const demoMedia = demo?.media ?? {};
  const demoDone = [demoMedia.videoUrl, demoMedia.fallbackUrl, demo?.liveUrl].filter(Boolean).length;
  const demoPct = Math.round((demoDone / demoSlots) * 100);

  const pitchPct = rehearsalCount >= 3 ? 100 : Math.round((rehearsalCount / 3) * 100);
  const qaPct = qQuestions.length > 0 ? Math.round((practicedCount / qQuestions.length) * 100) : 0;
  const readinessPct = Math.round((demoPct + pitchPct + qaPct) / 3);

  return (
    <div className="stage-theme flex-1 overflow-y-auto">
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="stage-rise flex items-start justify-between flex-wrap gap-4" style={{ '--delay': '0ms' } as React.CSSProperties}>
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-normal tracking-tight text-foreground leading-none">Pitch kit</h1>
            <p className="text-xs text-muted-foreground mt-1">Demo, pitch and Q&amp;A in one place</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <RingProgress pct={readinessPct} size={56} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">{readinessPct}%</span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Readiness</span>
          </div>
        </div>

        {/* Panels */}
        {[
          {
            id: 'demo', title: 'Demo', artN: 1, artColor: '#FF7A1A',
            status: demoDone === 0 ? 'No recording yet' : `${demoDone}/${demoSlots} saved`,
            badge: demoDone, pct: demoPct,
            content: roomId && <DemoPanel roomId={roomId} demo={demo} />,
          },
          {
            id: 'pitch', title: 'Pitch', artN: 2, artColor: '#C9B8F4',
            status: rehearsalCount === 0 ? 'No rehearsals yet' : `${rehearsalCount} of 3 rehearsals`,
            badge: rehearsalCount, pct: pitchPct,
            content: roomId && (
              <PitchDocPanel
                roomId={roomId}
                rehearse={rehearse}
                meta={meta}
                onStartRehearsal={(slides, target) => {
                  setRehearsalSlides(slides);
                  setRehearsalTargetSec(target);
                  setRehearsalOpen(true);
                }}
              />
            ),
          },
          {
            id: 'qa', title: 'Q&A', artN: 3, artColor: '#FF5C8A',
            status: qQuestions.length === 0 ? 'No questions yet' : `${practicedCount} of ${qQuestions.length} practiced`,
            badge: practicedCount, pct: qaPct,
            content: roomId && <QnaDocPanel roomId={roomId} meta={meta} />,
          },
        ].map((panel, idx) => {
          const open = openPanels.has(panel.id);
          const bodyHeight = open ? 'auto' : '0px';
          return (
            <div key={panel.id}
              className="stage-rise stage-card stage-card-dark overflow-hidden"
              style={{ '--delay': `${idx * 40}ms` } as React.CSSProperties}>
              <PanelHeader
                artN={panel.artN} artColor={panel.artColor} title={panel.title}
                status={panel.status} badgeCount={panel.badge} pct={panel.pct}
                open={open} onToggle={() => togglePanel(panel.id)}
              />
              <div
                className="stage-accordion-body"
                data-open={open ? 'true' : 'false'}
                style={{ maxHeight: open ? '9999px' : '0px' }}>
                <div style={{ borderTop: '1px solid #2B2B30' }}>
                  {open && panel.content}
                </div>
              </div>
            </div>
          );
        })}
        {rehearsalOpen && roomId && (
          <RehearsalStage
            roomId={roomId}
            slides={rehearsalSlides}
            targetSec={rehearsalTargetSec}
            onClose={() => setRehearsalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

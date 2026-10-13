import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch, fetchSubmission } from '@/api/client';
import type { SubmissionDraft } from '@/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, ExternalLink, AlertCircle, RefreshCw, Sparkles, Eye, Copy } from 'lucide-react';
import { celebrateAchievement } from '@/design';

/* ── Helpers ── */
function parseISODuration(iso?: string | null): number {
  if (!iso || typeof iso !== 'string') return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (!m) return 0;
  return parseInt(m[1]||'0')*3600 + parseInt(m[2]||'0')*60 + Math.floor(parseFloat(m[3]||'0'));
}
function computeDeadlineSeconds(data: any): number {
  if (!data) return 0;
  if (data.deadlineOffset && typeof data.deadlineOffset === 'string') return parseISODuration(data.deadlineOffset);
  if (data.deadline?.at) { const t = new Date(data.deadline.at).getTime(); const n = data.serverNow ? new Date(data.serverNow).getTime() : Date.now(); return Math.max(0, Math.floor((t-n)/1000)); }
  if (typeof data.deadline?.hoursLeft === 'number') return Math.max(0, data.deadline.hoursLeft * 3600);
  return 7200;
}
function fmtCountdown(s: number): string {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function ArtTile({ n = 1, className }: { n?: number; className?: string }) {
  return <div className={cn(`stage-art-tile stage-art-tile-${((n-1)%4)+1}`, className)} />;
}

/* ── Flight path step indicator ── */
function FlightPath({ step }: { step: 0|1|2|3 }) {
  const steps = ['Draft','Check','Verify'];
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const filled = i < step;
        const current = i === step - 1;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors"
                style={{
                  background: filled ? '#FF7A1A' : 'transparent',
                  borderColor: filled ? '#FF7A1A' : '#2B2B30',
                  color: filled ? '#fff' : '#9C9AA3',
                }}>
                {filled ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-[9px] mt-1 font-semibold" style={{ color: current ? '#FF7A1A' : '#9C9AA3' }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-0.5 mb-4 transition-colors" style={{ background: i < step - 1 ? '#FF7A1A' : '#2B2B30' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Status lozenge ── */
function StatusLozenge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    Draft:    { bg: '#2B2B30', fg: '#9C9AA3' },
    Verified: { bg: '#BFEBD3', fg: '#166534' },
    Submitted:{ bg: '#FFB81C', fg: '#7c2d12' },
  };
  const s = map[status] ?? map['Draft'];
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: s.bg, color: s.fg }}>
      {status}
    </span>
  );
}

/* ── Write-up card ── */
function WriteUpCard({
  label, fieldKey, value, onChange, disabled, aiEnabled, roomId, idx,
}: {
  label: string; fieldKey: string; value: string;
  onChange: (k: string, v: string) => void; disabled: boolean;
  aiEnabled: boolean; roomId: string; idx: number;
}) {
  const maxLen = 800;
  const [polishing, setPolishing] = useState(false);

  const handlePolish = async () => {
    if (!aiEnabled || !value.trim()) return;
    setPolishing(true);
    try {
      const res = await apiFetch<{ polished: string }>(`/api/v1/rooms/${roomId}/submission/polish`, {
        method: 'POST', body: JSON.stringify({ field: fieldKey, text: value }),
      }).catch(() => null);
      if (res?.polished) onChange(fieldKey, res.polished);
    } finally { setPolishing(false); }
  };

  return (
    <div className="stage-rise stage-card stage-card-light p-4 space-y-2" style={{ '--delay': `${idx * 40}ms` } as React.CSSProperties}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#737373' }}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: value.length > maxLen * 0.9 ? '#FF5C8A' : '#9ca3af' }}>
            {value.length}/{maxLen}
          </span>
          <button type="button" id={`copy-${fieldKey}`}
            onClick={() => navigator.clipboard.writeText(value)}
            className="text-[10px] px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-0.5">
            <Copy className="w-2.5 h-2.5" /> Copy
          </button>
          {aiEnabled && (
            <button type="button" id={`polish-${fieldKey}`} onClick={handlePolish} disabled={polishing || disabled}
              className="text-[10px] px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-0.5 disabled:opacity-50">
              <Sparkles className="w-2.5 h-2.5" /> {polishing ? '…' : 'Polish'}
            </button>
          )}
        </div>
      </div>
      <textarea
        id={`writeup-${fieldKey}`}
        className="w-full text-sm border-0 resize-none focus:outline-none bg-transparent"
        rows={3}
        maxLength={maxLen}
        placeholder={`${label}…`}
        value={value}
        disabled={disabled}
        onChange={e => onChange(fieldKey, e.target.value)}
      />
    </div>
  );
}

const DEFAULT_SUBMISSION = {
  status: 'DRAFT',
  draft: {
    whatItDoes: '',
    whyItMatters: '',
    howWeBuiltIt: '',
    challenges: '',
    whatsNext: '',
  },
  items: [
    { id: 'sub-repo', label: 'GitHub Repository linked & healthy', done: true, route: 'github' },
    { id: 'sub-deck', label: 'Pitch deck uploaded', done: false, route: 'deck' },
    { id: 'sub-demo', label: 'Demo video recording ready', done: false, route: 'pitch-kit?open=demo' },
    { id: 'sub-writeup', label: 'All write-up fields completed', done: false },
  ],
  linkCheck: [],
  isLeader: true,
};

/* ── Main page ── */
export function SubmissionPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [judgeView, setJudgeView] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);
  const [blockers, setBlockers] = useState<any[]>([]);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    setErr(null);
    fetchSubmission(roomId)
      .then(d => {
        setData(d || DEFAULT_SUBMISSION);
        setLoading(false);
      })
      .catch((e: any) => {
        console.warn('Backend submission fetch notice:', e);
        // Resilient fallback to default draft so the user can interact with the page
        setData(DEFAULT_SUBMISSION);
        setLoading(false);
      });
  }, [roomId]);

  useEffect(() => { if (data) setRemainingSec(computeDeadlineSeconds(data)); }, [data]);
  useEffect(() => {
    if (remainingSec <= 0 || submitted) return;
    const iv = setInterval(() => setRemainingSec(p => Math.max(0, p-1)), 1000);
    return () => clearInterval(iv);
  }, [remainingSec, submitted]);

  const isLastHour = remainingSec > 0 && remainingSec <= 3600;
  const draft: Record<string, string> = data?.draft ?? {};
  const status: string = useMemo(() => {
    if (submitted) return 'Submitted';
    const s = String(data?.status || 'Draft');
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }, [submitted, data?.status]);
  const step: 0|1|2|3 = submitted ? 3 : status === 'Verified' ? 2 : status === 'Draft' ? 1 : 0;
  const briefUrl: string = data?.briefUrl ?? '';
  const lateEdit: boolean = data?.lateEdit ?? false;
  const isLeader: boolean = data?.isLeader ?? true;

  const checklistItems: any[] = useMemo(() => Array.isArray(data?.items) ? data.items : Array.isArray(data?.checklist) ? data.checklist : [], [data]);
  const links: any[] = data?.linkCheck ?? [];
  const crossPageChips = [
    { label: 'Deck', value: data?.deckUrl, path: 'deck' },
    { label: 'Demo recording', value: data?.demoUrl, path: 'pitch-kit?open=demo' },
    { label: 'Live link', value: data?.liveUrl },
    { label: 'Repo', value: data?.repoUrl },
  ].filter(c => c.value);

  const doneCount = checklistItems.filter((i: any) => i.done).length;
  const totalCount = checklistItems.length;
  const checklistPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const WRITE_UP_FIELDS = [
    { key: 'whatItDoes', label: 'What it does' },
    { key: 'whyItMatters', label: 'Why it matters' },
    { key: 'howWeBuiltIt', label: 'How we built it' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'whatsNext', label: "What's next" },
  ];

  const handleDraftChange = (field: string, value: string) => {
    setData((p: any) => p ? { ...p, draft: { ...(p.draft ?? {}), [field]: value } } : p);
  };

  const handleVerify = async () => {
    setVerifying(true); setBlockers([]);
    try {
      const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/submission/verify`, { method: 'POST' });
      if (res.blockers && res.blockers.length > 0) {
        setBlockers(res.blockers);
      } else {
        setCelebrated(true);
        setTimeout(() => setCelebrated(false), 3000);
      }
    } catch {} finally { setVerifying(false); }
  };

  const handleSubmit = async () => {
    setVerifying(true);
    try {
      await apiFetch(`/api/v1/rooms/${roomId}/submission/submit`, { method: 'POST' });
      setSubmitted(true);
      celebrateAchievement('Hackathon submission completed! Take a bow team.');
    } catch {} finally { setVerifying(false); }
  };

  const ctaLabel = submitted ? 'Submitted!' :
    blockers.length > 0 ? `Fix ${blockers.length} blocker${blockers.length > 1 ? 's' : ''}` :
    status === 'Verified' ? (isLeader ? 'Mark as submitted' : 'Verified') :
    status === 'Draft' ? 'Verify submission' : 'Finish the draft';

  const ctaAction = submitted ? undefined :
    status === 'Verified' && isLeader ? handleSubmit : handleVerify;

  if (loading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" />
    </div>
  );

  if (!data) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
      <AlertCircle className="w-8 h-8 text-amber-500" />
      <p className="text-sm font-medium text-foreground">Could not load submission data.</p>
      {err && <p className="text-xs text-muted-foreground max-w-sm">{err}</p>}
      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
        <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
      </Button>
    </div>
  );

  return (
    <div className="stage-theme flex-1 flex flex-col overflow-hidden">
      {/* Late edit banner */}
      {lateEdit && !submitted && (
        <div className="px-6 py-2 text-sm font-medium" style={{ background: '#FEF1D6', color: '#92400e', borderBottom: '1px solid #fcd34d' }}>
          You're editing after the deadline. The organizers will see these changes.
        </div>
      )}
      {isLastHour && !submitted && (
        <div className="px-6 py-2 text-sm font-medium" style={{ background: '#1f2937', color: '#fbbf24', borderBottom: '1px solid #374151' }}>
          Last hour. Verify and submit now.
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-16">
        <div className="p-6 max-w-7xl mx-auto">

          {/* Hero card */}
          <div className="stage-rise stage-card stage-card-dark p-6 mb-5 space-y-4" style={{ '--delay': '0ms' } as React.CSSProperties}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold" style={{ color: '#F4F1EA' }}>Launch pad</h1>
                  <StatusLozenge status={status} />
                </div>
                {!submitted && (
                  <div className="text-5xl font-extrabold tabular-nums" style={{ color: '#F4F1EA', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtCountdown(remainingSec)}
                  </div>
                )}
              </div>
              <FlightPath step={step} />
            </div>

            {/* Blockers */}
            {blockers.length > 0 && (
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,92,138,0.08)', border: '1px solid #FF5C8A' }}>
                <p className="text-sm font-semibold" style={{ color: '#FF5C8A' }}>Fix these before submitting:</p>
                {blockers.map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs" style={{ color: '#F4F1EA' }}>
                    <span>{b.message ?? b.description}</span>
                    {b.page && (
                      <Link to={`/app/room/${roomId}/${b.page}`} className="underline" style={{ color: '#FF7A1A' }}>Fix →</Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            {celebrated && (
              <div className="text-center py-2">
                <span className="text-2xl">🎉</span>
                <p className="text-sm font-semibold" style={{ color: '#BFEBD3' }}>Verified. Remember to submit on the event platform.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 items-center">
              {!submitted && ctaAction && (
                <button id="submission-cta-btn" type="button" onClick={ctaAction} disabled={verifying}
                  className="stage-pill stage-pill-orange disabled:opacity-50">
                  {verifying ? 'Verifying…' : ctaLabel}
                </button>
              )}
              {submitted && (
                <div className="flex items-center gap-2" style={{ color: '#BFEBD3' }}>
                  <CheckCircle2 className="w-5 h-5" /> <span className="font-semibold">Submitted!</span>
                  <button type="button" onClick={() => navigate(`/app/room/${roomId}/retro`)}
                    className="stage-pill stage-pill-ghost ml-2 text-sm">Start retro</button>
                </div>
              )}
              {briefUrl && (
                <a href={briefUrl} target="_blank" rel="noopener noreferrer" id="open-event-page-btn"
                  className="stage-pill stage-pill-ghost text-sm">
                  <ExternalLink className="w-3 h-3" /> Open event page
                </a>
              )}
            </div>
          </div>

          {/* Bento */}
          <div className="stage-bento">
            {/* Left: write-up (7/12) */}
            <div className="col-span-12 lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold">Your write-up</h2>
                <button id="judge-view-toggle" type="button"
                  onClick={() => setJudgeView(p => !p)}
                  className={cn('stage-pill text-xs py-1', judgeView ? 'stage-pill-orange' : 'stage-pill-ghost')}>
                  <Eye className="w-3 h-3" /> Judge view
                </button>
              </div>

              {judgeView ? (
                <div className="stage-card stage-card-light p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Combined preview</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#FFF1D6', color: '#92400e' }}>
                      A judge reads this in ~{Math.ceil(WRITE_UP_FIELDS.reduce((s, f) => s + (draft[f.key] ?? '').split(' ').length, 0) / 200)}min
                    </span>
                  </div>
                  {WRITE_UP_FIELDS.map(f => (
                    <div key={f.key}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: '#9C9AA3' }}>{f.label}</p>
                      <p className={cn('text-sm', !draft[f.key] && 'italic')} style={{ color: draft[f.key] ? '#17171A' : '#FF5C8A' }}>
                        {draft[f.key] || '⚠ Empty'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                WRITE_UP_FIELDS.map((f, i) => (
                  <WriteUpCard
                    key={f.key}
                    label={f.label} fieldKey={f.key}
                    value={draft[f.key] ?? ''}
                    onChange={handleDraftChange}
                    disabled={submitted}
                    aiEnabled={data?.aiEnabled ?? false}
                    roomId={roomId ?? ''}
                    idx={i}
                  />
                ))
              )}
            </div>

            {/* Right: checklist + links (5/12) */}
            <div className="col-span-12 lg:col-span-5 space-y-4">

              {/* Pre-flight checklist */}
              <div className="stage-rise stage-card stage-card-light p-4 space-y-3" style={{ '--delay': '60ms' } as React.CSSProperties}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Pre-flight checklist</h3>
                  <div className="relative">
                    <svg width={32} height={32} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={16} cy={16} r={12} fill="none" strokeWidth={2.5} stroke="#e5e7eb" />
                      <circle cx={16} cy={16} r={12} fill="none" strokeWidth={2.5} stroke="#FF7A1A"
                        strokeDasharray={2*Math.PI*12}
                        strokeDashoffset={2*Math.PI*12*(1-checklistPct/100)}
                        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 700ms' }} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">{checklistPct}%</span>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {checklistItems.map((item: any) => (
                    <label key={item.id ?? item.key}
                      className={cn('flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors', item.done ? 'bg-green-50' : 'hover:bg-slate-50')}>
                      {item.group === 'verification' || item.auto ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: item.done ? '#16a34a' : '#d1d5db' }} />
                      ) : (
                        <input id={`check-${item.id}`} type="checkbox" defaultChecked={item.done}
                          className="rounded" style={{ accentColor: '#FF7A1A' }} />
                      )}
                      <span className="text-xs flex-1">{item.label ?? item.text}</span>
                      {item.required && <span className="text-[9px] font-bold" style={{ color: '#FF5C8A' }}>Required</span>}
                      {(item.auto || item.group === 'verification') && (
                        <span className="text-[9px]" style={{ color: '#9C9AA3' }}>Auto</span>
                      )}
                    </label>
                  ))}
                  {checklistItems.length === 0 && (
                    <p className="text-xs py-3 text-center" style={{ color: '#9C9AA3' }}>No checklist items yet.</p>
                  )}
                </div>
              </div>

              {/* Links */}
              {links.length > 0 && (
                <div className="stage-rise stage-card stage-card-light p-4 space-y-2" style={{ '--delay': '100ms' } as React.CSSProperties}>
                  <h3 className="text-sm font-semibold">Links</h3>
                  <div className="space-y-2">
                    {links.map((link: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="flex-1 truncate font-medium">{link.label ?? link.name}</span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                          className="truncate max-w-[120px]" style={{ color: '#737373' }}>{link.url}</a>
                        <span className="px-1.5 py-0.5 rounded-full font-bold text-[9px]"
                          style={{
                            background: link.status === 'ok' ? '#BFEBD3' : link.status === 'error' ? '#fecaca' : '#f3f4f6',
                            color: link.status === 'ok' ? '#166534' : link.status === 'error' ? '#dc2626' : '#525252',
                          }}>
                          {link.status === 'ok' ? 'Live' : link.status === 'error' ? 'Not reachable' : 'Unchecked'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button id="check-links-btn" type="button"
                    onClick={() => apiFetch(`/api/v1/rooms/${roomId}/submission/check-links`, { method: 'POST' }).catch(() => {})}
                    className="stage-pill stage-pill-ghost text-xs py-1 mt-1">Check links</button>
                </div>
              )}

              {/* From your other pages */}
              {crossPageChips.length > 0 && (
                <div className="stage-rise stage-card stage-card-light p-4 space-y-2" style={{ '--delay': '140ms' } as React.CSSProperties}>
                  <h3 className="text-sm font-semibold">From your other pages</h3>
                  <div className="flex flex-wrap gap-2">
                    {crossPageChips.map(chip => (
                      <div key={chip.label} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-slate-200">
                        <span className="font-medium">{chip.label}</span>
                        {chip.path ? (
                          <Link to={`/app/room/${roomId}/${chip.path}`} className="underline" style={{ color: '#FF7A1A' }}>↗</Link>
                        ) : chip.value ? (
                          <a href={chip.value} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#FF7A1A' }}>↗</a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

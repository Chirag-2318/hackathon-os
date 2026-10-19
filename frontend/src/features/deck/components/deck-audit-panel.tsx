import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, Sparkles, AlertCircle, CheckCircle2,
  AlertTriangle, Copy, Check, RefreshCw, X, ChevronRight,
  ShieldCheck, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/api/client';

export interface DeckSlideSummary {
  pageNo: number;
  title: string;
  chars: number;
  auditVerdict?: 'GOOD' | 'OK' | 'WEAK' | null;
}

export interface DeckSlidesResponse {
  slides: DeckSlideSummary[];
  deckHash: string;
  isDeckAudited: boolean;
  isStale: boolean;
}

export interface SlideAuditResponse {
  pageNo: number;
  role: string;
  verdict: 'GOOD' | 'OK' | 'WEAK';
  issues: { severity: string; text: string }[];
  fixes: string[];
  rubric: string[];
  missing: string[];
  stale: boolean;
}

export interface RubricCoverageItem {
  criterion: string;
  weight: number;
  level: 'NONE' | 'THIN' | 'GOOD';
  pages: number[];
}

export interface DeckAuditResponse {
  narrative?: string;
  missingSlides?: string[];
  coverage?: RubricCoverageItem[];
  timingNote?: string;
  stale?: boolean;
}

interface DeckAuditPanelProps {
  roomId: string;
}

const ROTATING_STATUS_SLIDE = [
  'Checking clarity...',
  'Evaluating evidence...',
  'Checking rubric fit...',
];

const ROTATING_STATUS_DECK = [
  'Checking narrative flow...',
  'Evaluating rubric alignment...',
  'Identifying gaps...',
];

export function DeckAuditPanel({ roomId }: DeckAuditPanelProps) {
  const [slidesData, setSlidesData] = useState<DeckSlidesResponse | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [slideAudit, setSlideAudit] = useState<SlideAuditResponse | null>(null);
  const [deckAudit, setDeckAudit] = useState<DeckAuditResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [auditingSlide, setAuditingSlide] = useState(false);
  const [auditingDeck, setAuditingDeck] = useState(false);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  // Upload & Paste Text State
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rotating status message timer
  useEffect(() => {
    if (!auditingSlide && !auditingDeck) return;
    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(interval);
  }, [auditingSlide, auditingDeck]);

  const loadSlides = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<DeckSlidesResponse>(`/api/v1/rooms/${roomId}/deck/slides`);
      setSlidesData(res);
      if (res.slides && res.slides.length > 0) {
        setSelectedPage(res.slides[0].pageNo);
      }
    } catch {
      setSlidesData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDeckAudit = async () => {
    try {
      const res = await apiFetch<DeckAuditResponse>(`/api/v1/rooms/${roomId}/deck/audit`);
      setDeckAudit(res);
    } catch {
      setDeckAudit(null);
    }
  };

  useEffect(() => {
    loadSlides();
    loadDeckAudit();
  }, [roomId]);

  // Load audit for selected page if available
  useEffect(() => {
    if (!slidesData?.slides?.length) return;
    setSlideAudit(null);
  }, [selectedPage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File exceeds 15MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await fetch(`/api/v1/rooms/${roomId}/deck/slides`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to upload presentation');
      }

      const data = await res.json();
      setSlidesData(data);
      if (data.slides?.length) setSelectedPage(data.slides[0].pageNo);
      toast.success(`Extracted ${data.slides.length} slides`);
      loadDeckAudit();
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse presentation file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePastedText = async () => {
    if (!pastedText.trim()) return;
    try {
      setUploading(true);
      const res = await apiFetch<DeckSlidesResponse>(`/api/v1/rooms/${roomId}/deck/slides/text`, {
        method: 'POST',
        body: JSON.stringify({ text: pastedText }),
      });
      setSlidesData(res);
      if (res.slides?.length) setSelectedPage(res.slides[0].pageNo);
      setShowPasteModal(false);
      setPastedText('');
      toast.success(`Extracted ${res.slides.length} slides`);
      loadDeckAudit();
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse slide text');
    } finally {
      setUploading(false);
    }
  };

  const handleAuditSlide = async () => {
    try {
      setAuditingSlide(true);
      const res = await apiFetch<SlideAuditResponse>(`/api/v1/rooms/${roomId}/deck/audit`, {
        method: 'POST',
        body: JSON.stringify({ page: selectedPage }),
      });
      setSlideAudit(res);
      toast.success(`Audited Slide ${selectedPage}`);
      loadSlides();
      loadDeckAudit();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('groq')) {
        toast.error("You haven't added your API key yet. Add your Groq API key in Settings.");
      } else {
        toast.error(msg || 'Failed to audit slide');
      }
    } finally {
      setAuditingSlide(false);
    }
  };

  const handleAuditDeck = async () => {
    try {
      setAuditingDeck(true);
      const res = await apiFetch<DeckAuditResponse>(`/api/v1/rooms/${roomId}/deck/audit`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setDeckAudit(res);
      toast.success('Whole deck audit complete');
      loadSlides();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('groq')) {
        toast.error("You haven't added your API key yet. Add your Groq API key in Settings.");
      } else {
        toast.error(msg || 'Failed to audit deck');
      }
    } finally {
      setAuditingDeck(false);
    }
  };

  const [copiedFixIndex, setCopiedFixIndex] = useState<number | null>(null);
  const handleCopyFix = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedFixIndex(index);
    toast.success('Fix copied to clipboard');
    setTimeout(() => setCopiedFixIndex(null), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="h-6 w-36 bg-muted/40 rounded animate-pulse" />
        <div className="h-44 bg-muted/20 rounded-xl animate-pulse" />
      </div>
    );
  }

  // EMPTY STATE: Upload or Paste
  if (!slidesData || !slidesData.slides || slidesData.slides.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Deck audit</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Upload your presentation (.pdf, .pptx up to 15MB) or paste slide text to run AI slide critiques against the rubric.
          </p>
        </div>

        {/* Dropzone */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.pptx"
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer group"
        >
          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">
              {uploading ? 'Extracting slide text...' : 'Click to upload PDF or PowerPoint'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              .pdf, .pptx up to 15MB (max 40 slides)
            </p>
          </div>
        </div>

        <div className="pt-2 text-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPasteModal(true)}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <FileText className="size-3.5" />
            <span>Paste slide text instead</span>
          </Button>
        </div>

        {/* Paste Modal */}
        {showPasteModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h3 className="text-sm font-semibold text-foreground">Paste slide text</h3>
                <Button size="sm" variant="ghost" onClick={() => setShowPasteModal(false)} className="size-7 p-0">
                  <X className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Separate each slide with <code className="font-mono text-foreground font-semibold">---</code> on its own line.
              </p>
              <textarea
                rows={10}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Slide 1: Problem statement&#10;Users struggle with manual deployment...&#10;---&#10;Slide 2: Solution&#10;Autonomous CI/CD agents..."
                className="w-full text-xs font-mono p-3 rounded-xl border border-border bg-muted/20 text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowPasteModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSavePastedText} disabled={uploading || !pastedText.trim()} className="text-xs">
                  {uploading ? 'Processing...' : 'Save & Extract'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // POPULATED STATE: Slide list, selected slide audit, rubric coverage
  const slides = slidesData.slides;
  const currentSlide = slides.find((s) => s.pageNo === selectedPage) || slides[0];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      {/* Top Header & Stale warning */}
      <div className="space-y-3 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground">Deck audit</h2>
            <p className="text-xs text-muted-foreground font-mono">
              {slides.length} slides loaded
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.pptx"
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-7 text-xs px-2.5 cursor-pointer"
            >
              <Upload className="size-3 mr-1" /> Re-upload
            </Button>
          </div>
        </div>

        {slidesData.isStale && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Deck changed, audit again to update rubric scores.</span>
            </div>
            <Button size="sm" variant="ghost" onClick={handleAuditDeck} className="h-6 text-[11px] px-2">
              Audit
            </Button>
          </div>
        )}

        {/* Audit the Whole Deck Button */}
        <Button
          size="sm"
          onClick={handleAuditDeck}
          disabled={auditingDeck || auditingSlide}
          className="w-full text-xs h-8 gap-2 cursor-pointer font-semibold"
        >
          {auditingDeck ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>{ROTATING_STATUS_DECK[rotatingIndex]}</span>
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" />
              <span>Audit the whole deck</span>
            </>
          )}
        </Button>
      </div>

      {/* Slide Navigation List */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          Slides
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {slides.map((s) => {
            const isSelected = s.pageNo === selectedPage;
            const verdict = s.auditVerdict;

            return (
              <button
                key={s.pageNo}
                type="button"
                onClick={() => setSelectedPage(s.pageNo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-foreground text-background font-semibold border-foreground shadow-xs'
                    : 'bg-muted/30 hover:bg-muted text-foreground border-border/60'
                }`}
              >
                <span>{s.pageNo}</span>
                {verdict === 'GOOD' && <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />}
                {verdict === 'OK' && <AlertTriangle className="size-3 text-amber-500 shrink-0" />}
                {verdict === 'WEAK' && <AlertCircle className="size-3 text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Slide Detail & Audit */}
      <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="font-mono text-[10px] text-muted-foreground uppercase font-semibold">
              Slide {currentSlide.pageNo}
            </span>
            <h3 className="text-xs font-semibold text-foreground truncate">
              {currentSlide.title || `Slide ${currentSlide.pageNo}`}
            </h3>
          </div>

          <Button
            size="sm"
            onClick={handleAuditSlide}
            disabled={auditingSlide || auditingDeck}
            className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer shrink-0"
          >
            {auditingSlide ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                <span className="font-mono">{ROTATING_STATUS_SLIDE[rotatingIndex]}</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3" />
                <span>Audit this slide</span>
              </>
            )}
          </Button>
        </div>

        {/* Slide Audit Results */}
        {slideAudit ? (
          <div className="space-y-3 pt-2 border-t border-border/40 text-xs">
            {/* Role & Verdict */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40 font-semibold">
                {slideAudit.role || 'Slide'}
              </span>
              <span
                className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border font-semibold ${
                  slideAudit.verdict === 'GOOD'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : slideAudit.verdict === 'OK'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                {slideAudit.verdict === 'GOOD' ? 'Strong' : slideAudit.verdict === 'OK' ? 'Needs Work' : 'Critical Gap'}
              </span>
            </div>

            {/* Issues */}
            {slideAudit.issues && slideAudit.issues.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Issues</span>
                <div className="space-y-1">
                  {slideAudit.issues.map((iss, i) => (
                    <div key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span
                        className={`size-1.5 rounded-full mt-1.5 shrink-0 ${
                          iss.severity === 'high'
                            ? 'bg-rose-500'
                            : iss.severity === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <span className="leading-relaxed">{iss.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fixes with Copy button */}
            {slideAudit.fixes && slideAudit.fixes.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Fixes</span>
                <div className="space-y-1.5">
                  {slideAudit.fixes.map((fix, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-card border border-border/50 flex items-start justify-between gap-2"
                    >
                      <span className="text-foreground leading-relaxed flex-1">{fix}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyFix(fix, idx)}
                        className="h-6 px-1.5 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                        title="Copy fix to clipboard"
                      >
                        {copiedFixIndex === idx ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic pt-1">
            Click &ldquo;Audit this slide&rdquo; to evaluate clarity, evidence, and rubric alignment with AI.
          </p>
        )}
      </div>

      {/* Rubric Coverage List */}
      <div className="space-y-2.5 pt-3 border-t border-border/40">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-foreground">Rubric coverage</h3>
          <span className="text-[11px] font-mono text-muted-foreground">
            {deckAudit ? 'Audited' : 'Not audited yet'}
          </span>
        </div>

        {!deckAudit?.coverage || deckAudit.coverage.length === 0 ? (
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-xs text-muted-foreground text-center">
            Run &ldquo;Audit the whole deck&rdquo; to calculate rubric coverage across all slides.
          </div>
        ) : (
          <div className="space-y-2">
            {deckAudit.coverage.map((c) => {
              const level = c.level.toUpperCase();
              const levelColor =
                level === 'GOOD'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : level === 'THIN'
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-muted-foreground bg-muted border-border/40';

              const pagesLabel =
                c.pages && c.pages.length > 0 ? `p. ${c.pages.join(', ')}` : 'None';

              return (
                <div
                  key={c.criterion}
                  className="p-2.5 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium text-foreground truncate">{c.criterion}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      Covered on: {pagesLabel}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {c.weight}% wt
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border font-semibold ${levelColor}`}>
                      {level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

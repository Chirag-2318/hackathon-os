import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, CheckCircle2, ChevronDown, ChevronRight,
  Shield, AlertTriangle, ExternalLink, Sparkles, Loader2, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { apiFetch } from '@/api/client';
import { AiGate, useAiAction } from '@/features/ai-gate';

interface QnaQuestion {
  hash: string;
  question: string;
  owner: string;
  answer: string;
  followUp?: string;
  counter?: string;
  proof?: string;
  practiced: boolean;
}

interface QnaCategory {
  name: string;
  questions: QnaQuestion[];
}

interface SimpleListItem {
  title?: string;
  text?: string;
}

interface QnaDocResponse {
  categories: QnaCategory[];
  codeDefense?: (string | SimpleListItem)[];
  codeDefenseDrills?: (string | SimpleListItem)[];
  hardTruths?: (string | SimpleListItem)[];
  questionsForJudges?: (string | SimpleListItem)[];
  questionsToAskJudges?: (string | SimpleListItem)[];
  aiDraftQuestions?: any[];
  practicedCount: number;
  totalCount: number;
}

function renderSimpleListItem(item: string | SimpleListItem) {
  if (!item) return null;
  if (typeof item === 'string') {
    return item;
  }
  const hasTitle = Boolean(item.title && item.title.trim().length > 0);
  const hasText = Boolean(item.text && item.text.trim().length > 0);

  if (hasTitle && hasText) {
    return (
      <span>
        <strong className="font-semibold text-foreground mr-1.5">{item.title}:</strong>
        <span>{item.text}</span>
      </span>
    );
  }
  if (hasTitle) {
    return <strong className="font-semibold text-foreground">{item.title}</strong>;
  }
  return <span>{item.text || ''}</span>;
}

interface QnaDocPanelProps {
  roomId: string;
  meta: any;
}

export function QnaDocPanel({ roomId, meta }: QnaDocPanelProps) {
  const [data, setData] = useState<QnaDocResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [drillMode, setDrillMode] = useState(false);
  const [revealedHashes, setRevealedHashes] = useState<Set<string>>(new Set());
  const [expandedHashes, setExpandedHashes] = useState<Set<string>>(new Set());

  // AI draft questions secondary state
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [generatingAi, setGeneratingAi] = useState(false);
  const { handleAiError } = useAiAction();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<QnaDocResponse>(`/api/v1/rooms/${roomId}/pitch/qna-doc`);
      setData(res);
      if (res?.aiDraftQuestions && res.aiDraftQuestions.length > 0) {
        setAiQuestions(res.aiDraftQuestions);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roomId]);

  const handleTogglePractice = async (hash: string, current: boolean) => {
    const next = !current;
    try {
      await apiFetch(`/api/v1/rooms/${roomId}/pitch/qna-practice`, {
        method: 'POST',
        body: JSON.stringify({ hash, practiced: next }),
      });

      setData((prev) => {
        if (!prev) return null;
        let delta = 0;
        const updatedCats = prev.categories.map((c) => ({
          ...c,
          questions: c.questions.map((q) => {
            if (q.hash === hash) {
              if (next && !q.practiced) delta = 1;
              if (!next && q.practiced) delta = -1;
              return { ...q, practiced: next };
            }
            return q;
          }),
        }));
        return {
          ...prev,
          practicedCount: prev.practicedCount + delta,
          categories: updatedCats,
        };
      });
    } catch {
      toast.error('Failed to update practice state');
    }
  };

  const handleReveal = (hash: string) => {
    setRevealedHashes((prev) => new Set([...prev, hash]));
  };

  const handleToggleExpand = (hash: string) => {
    setExpandedHashes((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return next;
    });
  };

  const handleGenerateAi = async () => {
    try {
      setGeneratingAi(true);
      const res = await apiFetch<any[]>(`/api/v1/rooms/${roomId}/pitch/qa/generate`, {
        method: 'POST',
        body: JSON.stringify({ level: 'mixed', count: 6 }),
      });
      setAiQuestions(Array.isArray(res) ? res : []);
      toast.success('Generated AI draft questions');
    } catch (e: any) {
      handleAiError(e);
      toast.error('Failed to generate AI questions');
    } finally {
      setGeneratingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-10 bg-muted/30 rounded-xl animate-pulse" />
        <div className="h-44 bg-muted/20 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Missing QNA.md
  if (!data || data.categories.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="p-5 rounded-xl border border-dashed border-border/80 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-sm">No QNA.md doc found</h3>
            <p className="text-muted-foreground leading-relaxed">
              Generate structured questions, proof points, and code defense drills in Plan to prepare for judge interrogations.
            </p>
          </div>
          <Link
            to={`/app/room/${roomId}/plan?step=4`}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Open Plan step 4</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>
    );
  }

  const codeDefenseList = data ? (data.codeDefenseDrills || data.codeDefense || []) : [];
  const hardTruthsList = data ? (data.hardTruths || []) : [];
  const questionsForJudgesList = data ? (data.questionsToAskJudges || data.questionsForJudges || []) : [];

  return (
    <div className="p-4 space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Judge Q&A Defense</h3>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full border border-border/60 bg-muted text-muted-foreground font-semibold">
              {data.practicedCount} OF {data.totalCount} PRACTISED
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Synchronized from QNA.md. Drill answers with team members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={drillMode}
              onChange={(e) => {
                setDrillMode(e.target.checked);
                setRevealedHashes(new Set());
              }}
              className="size-3.5 rounded border-border accent-primary cursor-pointer"
            />
            <span>Drill mode (hide answers)</span>
          </label>
          <Link
            to={`/app/room/${roomId}/docs?doc=QNA.md`}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 p-1 rounded-md border border-border/40 hover:bg-muted"
            title="Edit QNA.md in Docs"
          >
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Grouped Categories Hairline List */}
      <div className="space-y-6">
        {data.categories.map((cat) => (
          <div key={cat.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {cat.name}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {cat.questions.length} questions
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card divide-y divide-border/30">
              {cat.questions.map((q) => {
                const isRevealed = !drillMode || revealedHashes.has(q.hash);
                const isExpanded = expandedHashes.has(q.hash);

                return (
                  <div key={q.hash} className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Practised Checkbox */}
                        <input
                          type="checkbox"
                          checked={q.practiced}
                          onChange={() => handleTogglePractice(q.hash, q.practiced)}
                          className="size-4 mt-0.5 rounded border-border accent-primary cursor-pointer shrink-0"
                          title="Mark as practised"
                        />

                        <div className="space-y-1 min-w-0">
                          <p className="font-semibold text-foreground text-xs leading-relaxed">
                            {q.question}
                          </p>

                          {/* Owner UserAvatar */}
                          {q.owner && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <div className="size-4 rounded-full overflow-hidden shrink-0 border border-border/40">
                                <UserAvatar user={{ name: q.owner }} size={16} />
                              </div>
                              <span>Lead: {q.owner}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleExpand(q.hash)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                        title="Expand answer details"
                      >
                        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </button>
                    </div>

                    {/* Answer Section */}
                    <div className="pl-6.5 pt-1">
                      {!isRevealed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReveal(q.hash)}
                          className="h-6 text-[11px] px-2.5 gap-1 cursor-pointer"
                        >
                          <Eye className="size-3" />
                          <span>Reveal answer</span>
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 text-foreground leading-relaxed">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">
                              Recommended response
                            </span>
                            {q.answer}
                          </div>

                          {/* Expanded Details: Follow-up, Counter, Proof point */}
                          {isExpanded && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                              {q.followUp && (
                                <div className="p-2 rounded-lg bg-muted/10 border border-border/30">
                                  <span className="font-mono text-[9px] uppercase text-muted-foreground font-semibold block mb-0.5">
                                    Likely follow-up
                                  </span>
                                  <span className="text-muted-foreground">{q.followUp}</span>
                                </div>
                              )}
                              {q.counter && (
                                <div className="p-2 rounded-lg bg-muted/10 border border-border/30">
                                  <span className="font-mono text-[9px] uppercase text-muted-foreground font-semibold block mb-0.5">
                                    Counter-argument
                                  </span>
                                  <span className="text-muted-foreground">{q.counter}</span>
                                </div>
                              )}
                              {q.proof && (
                                <div className="p-2 rounded-lg bg-muted/10 border border-border/30">
                                  <span className="font-mono text-[9px] uppercase text-muted-foreground font-semibold block mb-0.5">
                                    Proof point
                                  </span>
                                  <span className="text-muted-foreground">{q.proof}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Code Defense Drills */}
      {codeDefenseList.length > 0 && (
        <div className="space-y-2.5 pt-3 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 text-blue-500" />
            <h4 className="text-xs font-semibold text-foreground">Code defense drills</h4>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
            {codeDefenseList.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="font-mono text-[10px] text-foreground font-semibold mt-0.5 shrink-0">
                  {i + 1}.
                </span>
                <span className="leading-relaxed">{renderSimpleListItem(d)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hard Truths */}
      {hardTruthsList.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-3.5 text-amber-500" />
            <h4 className="text-xs font-semibold text-foreground">Hard truths to acknowledge</h4>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
            {hardTruthsList.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{renderSimpleListItem(t)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions for Judges */}
      {questionsForJudgesList.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-3.5 text-emerald-500" />
            <h4 className="text-xs font-semibold text-foreground">Questions to ask the judges</h4>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
            {questionsForJudgesList.map((q, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{renderSimpleListItem(q)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secondary AI Questions Section */}
      <div className="pt-3 border-t border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            Need more questions?
          </span>
          <AiGate>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateAi}
              disabled={generatingAi}
              className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer"
            >
              {generatingAi ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
              <span>More questions with AI</span>
            </Button>
          </AiGate>
        </div>

        {aiQuestions.length > 0 && (
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground">
              AI draft questions
            </span>
            <div className="rounded-xl border border-border bg-card divide-y divide-border/30">
              {aiQuestions.map((q, idx) => (
                <div key={idx} className="p-3 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                      AI DRAFT
                    </span>
                    <span className="font-semibold text-foreground">
                      {typeof q === 'string' ? q : (q.question || q.text || q.title || '')}
                    </span>
                  </div>
                  {q.answer && (
                    <p className="text-muted-foreground pl-2">
                      {typeof q.answer === 'string' ? q.answer : (q.answer.text || q.answer.title || '')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

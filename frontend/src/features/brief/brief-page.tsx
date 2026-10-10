import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { briefService, roomService, getCurrentRole, DEFAULT_BRIEF_FIELDS } from '@/services';
import type { Brief, BriefFields, BriefSource, RubricCriterion } from '@/services/types';
import { TagChip, TimeChip, Checkbox, InlineHighlight } from '@/features/home/components/HomeDesignSystem';
import { Button } from '@/components/ui/button';
import {
  FileText, Link2, Upload, PenTool, Check, AlertCircle, Copy,
  ExternalLink, Sparkles, Loader2, ArrowRight, RefreshCw, X, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SourceTextPanel } from './components/source-text-panel';

const RULE_KEYS = [
  'problemStatement',
  'targetAudience',
  'rubric',
  'deadlines',
  'eligibility',
  'techRules',
  'aiPolicy',
  'deliverables',
  'judgingFormat',
] as const;

const EXTRACTION_PROMPT_TEMPLATE = `You are reading a hackathon announcement. From the text below, extract the details and reply ONLY with valid JSON with these keys: problemStatement (string), targetAudience (string), rubric (array of {criterion, weight} with weights summing to 100), deadlines ({start, freeze, submission} ISO strings or null), eligibility (string), techRules (string), aiPolicy (string), deliverables (array of strings), tracksAndPrizes (array of strings), judgingFormat (string). Use null when the text does not say. Text: <paste here>`;

export function BriefPage() {
  const { roomId, id } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id || 'r-1';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isLeader = getCurrentRole() === 'leader';

  const { data: brief, isLoading: isLoadingBrief } = useQuery({
    queryKey: ['brief', activeRoomId],
    queryFn: () => briefService.getBrief(activeRoomId),
  });

  const { data: room } = useQuery({
    queryKey: ['room', activeRoomId],
    queryFn: () => roomService.getRoom(activeRoomId),
  });

  // Intake states
  const [intakeTab, setIntakeTab] = useState<'link' | 'pdf' | 'write'>('link');
  const [linkUrl, setLinkUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStep, setParseStep] = useState(0); // 1: Fetching page, 2: Reading rules, 3: Structuring
  const [usePromptBridge, setUsePromptBridge] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [jsonValidationErrors, setJsonValidationErrors] = useState<string[]>([]);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfError, setPdfError] = useState('');

  // Editing / Confirm states
  const [activeSnippetId, setActiveSnippetId] = useState<string>('');
  const [confirmedChecks, setConfirmedChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (brief) {
      setConfirmedChecks(brief.confirmedFields || {});
    }
  }, [brief]);

  // Mutations
  const saveBriefMutation = useMutation({
    mutationFn: (newBrief: Brief) => briefService.saveBrief(newBrief),
    onSuccess: (saved) => {
      queryClient.setQueryData(['brief', activeRoomId], saved);
      queryClient.invalidateQueries({ queryKey: ['brief', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      toast.success('Brief details saved.');
    },
  });

  const confirmBriefMutation = useMutation({
    mutationFn: () => briefService.confirmBrief(activeRoomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brief', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast('Brief confirmed!', {
        action: {
          label: 'Start ideating',
          onClick: () => navigate(`/app/room/${activeRoomId}/ideate`),
        },
      });
    },
  });

  // Parse handlers
  const handleLinkFetch = async () => {
    if (!linkUrl.trim()) return;
    setIsParsing(true);
    setParseStep(1);

    setTimeout(() => setParseStep(2), 800);
    setTimeout(() => setParseStep(3), 1600);

    try {
      const fields = await briefService.parseBriefFromUrl(linkUrl.trim());
      const newBrief: Brief = {
        roomId: activeRoomId,
        source: 'link',
        sourceUrl: linkUrl.trim(),
        rawText: `Hackathon announcement imported from ${linkUrl.trim()}.\n\nRules & Guidelines:\n1. All commits must be made during the sprint window.\n2. Open innovation track welcomed.\n3. Mentors will conduct checkpoint reviews.\n4. Submission requires demo video and GitHub repository.`,
        fields,
        confirmed: false,
        confirmedFields: {},
        risks: ['Strict 36h timeline', 'Judging includes live Q&A'],
      };
      saveBriefMutation.mutate(newBrief);
    } finally {
      setIsParsing(false);
      setParseStep(0);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Only PDF files are supported. Please upload a .pdf hackathon guide.');
      return;
    }
    setPdfError('');
    setPdfFileName(file.name);
    setIsParsing(true);
    setParseStep(1);

    setTimeout(() => setParseStep(2), 800);
    setTimeout(() => setParseStep(3), 1600);

    try {
      const fields = await briefService.parseBriefFromPdf(file.name);
      const newBrief: Brief = {
        roomId: activeRoomId,
        source: 'pdf',
        fileName: file.name,
        rawText: `PDF Document: ${file.name}\n\nOfficial Rules, Rubrics, and Guidelines extracted from event guide.\nProblem Statement: Addressing critical bottlenecks in real-time collaboration.`,
        fields,
        confirmed: false,
        confirmedFields: {},
        risks: ['Strict evaluation of MVP deployment'],
      };
      saveBriefMutation.mutate(newBrief);
    } finally {
      setIsParsing(false);
      setParseStep(0);
    }
  };

  const handleManualWrite = () => {
    const newBrief: Brief = {
      roomId: activeRoomId,
      source: 'manual',
      rawText: 'Manual brief entry by team leader.',
      fields: { ...DEFAULT_BRIEF_FIELDS },
      confirmed: false,
      confirmedFields: {},
      risks: [],
    };
    saveBriefMutation.mutate(newBrief);
  };

  const handleValidateJsonReply = () => {
    const res = briefService.validateBriefJson(pastedJson);
    if (!res.valid || !res.fields) {
      setJsonValidationErrors(res.errors);
      return;
    }
    setJsonValidationErrors([]);
    const newBrief: Brief = {
      roomId: activeRoomId,
      source: 'link',
      rawText: pastedJson,
      fields: res.fields,
      confirmed: false,
      confirmedFields: {},
      risks: [],
    };
    saveBriefMutation.mutate(newBrief);
    setUsePromptBridge(false);
  };

  const handleToggleCheck = (key: string) => {
    if (!isLeader) {
      toast.error('Only the leader can do this');
      return;
    }
    const updated = { ...confirmedChecks, [key]: !confirmedChecks[key] };
    setConfirmedChecks(updated);
    if (brief) {
      saveBriefMutation.mutate({ ...brief, confirmedFields: updated });
    }
  };

  // Rubric weight change
  const handleRubricWeightChange = (idx: number, newWeight: number) => {
    if (!brief) return;
    const updatedRubric = [...brief.fields.rubric];
    updatedRubric[idx] = { ...updatedRubric[idx], weight: newWeight };
    const updatedFields = { ...brief.fields, rubric: updatedRubric };
    saveBriefMutation.mutate({ ...brief, fields: updatedFields });
  };

  const rubricSum = brief?.fields.rubric?.reduce((acc, r) => acc + (Number(r.weight) || 0), 0) ?? 0;
  const allRulesConfirmed = RULE_KEYS.every(k => confirmedChecks[k]);
  const confirmedCount = RULE_KEYS.filter(k => confirmedChecks[k]).length;

  return (
    <div className="w-full flex flex-col gap-6 p-8 max-w-[1320px] mx-auto font-sans pb-20">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Hackathon Brief</h1>
            {brief?.confirmed ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                CONFIRMED
              </span>
            ) : brief ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold">
                NEEDS CONFIRMATION
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
                NOT ADDED
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Every rule, rubric weight, and deadline in one verified source of truth.
          </p>
        </div>

        {brief && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!isLeader) {
                toast.error('Only the leader can do this');
                return;
              }
              // Clear current brief to show intake again
              saveBriefMutation.mutate({
                ...brief,
                rawText: '',
              } as any);
            }}
            disabled={!isLeader}
            className="text-xs font-semibold gap-1.5"
          >
            <RefreshCw className="size-3.5" /> Replace brief
          </Button>
        )}
      </div>

      {/* ── INTAKE SECTION (Shown when no brief or replacing) ── */}
      {(!brief || !brief.fields?.problemStatement) && (
        <div className="rounded-[24px] bg-card border border-border shadow-xs overflow-hidden max-w-2xl mx-auto w-full">
          {/* Intake Tabs */}
          <div className="flex border-b border-border/70 p-2 bg-muted/20">
            <button
              onClick={() => { setIntakeTab('link'); setUsePromptBridge(false); }}
              className={cn(
                'flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
                intakeTab === 'link' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Link2 className="size-3.5" /> Link
            </button>
            <button
              onClick={() => { setIntakeTab('pdf'); setUsePromptBridge(false); }}
              className={cn(
                'flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
                intakeTab === 'pdf' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Upload className="size-3.5" /> Upload PDF
            </button>
            <button
              onClick={() => { setIntakeTab('write'); setUsePromptBridge(false); }}
              className={cn(
                'flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
                intakeTab === 'write' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <PenTool className="size-3.5" /> Write it
            </button>
          </div>

          <div className="p-6">
            {/* LINK TAB */}
            {intakeTab === 'link' && !usePromptBridge && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Hackathon announcement URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://devpost.com/software/example or https://sih.gov.in"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      disabled={isParsing || !isLeader}
                      className="flex-1 h-10 px-3.5 rounded-[14px] bg-[#F3F3F3] dark:bg-muted/70 text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={handleLinkFetch}
                      disabled={isParsing || !linkUrl.trim() || !isLeader}
                      className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 h-10 px-5 rounded-[14px] text-xs font-semibold"
                    >
                      {isParsing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                      Fetch
                    </Button>
                  </div>
                </div>

                {isParsing && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 flex items-center gap-3">
                    <Loader2 className="size-4 animate-spin shrink-0" />
                    <span>
                      {parseStep === 1 && '1/3 Fetching event page...'}
                      {parseStep === 2 && '2/3 Reading rules & eligibility...'}
                      {parseStep === 3 && '3/3 Structuring rubric and deadlines...'}
                    </span>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 border-t border-border/50 flex items-center justify-between">
                  <span>Auto-parse is a Pro feature. Free: use the AI chat option.</span>
                  <button
                    type="button"
                    onClick={() => setUsePromptBridge(true)}
                    className="font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Use an AI chat instead &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* PROMPT BRIDGE SUB-FLOW */}
            {intakeTab === 'link' && usePromptBridge && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Prompt Bridge: Extract Brief
                  </h3>
                  <button
                    type="button"
                    onClick={() => setUsePromptBridge(false)}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Back to link input
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">1. Copy extraction prompt</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(EXTRACTION_PROMPT_TEMPLATE);
                        setCopiedPrompt(true);
                        setTimeout(() => setCopiedPrompt(false), 2000);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPrompt ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      {copiedPrompt ? 'Copied' : 'Copy prompt'}
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-muted/60 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap max-h-28 overflow-y-auto border border-border/50">
                    {EXTRACTION_PROMPT_TEMPLATE}
                  </pre>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    2. Paste JSON response from ChatGPT or Claude
                  </span>
                  <textarea
                    rows={4}
                    placeholder='{"problemStatement": "...", "targetAudience": "...", "rubric": [{"criterion": "Tech", "weight": 40}, ...]}'
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                    className="w-full p-3 rounded-[14px] bg-[#F3F3F3] dark:bg-muted/70 text-xs font-mono text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {jsonValidationErrors.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 space-y-1">
                    {jsonValidationErrors.map((err, i) => (
                      <div key={i}>&bull; {err}</div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                  <Button
                    onClick={handleValidateJsonReply}
                    disabled={!pastedJson.trim() || !isLeader}
                    className="bg-neutral-900 text-white text-xs font-semibold px-4 h-9"
                  >
                    Validate & Fill Fields
                  </Button>
                </div>
              </div>
            )}

            {/* PDF TAB */}
            {intakeTab === 'pdf' && (
              <div className="flex flex-col gap-4">
                <label className="relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-border hover:border-neutral-400 dark:hover:border-neutral-600 bg-muted/20 cursor-pointer transition-colors text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    disabled={isParsing || !isLeader}
                    className="hidden"
                  />
                  <div className="size-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
                    <Upload className="size-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Drop the PDF or click to upload</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">Maximum file size: 10MB</span>
                </label>

                {pdfError && (
                  <p className="text-xs text-red-500 font-medium">{pdfError}</p>
                )}

                {isParsing && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 flex items-center gap-3">
                    <Loader2 className="size-4 animate-spin shrink-0" />
                    <span>Parsing {pdfFileName}... Extracting rules and rubric.</span>
                  </div>
                )}
              </div>
            )}

            {/* WRITE IT TAB */}
            {intakeTab === 'write' && (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                <p className="text-xs text-muted-foreground max-w-sm">
                  Initialize the structured brief form with standard fields so you can edit and fill details manually.
                </p>
                <Button
                  onClick={handleManualWrite}
                  disabled={!isLeader}
                  className="bg-neutral-900 text-white text-xs font-semibold h-9 px-5"
                >
                  Open Structured Form &rarr;
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REVIEW AND CONFIRM (2 columns 7/5) ── */}
      {brief && brief.fields?.problemStatement && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Structured field rows */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60">
                <h3 className="text-sm font-semibold text-foreground">Extracted Rules & Fields</h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {confirmedCount} of 9 confirmed
                </span>
              </div>

              <div className="divide-y divide-border/50">
                {/* 1. Problem Statement */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Problem Statement
                    </span>
                    <p className="text-xs text-foreground mt-1 leading-relaxed">
                      {brief.fields.problemStatement}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <Checkbox
                      checked={!!confirmedChecks.problemStatement}
                      onChange={() => handleToggleCheck('problemStatement')}
                    />
                  </div>
                </div>

                {/* 2. Target Audience */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Target Audience
                    </span>
                    <p className="text-xs text-foreground mt-1">
                      {brief.fields.targetAudience}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <Checkbox
                      checked={!!confirmedChecks.targetAudience}
                      onChange={() => handleToggleCheck('targetAudience')}
                    />
                  </div>
                </div>

                {/* 3. Rubric & Weights */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Judging Rubric
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold font-mono',
                          rubricSum === 100
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-red-500/10 text-red-600'
                        )}
                      >
                        Total {rubricSum}%
                      </span>
                    </div>
                    <Checkbox
                      checked={!!confirmedChecks.rubric}
                      onChange={() => handleToggleCheck('rubric')}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {brief.fields.rubric.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-foreground flex-1 truncate">{r.criterion}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={r.weight}
                            onChange={(e) => handleRubricWeightChange(idx, Number(e.target.value))}
                            disabled={!isLeader}
                            className="w-14 h-7 text-center rounded-lg bg-muted border border-border text-xs font-mono"
                          />
                          <span className="text-muted-foreground text-xs">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Deadlines */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      Key Deadlines
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="px-2.5 py-1 rounded-xl bg-muted text-foreground">
                        <strong>Start:</strong> {brief.fields.deadlines.start ? new Date(brief.fields.deadlines.start).toLocaleDateString() : 'Now'}
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-muted text-foreground">
                        <strong>Submission:</strong> {brief.fields.deadlines.submission ? new Date(brief.fields.deadlines.submission).toLocaleDateString() : 'In 36h'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <Checkbox
                      checked={!!confirmedChecks.deadlines}
                      onChange={() => handleToggleCheck('deadlines')}
                    />
                  </div>
                </div>

                {/* 5. Eligibility */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Eligibility
                    </span>
                    <p className="text-xs text-foreground mt-1">{brief.fields.eligibility}</p>
                  </div>
                  <Checkbox
                    checked={!!confirmedChecks.eligibility}
                    onChange={() => handleToggleCheck('eligibility')}
                  />
                </div>

                {/* 6. Tech Rules */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Tech Rules
                    </span>
                    <p className="text-xs text-foreground mt-1">{brief.fields.techRules}</p>
                  </div>
                  <Checkbox
                    checked={!!confirmedChecks.techRules}
                    onChange={() => handleToggleCheck('techRules')}
                  />
                </div>

                {/* 7. AI Policy */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      AI Policy
                    </span>
                    <p className="text-xs text-foreground mt-1">{brief.fields.aiPolicy}</p>
                  </div>
                  <Checkbox
                    checked={!!confirmedChecks.aiPolicy}
                    onChange={() => handleToggleCheck('aiPolicy')}
                  />
                </div>

                {/* 8. Deliverables */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Required Deliverables
                    </span>
                    <ul className="text-xs text-foreground list-disc list-inside space-y-0.5">
                      {brief.fields.deliverables.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <Checkbox
                    checked={!!confirmedChecks.deliverables}
                    onChange={() => handleToggleCheck('deliverables')}
                  />
                </div>

                {/* 9. Judging Format */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Judging Format
                    </span>
                    <p className="text-xs text-foreground mt-1">{brief.fields.judgingFormat}</p>
                  </div>
                  <Checkbox
                    checked={!!confirmedChecks.judgingFormat}
                    onChange={() => handleToggleCheck('judgingFormat')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Source text card */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
              <div className="px-6 pt-5 pb-3 border-b border-border/60 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Source Text</h3>
                <span className="text-xs text-muted-foreground capitalize">
                  {brief.source}
                </span>
              </div>
              <div className="p-6">
                <div className="max-h-[500px] overflow-y-auto p-4 rounded-xl bg-muted/30 border border-border/50 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap">
                  {brief.rawText || 'No raw source text available.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY FOOTER BAR ── */}
      {brief && brief.fields?.problemStatement && (
        <div className="fixed bottom-0 left-[232px] right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border px-8 flex items-center justify-between z-20">
          <span className="text-xs font-semibold text-foreground">
            {confirmedCount} of 9 rules confirmed
            {rubricSum !== 100 && (
              <span className="text-red-500 ml-2 font-normal">(Rubric weights must sum to 100%)</span>
            )}
          </span>

          <div className="flex items-center gap-3">
            {!isLeader && (
              <span className="text-xs text-muted-foreground">Only the leader can confirm the brief</span>
            )}
            <Button
              onClick={() => confirmBriefMutation.mutate()}
              disabled={!allRulesConfirmed || rubricSum !== 100 || !isLeader || confirmBriefMutation.isPending}
              className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 h-9 px-6 rounded-[12px] text-xs font-semibold"
            >
              {confirmBriefMutation.isPending ? 'Confirming...' : 'Confirm brief'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

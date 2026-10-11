import React, { useState } from 'react';
import { briefService } from '@/services';
import type { Brief } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Link2, Upload, PenTool, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/apiClient';

interface BriefIntakeProps {
  roomId: string;
  isLeader: boolean;
  onSuccess: (brief: Brief) => void;
}

export function BriefIntake({ roomId, isLeader, onSuccess }: BriefIntakeProps) {
  const [tab, setTab] = useState<'link' | 'pdf' | 'write'>('link');
  const [linkUrl, setLinkUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStep, setParseStep] = useState(0);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [linkError, setLinkError] = useState('');
  const [pdfError, setPdfError] = useState('');

  const handleLinkFetch = async () => {
    if (!linkUrl.trim() || !isLeader) return;
    setIsParsing(true);
    setLinkError('');
    setParseStep(1);

    const t1 = setTimeout(() => setParseStep(2), 600);
    const t2 = setTimeout(() => setParseStep(3), 1200);

    try {
      const b = await briefService.setLinkSource(roomId, linkUrl.trim());
      toast.success('Announcement parsed successfully');
      onSuccess(b);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === 'FETCH_BLOCKED') setLinkError('That address is not allowed (SSRF protection).');
        else if (err.code === 'FETCH_FAILED') setLinkError('Failed to fetch page. Check URL and connectivity.');
        else if (err.code === 'EMPTY_PAGE') setLinkError('Page contains no readable text.');
        else setLinkError(err.message || 'Fetch failed');
      } else {
        setLinkError(err.message || 'Fetch failed');
      }
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsParsing(false);
      setParseStep(0);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isLeader) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Only PDF files are supported.');
      return;
    }
    setPdfError('');
    setIsParsing(true);
    setPdfProgress(0);

    try {
      const b = await briefService.setPdfSource(roomId, file, (pct) => setPdfProgress(pct));
      toast.success('PDF parsed successfully');
      onSuccess(b);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === 'NOT_A_PDF') setPdfError('Only valid PDF documents are accepted.');
        else if (err.code === 'PDF_TOO_LARGE') setPdfError('PDF is too large. Max size is 10MB.');
        else if (err.code === 'NO_TEXT_IN_PDF') setPdfError('No readable text found in PDF (scanned or image-only).');
        else setPdfError(err.message || 'Upload failed');
      } else {
        setPdfError(err.message || 'Upload failed');
      }
    } finally {
      setIsParsing(false);
      setPdfProgress(0);
    }
  };

  const handleManualWrite = async () => {
    if (!isLeader) return;
    try {
      const b = await briefService.saveBrief({
        roomId,
        source: 'manual',
        rawText: 'Manual brief entry by team.',
        fields: {
          problemStatement: '',
          targetAudience: '',
          rubric: [
            { criterion: 'Innovation', weight: 30 },
            { criterion: 'Technical Execution', weight: 40 },
            { criterion: 'Design & Polish', weight: 30 },
          ],
          deadlines: { start: null, freeze: null, submission: null },
          eligibility: 'Open to all registered participants.',
          techRules: 'Any open-source stack permitted.',
          aiPolicy: 'AI coding tools allowed and encouraged.',
          deliverables: ['Working demo', 'GitHub repo'],
          tracksAndPrizes: ['Open track'],
          judgingFormat: 'Live 3-min pitch',
        },
        confirmed: false,
        confirmedFields: {},
        risks: [],
      });
      onSuccess(b);
    } catch (e: any) {
      toast.error(e.message || 'Failed to initialize brief');
    }
  };

  return (
    <div className="rounded-[24px] bg-card border border-border shadow-xs overflow-hidden max-w-2xl mx-auto w-full">
      <div className="flex border-b border-border/70 p-2 bg-muted/20">
        <button
          type="button"
          onClick={() => setTab('link')}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
            tab === 'link' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Link2 className="size-3.5" /> Link
        </button>
        <button
          type="button"
          onClick={() => setTab('pdf')}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
            tab === 'pdf' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="size-3.5" /> Upload PDF
        </button>
        <button
          type="button"
          onClick={() => setTab('write')}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
            tab === 'write' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <PenTool className="size-3.5" /> Write it
        </button>
      </div>

      <div className="p-6">
        {tab === 'link' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Hackathon announcement URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://hackathon.dev/challenge"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  disabled={isParsing || !isLeader}
                  className="flex-1 h-10 px-3.5 rounded-[14px] bg-[#F3F3F3] dark:bg-muted/70 text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={handleLinkFetch}
                  disabled={isParsing || !linkUrl.trim() || !isLeader}
                  className="h-10 px-5 rounded-[14px] text-xs font-semibold"
                >
                  {isParsing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                  Fetch
                </Button>
              </div>
            </div>
            {linkError && <p className="text-xs text-red-500 font-medium">{linkError}</p>}
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
          </div>
        )}

        {tab === 'pdf' && (
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
            {pdfError && <p className="text-xs text-red-500 font-medium">{pdfError}</p>}
            {isParsing && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 flex items-center gap-3">
                <Loader2 className="size-4 animate-spin shrink-0" />
                <span>Uploading and extracting PDF text ({pdfProgress}%)...</span>
              </div>
            )}
          </div>
        )}

        {tab === 'write' && (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
            <p className="text-xs text-muted-foreground max-w-sm">
              Initialize the structured brief form with standard fields so you can edit and fill details manually.
            </p>
            <Button
              onClick={handleManualWrite}
              disabled={!isLeader}
              className="text-xs font-semibold h-9 px-5"
            >
              Open Structured Form &rarr;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

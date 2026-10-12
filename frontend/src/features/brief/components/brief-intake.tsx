import React, { useState } from 'react';
import { briefService } from '@/services';
import type { Brief, BriefFields } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Link2, Upload, PenTool, Loader2, FileText, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/apiClient';

interface BriefIntakeProps {
  roomId: string;
  isLeader: boolean;
  onSuccess: (brief: Brief) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  EMPTY_PAGE: 'This page builds its content with JavaScript or blocks automatic reading, so we cannot read it. Copy the text from the page and paste it, or upload the PDF.',
  FETCH_BLOCKED: 'That address is not allowed (SSRF protection).',
  FETCH_FAILED: 'Failed to fetch page. Check URL and connectivity.',
  NOT_A_PDF: 'Only valid PDF documents are accepted.',
  PDF_TOO_LARGE: 'PDF is too large. Max size is 10MB.',
  NO_TEXT_IN_PDF: 'This PDF looks scanned (only images). Paste the text instead.',
  PDF_PROTECTED: 'This PDF is password protected.',
};

export function BriefIntake({ roomId, isLeader, onSuccess }: BriefIntakeProps) {
  const [tab, setTab] = useState<'link' | 'file' | 'write'>('link');
  const [linkUrl, setLinkUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStep, setParseStep] = useState(0);
  const [fileProgress, setFileProgress] = useState(0);
  const [linkError, setLinkError] = useState('');
  const [fileError, setFileError] = useState('');
  const [showPasteText, setShowPasteText] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [textError, setTextError] = useState('');
  const [isReadingStatement, setIsReadingStatement] = useState(false);

  const getFriendlyError = (err: any): string => {
    const code = err?.code;
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
    return err?.message || 'Operation failed. Please try again.';
  };

  const handleSourceSaved = async (savedBrief: Brief) => {
    setIsReadingStatement(true);
    try {
      const res = await briefService.autoExtract(roomId);
      if (res.valid && res.fields) {
        toast.success('Brief fields extracted');
        onSuccess({
          ...savedBrief,
          fields: res.fields,
          needsStructuring: false,
        });
      } else {
        toast.info('Could not auto-extract fields. You can fill them below or copy the prompt.');
        onSuccess(savedBrief);
      }
    } catch {
      toast.info('Could not auto-extract fields. You can fill them below or copy the prompt.');
      onSuccess(savedBrief);
    } finally {
      setIsReadingStatement(false);
    }
  };

  const handleLinkFetch = async () => {
    if (!linkUrl.trim() || !isLeader) return;
    setIsParsing(true);
    setLinkError('');
    setShowPasteText(false);
    setParseStep(1);

    const t1 = setTimeout(() => setParseStep(2), 600);
    const t2 = setTimeout(() => setParseStep(3), 1200);

    try {
      const b = await briefService.setLinkSource(roomId, linkUrl.trim());
      toast.success('Announcement parsed successfully');
      await handleSourceSaved(b);
    } catch (err: any) {
      setLinkError(getFriendlyError(err));
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsParsing(false);
      setParseStep(0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !isLeader) return;

    const files = Array.from(fileList);
    const isSinglePdf = files.length === 1 && files[0].name.toLowerCase().endsWith('.pdf');
    const isImages = files.every((f) => /\.(png|jpe?g|webp)$/i.test(f.name) || f.type.startsWith('image/'));

    if (!isSinglePdf && !isImages) {
      setFileError('Please upload either 1 PDF or up to 5 images (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (isImages && files.length > 5) {
      setFileError('Maximum 5 images allowed.');
      return;
    }

    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        setFileError(`File ${f.name} exceeds 10MB limit.`);
        return;
      }
    }

    setFileError('');
    setShowPasteText(false);
    setIsParsing(true);
    setFileProgress(0);

    try {
      let b: Brief;
      if (isSinglePdf) {
        b = await briefService.setPdfSource(roomId, files[0], (pct) => setFileProgress(pct));
      } else {
        b = await briefService.setImagesSource(roomId, files, (pct) => setFileProgress(pct));
      }
      toast.success(isSinglePdf ? 'PDF processed successfully' : `${files.length} image(s) processed`);
      await handleSourceSaved(b);
    } catch (err: any) {
      setFileError(getFriendlyError(err));
    } finally {
      setIsParsing(false);
      setFileProgress(0);
    }
  };

  const handleOpenStructuredForm = async () => {
    if (!isLeader) return;
    try {
      const emptyFields: BriefFields = {
        problemStatement: '',
        targetAudience: '',
        rubric: [],
        deadlines: { start: null, freeze: null, submission: null },
        eligibility: '',
        techRules: '',
        aiPolicy: '',
        deliverables: [],
        tracksAndPrizes: [],
        judgingFormat: '',
      };
      const b = await briefService.saveBrief({
        roomId,
        source: 'manual',
        rawText: '',
        fields: emptyFields,
        confirmed: false,
        confirmedFields: {},
        risks: [],
      });
      onSuccess(b);
    } catch (e: any) {
      toast.error(e.message || 'Failed to initialize brief');
    }
  };

  const handleTextSubmit = async () => {
    const trimmed = pastedText.trim();
    if (trimmed.length < 50) {
      setTextError('Please enter at least 50 characters of brief text.');
      return;
    }
    if (trimmed.length > 200000) {
      setTextError('Text exceeds the maximum length of 200,000 characters.');
      return;
    }
    setIsSubmittingText(true);
    setTextError('');
    try {
      const b = await briefService.setTextSource(roomId, trimmed);
      toast.success('Brief text saved');
      await handleSourceSaved(b);
    } catch (err: any) {
      setTextError(err.message || 'Failed to save text');
    } finally {
      setIsSubmittingText(false);
    }
  };

  return (
    <div className="relative rounded-[24px] bg-card border border-border shadow-xs overflow-hidden max-w-2xl mx-auto w-full">
      {isReadingStatement && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-6 text-center animate-in fade-in duration-200">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-base font-semibold text-foreground">Reading the statement...</p>
          <p className="text-xs text-muted-foreground">Extracting problem statement, rubric, and rules</p>
        </div>
      )}

      <div className="flex border-b border-border/70 p-2 bg-muted/20">
        <button
          type="button"
          onClick={() => { setTab('link'); setShowPasteText(false); }}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
            tab === 'link' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Link2 className="size-3.5" /> Link
        </button>
        <button
          type="button"
          onClick={() => { setTab('file'); setShowPasteText(false); }}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
            tab === 'file' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="size-3.5" /> Upload file
        </button>
        <button
          type="button"
          onClick={() => { setTab('write'); setShowPasteText(false); }}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
            tab === 'write' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <PenTool className="size-3.5" /> Write it
        </button>
      </div>

      <div className="p-6">
        {showPasteText ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Paste Hackathon Brief Text</label>
              <button
                type="button"
                onClick={() => setShowPasteText(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the announcement text, rules, rubric, and deadlines here (50 - 200,000 characters)..."
              className="w-full p-3.5 rounded-xl bg-[#F3F3F3] dark:bg-muted/70 text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{pastedText.length.toLocaleString()} / 200,000 characters (min 50)</span>
              {textError && <span className="text-red-500 font-medium">{textError}</span>}
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenStructuredForm}
                disabled={!isLeader}
                className="text-xs h-9"
              >
                Fill the form by hand
              </Button>
              <Button
                size="sm"
                onClick={handleTextSubmit}
                disabled={isSubmittingText || pastedText.trim().length < 50 || !isLeader}
                className="text-xs h-9 px-5"
              >
                {isSubmittingText ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Save Brief Text
              </Button>
            </div>
          </div>
        ) : (
          <>
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

                {linkError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex flex-col gap-2.5">
                    <p className="font-medium leading-relaxed">{linkError}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-500/20">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPasteText(true)}
                        className="text-xs h-8 gap-1.5 bg-background text-foreground"
                      >
                        <FileText className="size-3.5" /> Paste the text instead
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenStructuredForm}
                        className="text-xs h-8 gap-1.5 bg-background text-foreground"
                      >
                        <Edit3 className="size-3.5" /> Fill the form by hand
                      </Button>
                    </div>
                  </div>
                )}

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

            {tab === 'file' && (
              <div className="flex flex-col gap-4">
                <label className="relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-border hover:border-neutral-400 dark:hover:border-neutral-600 bg-muted/20 cursor-pointer transition-colors text-center">
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isParsing || !isLeader}
                    className="hidden"
                  />
                  <div className="size-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
                    <Upload className="size-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Drop 1 PDF or up to 5 images (PNG, JPG, WEBP), or click to upload</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">Maximum file size: 10MB per file</span>
                </label>

                {fileError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex flex-col gap-2.5">
                    <p className="font-medium leading-relaxed">{fileError}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-500/20">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPasteText(true)}
                        className="text-xs h-8 gap-1.5 bg-background text-foreground"
                      >
                        <FileText className="size-3.5" /> Paste the text instead
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenStructuredForm}
                        className="text-xs h-8 gap-1.5 bg-background text-foreground"
                      >
                        <Edit3 className="size-3.5" /> Fill the form by hand
                      </Button>
                    </div>
                  </div>
                )}

                {isParsing && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 flex items-center gap-3">
                    <Loader2 className="size-4 animate-spin shrink-0" />
                    <span>Uploading and reading file content ({fileProgress}%)...</span>
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
                  onClick={handleOpenStructuredForm}
                  disabled={!isLeader}
                  className="text-xs font-semibold h-9 px-5"
                >
                  Open Structured Form &rarr;
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

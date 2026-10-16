import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, RefreshCw, AlertCircle, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { briefService } from '@/services/briefService';
import type { FileIntakeResult } from '@/services/types';
import { ApiError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

export const TYPED_EXTRACTION_ERRORS: Record<string, string> = {
  FILE_TYPE_UNSUPPORTED: 'Unsupported file type. Please upload a PDF, DOCX, Markdown, or plain text file.',
  FILE_TOO_LARGE: 'File is too large. Maximum supported file size is 12 MB.',
  FILE_ENCRYPTED: 'This file is password-protected or encrypted. Please upload an unencrypted file.',
  FILE_NO_TEXT: 'This PDF looks scanned (images only). Upload a PDF with selectable text, or paste the text.',
  FILE_TIMEOUT: 'Reading the file took too long (20s timeout). Try a smaller file or paste the text.',
  FILE_UNREADABLE: 'The file could not be read or is corrupted. Please try again or paste the text.',
};

export interface BriefFileUploadProps {
  roomId: string;
  isLeader: boolean;
  aiAllowed?: boolean;
  aiDisabledReason?: string;
  onSuccess?: (result: FileIntakeResult) => void;
  onExtractWithAi?: (text: string) => void;
  onPasteTextInstead?: () => void;
  className?: string;
}

type UploadState = 'idle' | 'uploading' | 'reading' | 'done' | 'error';

export function BriefFileUpload({
  roomId,
  isLeader,
  aiAllowed = true,
  aiDisabledReason,
  onSuccess,
  onExtractWithAi,
  onPasteTextInstead,
  className,
}: BriefFileUploadProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<FileIntakeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fullTextOpen, setFullTextOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFriendlyError = (err: any): string => {
    const code = err?.code;
    if (code && TYPED_EXTRACTION_ERRORS[code]) {
      return TYPED_EXTRACTION_ERRORS[code];
    }
    return err?.message || 'Failed to read file. Please check format and try again.';
  };

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    // Check size limit: 12MB
    if (file.size > 12 * 1024 * 1024) {
      setState('error');
      setErrorMessage(TYPED_EXTRACTION_ERRORS.FILE_TOO_LARGE);
      return;
    }

    setSelectedFileName(file.name);
    setState('uploading');
    setProgress(0);
    setErrorMessage('');
    setResult(null);

    try {
      const intakeRes = await briefService.intakeFile(roomId, file, false, (pct) => {
        setProgress(pct);
        if (pct >= 100) {
          setState('reading');
        }
      });

      setState('done');
      setResult(intakeRes);
      if (onSuccess) {
        onSuccess(intakeRes);
      }
    } catch (err: any) {
      setState('error');
      setErrorMessage(getFriendlyError(err));
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (state === 'uploading' || state === 'reading') return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (state !== 'uploading' && state !== 'reading') {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRetry = () => {
    setState('idle');
    setErrorMessage('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleReset = () => {
    setState('idle');
    setErrorMessage('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.md,.markdown,.txt"
        onChange={onFileInputChange}
        disabled={state === 'uploading' || state === 'reading'}
        className="sr-only"
        id={`brief-file-input-${roomId}`}
      />

      {/* State: Idle */}
      {state === 'idle' && (
        <label
          htmlFor={`brief-file-input-${roomId}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            'relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center select-none outline-none',
            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary',
            isDragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-neutral-400 dark:hover:border-neutral-600 bg-muted/20'
          )}
        >
          <div className="size-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Upload className="size-5" />
          </div>
          <span className="text-xs font-bold text-foreground">
            Drop a PDF, DOCX, Markdown, or TXT file here, or click to upload
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Accepts .pdf, .docx, .md, .txt up to 12 MB
          </span>
        </label>
      )}

      {/* State: Uploading */}
      {state === 'uploading' && (
        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              {selectedFileName || 'Uploading file...'}
            </span>
            <span className="font-mono text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <span className="text-[11px] text-muted-foreground">Uploading file to server...</span>
        </div>
      )}

      {/* State: Reading */}
      {state === 'reading' && (
        <div className="p-8 rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-3 text-center animate-in fade-in duration-200">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-sm font-semibold text-foreground">Reading the file...</p>
          <p className="text-xs text-muted-foreground">Extracting text and cleaning document content</p>
        </div>
      )}

      {/* State: Done */}
      {state === 'done' && result && (
        <div className="p-5 rounded-2xl border border-border bg-card flex flex-col gap-3.5 animate-in fade-in duration-200">
          {/* Quiet Summary Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate">
                  {selectedFileName || 'Document extracted'}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {result.pages > 0 ? `${result.pages} page${result.pages === 1 ? '' : 's'}, ` : ''}
                  {result.chars.toLocaleString()} characters
                  {result.truncated ? ' (truncated to 200k chars)' : ''}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Upload different file
            </Button>
          </div>

          {/* First 400 Characters in Muted Mono Preview */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Text Preview:</span>
            <div className="relative rounded-xl bg-muted/40 border border-border/50 p-3 font-mono text-xs text-muted-foreground leading-relaxed overflow-hidden max-h-32">
              <pre className="whitespace-pre-wrap font-mono text-[11px] line-clamp-4">
                {result.sourceText.slice(0, 400)}
                {result.sourceText.length > 400 ? '...' : ''}
              </pre>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setFullTextOpen(true)}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye className="size-3" /> Show full text
              </button>
            </div>
          </div>

          {/* Warnings if any */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              {result.warnings.map((w, idx) => (
                <p key={idx}>{w}</p>
              ))}
            </div>
          )}

          {/* Action Row: Primary Button "Extract with AI" */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
            <span className="text-[11px] text-muted-foreground">
              Source text has been stored to the brief.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                disabled={!aiAllowed}
                title={!aiAllowed ? (aiDisabledReason || 'AI is disabled by event policy') : 'Extract brief fields with AI'}
                onClick={() => {
                  if (onExtractWithAi) {
                    onExtractWithAi(result.sourceText);
                  }
                }}
                className="w-full sm:w-auto text-xs font-semibold h-9 px-4 gap-1.5"
              >
                <Sparkles className="size-3.5" />
                Extract with AI
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* State: Error */}
      {state === 'error' && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed flex-1">{errorMessage}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-red-500/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="text-xs h-8 gap-1.5 bg-background text-foreground"
            >
              <RefreshCw className="size-3.5" /> Retry
            </Button>
            {onPasteTextInstead && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPasteTextInstead}
                className="text-xs h-8 gap-1.5 bg-background text-foreground"
              >
                <FileText className="size-3.5" /> Paste text instead
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Full Text Dialog */}
      <Dialog open={fullTextOpen} onOpenChange={setFullTextOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Full Extracted Text ({result?.chars.toLocaleString()} chars)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-muted/30 border border-border text-xs font-mono whitespace-pre-wrap select-all">
            {result?.sourceText}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

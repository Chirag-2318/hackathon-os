import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { briefService } from '@/services';
import { fetchSettings } from '@/features/prep/api/settings-api';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Sparkles, Copy, Check, Loader2, Key } from 'lucide-react';
import { toast } from 'sonner';

interface StructuringBannerProps {
  roomId: string;
  onExtracted: (fields: any) => void;
}

export function StructuringBanner({ roomId, onExtracted }: StructuringBannerProps) {
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const hasApiKey = (settings?.aiAndKeys?.providers?.length || 0) > 0;

  const handleCopyPrompt = async () => {
    try {
      const prompt = await briefService.getExtractionPrompt(roomId);
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Extraction prompt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch prompt');
    }
  };

  const handleValidate = async () => {
    if (!pastedJson.trim()) return;
    setIsValidating(true);
    setValidationErrors([]);
    try {
      const res = await briefService.validateExtract(roomId, pastedJson.trim());
      if (res.valid && res.fields) {
        toast.success('Fields extracted successfully!');
        setDialogOpen(false);
        onExtracted(res.fields);
      } else {
        setValidationErrors(res.errors || ['Validation failed']);
      }
    } catch (err: any) {
      setValidationErrors([err.message || 'Invalid format']);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAutoExtract = async () => {
    setIsExtracting(true);
    try {
      const res = await briefService.autoExtract(roomId);
      if (res.valid && res.fields) {
        toast.success('Extracted fields using your API key!');
        onExtracted(res.fields);
      } else {
        toast.error('AI extraction could not structure all fields');
      }
    } catch (err: any) {
      toast.error(err.message || 'Auto extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-xs text-foreground font-medium">
          We read the page but could not fill the fields. Fill them from the source, or extract them with an AI chat.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyPrompt}
          className="text-xs h-8 gap-1.5"
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied prompt' : 'Copy extraction prompt'}
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs h-8">
              Paste AI reply & Validate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Paste AI Extraction Result</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <p className="text-xs text-muted-foreground">
                Paste the JSON returned by ChatGPT, Claude, or Gemini below:
              </p>
              <textarea
                rows={6}
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
                placeholder='{"problemStatement": "...", "targetAudience": "...", "rubric": [...]}'
                className="w-full p-3 rounded-xl bg-muted font-mono text-xs border border-border focus:ring-1 focus:ring-primary outline-none"
              />
              {validationErrors.length > 0 && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 space-y-1">
                  {validationErrors.map((err, i) => (
                    <div key={i}>&bull; {err}</div>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={handleValidate}
                  disabled={!pastedJson.trim() || isValidating}
                  className="text-xs"
                >
                  {isValidating ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Validate & Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {hasApiKey ? (
          <Button
            size="sm"
            onClick={handleAutoExtract}
            disabled={isExtracting}
            className="text-xs h-8 gap-1.5"
          >
            {isExtracting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            Extract with my API key
          </Button>
        ) : (
          <Link
            to="/settings"
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 underline underline-offset-2 ml-1"
          >
            <Key className="size-3" /> Add API key in Settings to auto-extract
          </Link>
        )}
      </div>
    </div>
  );
}

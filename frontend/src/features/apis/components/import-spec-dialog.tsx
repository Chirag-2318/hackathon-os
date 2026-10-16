import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  X,
} from 'lucide-react';
import { apiHubService, type ImportApiResponse } from '../api/api-hub-service';
import { toast } from 'sonner';

interface ImportSpecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onImportSuccess: () => void;
}

export function ImportSpecDialog({
  open,
  onOpenChange,
  roomId,
  onImportSuccess,
}: ImportSpecDialogProps) {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [mode, setMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewResult, setPreviewResult] = useState<ImportApiResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setPastedText('');
    setPreviewResult(null);
    setErrorMsg(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0];
      if (/\.(json|yaml|yml)$/i.test(f.name)) {
        setFile(f);
        setPreviewResult(null);
        setErrorMsg(null);
      } else {
        toast.error('Please upload a .json, .yaml, or .yml file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setPreviewResult(null);
      setErrorMsg(null);
    }
  };

  const runDryRun = async () => {
    if (tab === 'upload' && !file) {
      toast.error('Please select an OpenAPI spec file first');
      return;
    }
    if (tab === 'paste' && !pastedText.trim()) {
      toast.error('Please paste OpenAPI spec JSON or YAML first');
      return;
    }

    setIsPreviewing(true);
    setErrorMsg(null);
    try {
      let res: ImportApiResponse;
      if (tab === 'upload' && file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', mode);
        formData.append('dryRun', 'true');
        res = await apiHubService.importMultipart(roomId, formData);
      } else {
        res = await apiHubService.importJson(roomId, {
          text: pastedText,
          mode,
          dryRun: true,
        });
      }
      setPreviewResult(res);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse OpenAPI specification');
      setPreviewResult(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApplyImport = async () => {
    setIsImporting(true);
    try {
      let res: ImportApiResponse;
      if (tab === 'upload' && file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', mode);
        formData.append('dryRun', 'false');
        res = await apiHubService.importMultipart(roomId, formData);
      } else {
        res = await apiHubService.importJson(roomId, {
          text: pastedText,
          mode,
          dryRun: false,
        });
      }

      if (res.success) {
        toast.success(`Imported ${res.created} new and ${res.updated} updated endpoints`);
        onImportSuccess();
        onOpenChange(false);
        resetState();
      } else {
        setErrorMsg(res.error || 'Failed to complete import');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">Import OpenAPI Spec</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Import OpenAPI 3.x or Swagger 2.0 specs. References are resolved locally with SSRF protection.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-xs">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => {
                setTab('upload');
                setPreviewResult(null);
              }}
              className={`pb-2 px-3 font-medium transition-colors border-b-2 -mb-px ${
                tab === 'upload'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => {
                setTab('paste');
                setPreviewResult(null);
              }}
              className={`pb-2 px-3 font-medium transition-colors border-b-2 -mb-px ${
                tab === 'paste'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Paste JSON / YAML
            </button>
          </div>

          {/* Tab 1: Upload */}
          {tab === 'upload' && (
            <div>
              {file ? (
                <div className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileCode className="h-5 w-5 text-primary shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setPreviewResult(null);
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    .json, .yaml, or .yml files up to 2MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.yaml,.yml"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Paste */}
          {tab === 'paste' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">OpenAPI Spec Content</Label>
              <Textarea
                placeholder="Paste openapi: 3.0.3 or swagger: 2.0 YAML or JSON content here..."
                rows={7}
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  setPreviewResult(null);
                }}
                className="font-mono text-[11px] resize-none"
              />
            </div>
          )}

          {/* Mode Selection */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <Label className="text-xs font-semibold text-foreground">Import Strategy</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => {
                setMode(v as 'MERGE' | 'REPLACE');
                setPreviewResult(null);
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MERGE" id="mode-merge" />
                <Label htmlFor="mode-merge" className="cursor-pointer text-xs">
                  <span className="font-medium text-foreground">Merge</span>
                  <span className="text-muted-foreground ml-1">(add new & update existing)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REPLACE" id="mode-replace" />
                <Label htmlFor="mode-replace" className="cursor-pointer text-xs">
                  <span className="font-medium text-foreground">Replace</span>
                  <span className="text-muted-foreground ml-1">(replace all current endpoints)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preview Trigger */}
          {!previewResult && !errorMsg && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runDryRun}
                disabled={isPreviewing || (tab === 'upload' && !file) || (tab === 'paste' && !pastedText.trim())}
                className="w-full text-xs h-8"
              >
                {isPreviewing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Preview Changes (Dry Run)
              </Button>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-xs flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Specification parsing error</p>
                <p className="text-[11px] opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Dry Run Preview Result */}
          {previewResult && (
            <div className="p-3 rounded-lg border border-border bg-card space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>
                  {previewResult.endpointsFound} endpoints found ({previewResult.created} new,{' '}
                  {previewResult.updated} updates, {previewResult.skipped} unchanged)
                </span>
              </div>

              {previewResult.tags && previewResult.tags.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Tags: {previewResult.tags.join(', ')}
                </p>
              )}

              {previewResult.warnings && previewResult.warnings.length > 0 && (
                <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] space-y-1">
                  <p className="font-medium">Parser Warnings ({previewResult.warnings.length}):</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {previewResult.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Export Downloads */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Download current room spec:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => apiHubService.downloadOpenApi(roomId, 'json')}
                className="h-7 text-xs gap-1"
              >
                <Download className="h-3 w-3" /> JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => apiHubService.downloadOpenApi(roomId, 'yaml')}
                className="h-7 text-xs gap-1"
              >
                <Download className="h-3 w-3" /> YAML
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={previewResult ? handleApplyImport : runDryRun}
            disabled={
              isImporting ||
              isPreviewing ||
              (tab === 'upload' && !file) ||
              (tab === 'paste' && !pastedText.trim())
            }
            className="text-xs h-8"
          >
            {isImporting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {previewResult ? 'Import' : 'Preview & Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

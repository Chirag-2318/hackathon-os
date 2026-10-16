import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface CodePopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  joinCode: string;
}

export function CodePopover({ open, onOpenChange, joinCode }: CodePopoverProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Room code copied');
    } catch {
      toast.error('Failed to copy code');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] p-6 rounded-2xl bg-surface border border-border shadow-2xl text-center">
        <DialogHeader className="space-y-1 text-center pb-1">
          <DialogTitle className="text-lg font-medium tracking-tight text-foreground">
            Share room code
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Anyone with this code can join until the room is full.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-muted/30 border border-border/60 my-2">
          <div
            className="font-mono text-2xl font-bold tracking-widest text-foreground select-all py-1"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            {joinCode || '------'}
          </div>
          <div className="flex justify-center mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyCode}
              className="h-8 px-4 text-xs font-medium gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-muted-foreground" />
                  Copy code
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

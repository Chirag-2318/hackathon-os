import React from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RoleChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchName: string;
  existingDemoSafeBranch: string;
  onConfirm: () => void;
}

export function RoleChangeDialog({
  open,
  onOpenChange,
  branchName,
  existingDemoSafeBranch,
  onConfirm,
}: RoleChangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[20px] p-6 font-[var(--font-inter)]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert className="size-5 text-blue-600" />
            Replace demo-safe branch?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1.5 leading-relaxed">
            <span className="font-mono text-foreground font-medium">{existingDemoSafeBranch}</span> is currently designated as the demo-safe branch.
            <br />
            Setting <span className="font-mono text-foreground font-medium">{branchName}</span> as demo-safe will replace it and designate {branchName} as your squad's protected fallback for stage presentations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-5 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            Confirm replacement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * S28-6 Privacy sub-section
 * PRD 6a §3, S28-6
 *
 * Three cards: What we store (placeholder), Export data, Delete account.
 * Delete account → C25 confirmation dialog.
 * TODO [OQ-6]: "What we store" content to be supplied by product team.
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { requestExport, deleteAccount } from '@/features/prep/api/settings-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function PrivacySection() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const exportMutation = useMutation({
    mutationFn: requestExport,
    onSuccess: (result) => {
      // Trigger browser download
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = 'export.zip';
      a.click();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      // Redirect to landing after account deletion
      window.location.href = '/';
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-ink">Privacy</h1>

      {/* Card 1: What we store */}
      <div className="rounded-card bg-surface border border-border p-6">
        <h3 className="text-h3 text-ink mb-3">What we store</h3>
        {/* TODO [OQ-6]: Product team to supply exact list of stored data types */}
        <p className="text-body text-ink-muted">[Content to be supplied by the product team]</p>
      </div>

      {/* Card 2: Export data */}
      <div className="rounded-card bg-surface border border-border p-6 flex flex-col gap-3">
        <h3 className="text-h3 text-ink">Export your data</h3>
        <p className="text-body text-ink">
          Download all your rooms, plans, tasks, and documents as a zip file.
        </p>
        <Button
          className="self-start bg-lav-600 text-white hover:bg-lav-700"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? 'Preparing export…' : 'Export everything'}
        </Button>
        <p className="text-caption text-ink-muted">
          Your export will include all rooms you own or are a member of.
        </p>
      </div>

      {/* Card 3: Delete account */}
      <div className="rounded-card bg-surface border border-border p-6 flex flex-col gap-3">
        <h3 className="text-h3 text-ink">Delete account</h3>
        <p className="text-body text-ink">
          This permanently removes your account and all rooms you own. This cannot be undone.
        </p>
        <Button
          variant="outline"
          className="self-start border-[#A82D2D] text-[#A82D2D] hover:bg-[#FBD9D7]"
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete account
        </Button>
      </div>

      {/* Confirmation dialog — C25, 480px */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This removes all your rooms permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#C23A3A] text-white hover:bg-[#A82D2D]"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

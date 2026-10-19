import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { recordPlanInterest } from '@/features/prep/api/settings-api';
import { WAITLIST_COPY } from '../data/waitlist-copy';

type WaitlistPlan = 'pro' | 'max';

interface WaitlistDialogProps {
  plan: WaitlistPlan | null;
  onClose: () => void;
}

type WaitlistStatus = 'idle' | 'sending' | 'sent' | 'signin' | 'error';

export function WaitlistDialog({ plan, onClose }: WaitlistDialogProps) {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<WaitlistStatus>('idle');

  useEffect(() => {
    setNote('');
    setStatus('idle');
  }, [plan]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!plan) return;

    setStatus('sending');
    try {
      const trimmed = note.trim();
      await recordPlanInterest(plan, trimmed.length > 0 ? trimmed : undefined);
      setStatus('sent');
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        (error.status === 401 || error.status === 403)
      ) {
        setStatus('signin');
      } else {
        setStatus('error');
      }
    }
  };

  const title = plan ? WAITLIST_COPY.titles[plan] : '';

  return (
    <Dialog open={plan !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        {status === 'sent' ? (
          <>
            <DialogHeader>
              <DialogTitle>{WAITLIST_COPY.sentTitle}</DialogTitle>
              <DialogDescription>{WAITLIST_COPY.sentLine}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button type="button" onClick={onClose}>
                {WAITLIST_COPY.close}
              </Button>
            </DialogFooter>
          </>
        ) : status === 'signin' ? (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{WAITLIST_COPY.signinLine}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 sm:justify-start">
              <Button asChild>
                <Link to="/signin" onClick={onClose}>
                  {WAITLIST_COPY.signinLabel}
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{WAITLIST_COPY.description}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <label htmlFor="waitlist-note" className="text-sm font-medium">
                {WAITLIST_COPY.noteLabel}
              </label>
              <Textarea
                id="waitlist-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={WAITLIST_COPY.notePlaceholder}
                maxLength={WAITLIST_COPY.noteMax}
                rows={4}
              />
            </div>
            {status === 'error' && (
              <p role="alert" className="text-sm text-destructive">
                {WAITLIST_COPY.errorLine}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? WAITLIST_COPY.sending : WAITLIST_COPY.submit}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * InviteExpired — S03 expired/invalid-link state.
 * Source: PRD §3.3 States.
 *
 * Replaces the card content with "Ask the leader for a new link" (verbatim).
 * Entrance: 8px rise + fade (uses --translate-sm, --t-base).
 * design.md gives a single state for expired and invalid.
 * No primary action (Q12).
 */
import { LinkIcon } from 'lucide-react';
import { COPY } from '@/shared/constants/copy';

export function InviteExpired() {
  return (
    <div
      className="flex flex-col items-center gap-4 p-8 text-center animate-in fade-in slide-in-from-bottom-2"
      style={{
        animationDuration: 'var(--t-base)',
        animationTimingFunction: 'var(--ease-out)',
      }}
      data-testid="invite-expired"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
        <LinkIcon className="size-7" strokeWidth={1.5} />
      </div>
      <h2 className="text-h2 text-ink-strong">{COPY.invite.expiredHeading}</h2>
      <p className="text-body text-ink-muted">{COPY.invite.expiredMessage}</p>
    </div>
  );
}

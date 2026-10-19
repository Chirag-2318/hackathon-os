/**
 * S32 System pages — shared SystemStatePage wrapper.
 * Source: design.md §6 S32; PRD Phase 6b §3.4; animations.md §6.2 S32, §9
 *
 * Pattern: C28 anatomy — illustration slot (120px), H3 headline, optional
 * guidance sentence, primary action, optional secondary link.
 * §6.2 S32: "Static except standard button motion."
 * §9 content-arrival: fade in 160ms (baseline, no bespoke entrance).
 *
 * OQ-17: no shell chrome wraps these pages by default (unsafe when session
 *   or room context may be broken). A minimal logo/home link is included as
 *   an engineering necessity so users can navigate out.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { COPY } from '@/shared/constants/copy';
import { WifiOff, ServerCrash, ShieldOff, SearchX, Wrench } from 'lucide-react';
import { cn } from 'cn';
import { BracketMark } from '@/features/landing/components/bracket-mark';

// ── Shared wrapper ───────────────────────────────────────────────

interface SystemStatePageProps {
  icon?: ReactNode;
  mark?: ReactNode;
  headline: string;
  guidance?: string;
  children?: ReactNode;
  /** data-testid for the page root */
  testId: string;
}

function SystemStatePage({ icon, mark, headline, guidance, children, testId }: SystemStatePageProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-canvas px-6 py-12"
      data-testid={testId}
      id={testId}
    >
      {/* Minimal chrome — OQ-17: full shell unspecified */}
      <div className="absolute top-4 left-4">
        <a href="/app" className="text-label text-lav-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded">
          ← Home
        </a>
      </div>

      {/* C28 anatomy — illustration slot 120px */}
      <div
        className="flex flex-col items-center text-center max-w-sm gap-4"
        style={{ animation: 'fadeIn 160ms ease-out both' }}
      >
        {icon && (
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-surface-raised shadow-e1 text-ink-muted [&_svg]:size-12">
            {icon}
          </div>
        )}

        {mark}

        <h1 className="text-h3 text-ink">{headline}</h1>

        {guidance && (
          <p className="text-body text-ink-muted">{guidance}</p>
        )}

        {children}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}

// ── 404 Not Found ────────────────────────────────────────────────

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <SystemStatePage
      testId="page-404"
      mark={
        <div className="flex justify-center text-ink mb-4">
          <BracketMark size={48} />
        </div>
      }
      headline="This page missed the deadline."
      guidance="Go back to the room."
    >
      <Button
        id="page-404-action-btn"
        onClick={() => navigate('/app')}
        className="mt-2"
      >
        Back to [brackit]
      </Button>
    </SystemStatePage>
  );
}

import { apiClient } from '@/lib/apiClient';

async function submitJoinCode(code: string): Promise<{ success: boolean; roomId?: string; error?: string }> {
  try {
    const data = await apiClient<{ roomId: string }>('/api/v1/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return { success: true, roomId: data.roomId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function ForbiddenPage() {
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: submitJoinCode,
    onSuccess: (result) => {
      if (result.success) {
        setJoined(true);
        if (result.roomId) {
          setTimeout(() => navigate(`/app/room/${result.roomId}/overview`), 1200);
        }
      } else {
        setJoinError(COPY.system.forbiddenJoinErrorMessage);
      }
    },
    onError: () => setJoinError(COPY.system.forbiddenJoinErrorMessage),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (code.trim()) mutate(code.trim());
  };

  return (
    <SystemStatePage
      testId="page-403"
      icon={<ShieldOff />}
      headline={COPY.system.forbiddenTitle}
      guidance={COPY.system.forbiddenBody}
    >
      {joined ? (
        <p className="text-body text-ink-muted mt-2">{COPY.system.forbiddenJoinSuccessMessage}</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 w-full"
          aria-label="Join with code"
        >
          <label htmlFor="join-code-input" className="text-body-strong text-ink text-left">
            {COPY.system.forbiddenJoinFieldLabel}
          </label>
          <input
            id="join-code-input"
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value); setJoinError(null); }}
            className={cn(
              'rounded-control border bg-surface px-3 py-2 text-body text-ink',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
              joinError ? 'border-danger-stroke' : 'border-border',
              // §9 inline-error shake on invalid submit
              joinError && 'animate-[shake_0.3s_ease-in-out]',
            )}
            aria-invalid={!!joinError}
            aria-describedby={joinError ? 'join-code-error' : undefined}
          />
          {joinError && (
            <p id="join-code-error" role="alert" className="text-caption text-danger-text">
              {joinError}
            </p>
          )}
          <Button
            id="page-403-join-btn"
            type="submit"
            disabled={!code.trim() || isPending}
          >
            {isPending ? 'Joining…' : COPY.system.forbiddenJoinButtonLabel}
          </Button>
        </form>
      )}

      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
    </SystemStatePage>
  );
}

// ── 500 Server Error ─────────────────────────────────────────────

export function ServerErrorPage() {
  return (
    <SystemStatePage
      testId="page-500"
      mark={
        <div className="flex justify-center text-ink mb-4">
          <BracketMark size={48} />
        </div>
      }
      headline="Something broke. The clock didn’t."
    >
      <Button
        id="page-500-action-btn"
        variant="outline"
        onClick={() => window.location.reload()}
        className="mt-2"
      >
        {COPY.system.serverErrorAction}
      </Button>
    </SystemStatePage>
  );
}

// ── Offline ──────────────────────────────────────────────────────
// OQ-20: ambiguous whether this is a full page or banner-over-cache.
// Building both: this component is the full-page variant.
// The §9 banner-over-cache treatment lives in individual page components.

export function OfflinePage() {
  return (
    <SystemStatePage
      testId="page-offline"
      icon={<WifiOff />}
      headline={COPY.system.offlineTitle}
      guidance={COPY.system.offlineAmbiguity}
    >
      <Button
        id="page-offline-action-btn"
        variant="outline"
        onClick={() => window.location.reload()}
        className="mt-2"
      >
        Try again
      </Button>
    </SystemStatePage>
  );
}

// ── Maintenance ──────────────────────────────────────────────────

export function MaintenancePage() {
  return (
    <SystemStatePage
      testId="page-maintenance"
      mark={
        <div className="flex justify-center text-ink mb-4">
          <BracketMark size={48} />
        </div>
      }
      headline="Back shortly."
      guidance="We are making a change."
    >
      <Button
        id="page-maintenance-action-btn"
        variant="outline"
        onClick={() => window.location.reload()}
        className="mt-2"
      >
        {COPY.system.maintenanceAction}
      </Button>
    </SystemStatePage>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sun, Moon, Laptop, X } from 'lucide-react';
import { useTheme, type Theme } from '@/components/theme-provider';
import { BrandLogo } from '@/brand';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SignInAuthButtons } from './sign-in-auth-buttons';
import { FullCapacityCard } from '@/features/public/full-capacity-card';
import { apiFetch } from '@/design/api';

interface CapacityDto {
  open: boolean;
  cap: number;
  spotsLeft: number | null;
}

interface PublicConfigDto {
  supportEmail?: string;
}

interface InvitePreviewDto {
  roomName: string;
  inviterUsername?: string;
  inviterDisplayName?: string;
  inviterAvatarUrl?: string;
}

interface SignInLeftColumnProps {
  capacity: CapacityDto | undefined;
  isLoadingCapacity: boolean;
}

export function SignInLeftColumn({ capacity, isLoadingCapacity }: SignInLeftColumnProps) {
  const { theme, setTheme } = useTheme();
  const [searchParams] = useSearchParams();

  const [hasReturningProvider] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('last_provider'));
    } catch {
      return false;
    }
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invitePreview, setInvitePreview] = useState<InvitePreviewDto | null>(null);
  const [supportEmail, setSupportEmail] = useState<string | null>(null);
  const [showMemberSignIn, setShowMemberSignIn] = useState<boolean>(false);

  // 1. Process URL error param (?error=denied, failed, deleted, unknown)
  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam) {
      if (errParam === 'denied') {
        setErrorMessage('You cancelled the sign-in. Nothing was changed.');
      } else if (errParam === 'failed') {
        setErrorMessage("Sign-in didn't complete. Please try again.");
      } else if (errParam === 'deleted') {
        setErrorMessage('Your account has been deleted.');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }

      // Remove error parameter from URL without page reload
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
      } catch {}
    }
  }, [searchParams]);

  // 2. Preserve ?next= return path in sessionStorage
  useEffect(() => {
    const next = searchParams.get('next');
    if (next) {
      try {
        sessionStorage.setItem('next_path', next);
      } catch {}
    }
  }, [searchParams]);

  // 3. Invite Context Preview
  useEffect(() => {
    let token: string | null = null;
    try {
      token = sessionStorage.getItem('pending_invite_token');
    } catch {}

    if (!token) {
      const redirect = searchParams.get('redirect');
      if (redirect && redirect.startsWith('/invite/')) {
        token = redirect.replace('/invite/', '').split('?')[0];
      }
    }

    if (token) {
      apiFetch<InvitePreviewDto>(`/api/v1/invites/preview?token=${encodeURIComponent(token)}`)
        .then((data) => {
          if (data && data.roomName) {
            setInvitePreview(data);
          }
        })
        .catch(() => {
          // Graceful fallback: failures show nothing
        });
    }
  }, [searchParams]);

  // 4. Public Config for Contact supportEmail
  useEffect(() => {
    apiFetch<PublicConfigDto>('/api/v1/public/config')
      .then((cfg) => {
        if (cfg?.supportEmail) {
          setSupportEmail(cfg.supportEmail);
        }
      })
      .catch(() => {
        // Quiet fallback
      });
  }, []);

  // Theme cycle: Light -> Dark -> System -> Light
  const getNextTheme = (curr: Theme): { next: Theme; label: string } => {
    if (curr === 'light') return { next: 'dark', label: 'Dark mode' };
    if (curr === 'dark') return { next: 'system', label: 'System mode' };
    return { next: 'light', label: 'Light mode' };
  };

  const { next: nextTheme, label: nextThemeLabel } = getNextTheme(theme);

  const headingText = hasReturningProvider ? 'Welcome back.' : 'Step inside.';
  const isCapacityClosed = capacity && !capacity.open && !showMemberSignIn;

  return (
    <div className="relative z-10 flex flex-col justify-between w-full h-full min-h-dvh p-6 sm:p-10 md:p-14 text-left">
      {/* ── Top Row: Logo & Theme Toggle ── */}
      <div className="signin-rise-1 flex items-center justify-between w-full shrink-0">
        <Link
          to="/"
          className="focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-4 rounded"
          aria-label="bracket. home"
        >
          <BrandLogo size={28} />
        </Link>

        {/* Quiet Theme Toggle Button */}
        <TooltipProvider>
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                className="flex items-center justify-center size-9 rounded-[8px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-surface)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] cursor-pointer"
                aria-label={`Switch to ${nextThemeLabel}`}
              >
                {theme === 'light' ? (
                  <Sun size={17} strokeWidth={1.5} />
                ) : theme === 'dark' ? (
                  <Moon size={17} strokeWidth={1.5} />
                ) : (
                  <Laptop size={17} strokeWidth={1.5} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="text-xs font-sans">
              {nextThemeLabel}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ── Main Form Block (Centred vertically, max 400px) ── */}
      <main
        id="signin-content"
        className="my-auto py-10 w-full max-w-[400px] flex flex-col text-left self-start"
      >
        {/* Invite Context Notice (Above label) */}
        {invitePreview && (
          <div className="signin-rise-2 mb-6 pb-4 border-b border-[var(--border)] flex items-center gap-3">
            {invitePreview.inviterAvatarUrl ? (
              <img
                src={invitePreview.inviterAvatarUrl}
                alt=""
                className="size-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="size-6 rounded-full bg-[var(--hover-surface)] flex items-center justify-center font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                @
              </div>
            )}
            <p className="font-sans text-[13px] text-[var(--text)] leading-snug truncate">
              <span className="font-medium">
                @{invitePreview.inviterDisplayName || invitePreview.inviterUsername || 'team'}
              </span>{' '}
              invited you to <span className="font-medium">{invitePreview.roomName}</span>. Sign in to join.
            </p>
          </div>
        )}

        {/* Small Label: SIGN IN */}
        <span className="signin-rise-2 font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)] mb-5 block">
          SIGN IN
        </span>

        {/* Heading: Masked line-by-line reveal */}
        <h1 className="signin-rise-3 sign-in-heading mb-7">
          <span className="signin-heading-mask">
            <span
              className="signin-heading-reveal signin-animate-heading text-[var(--ink)] text-[44px] sm:text-[52px] md:text-[64px] font-normal leading-[1.02] tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
            >
              {headingText}
            </span>
          </span>
        </h1>

        {/* Sub-line (max 36ch) */}
        <p className="signin-rise-4 font-sans text-[15px] leading-[22px] text-[var(--text-muted)] max-w-[36ch] mb-7">
          Plans, rooms and deadlines for hackathon teams. Sign in to continue, or start something new.
        </p>

        {/* Dismissible Error Notice (Hairline border, no red fill, small cross glyph) */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="signin-rise-5 mb-5 p-3 rounded-[8px] border border-[var(--border-strong)] bg-transparent flex items-start justify-between gap-3 text-[13px] leading-relaxed text-[var(--text)]"
            data-testid="auth-error"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-0.5"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Buttons / Waitlist Card */}
        <div className="signin-rise-6">
          {isCapacityClosed ? (
            <div className="flex flex-col gap-4">
              <FullCapacityCard
                reason={capacity?.spotsLeft === 0 ? 'capacity' : 'closed'}
                isInline
                onSignIn={() => setShowMemberSignIn(true)}
              />
              <button
                type="button"
                onClick={() => setShowMemberSignIn(true)}
                className="text-left font-sans text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-4 cursor-pointer"
              >
                Already a member? Sign in
              </button>
            </div>
          ) : (
            <SignInAuthButtons capacity={capacity} isLoadingCapacity={isLoadingCapacity} />
          )}
        </div>
      </main>

      {/* ── Bottom Row: Legal & Contact ── */}
      <footer className="signin-rise-8 flex items-center gap-2.5 font-mono text-[12px] text-[var(--text-muted)] pt-6 shrink-0">
        <Link to="/terms" className="hover:text-[var(--text)] transition-colors">
          Terms
        </Link>
        <span className="opacity-40" aria-hidden="true">
          ·
        </span>
        <Link to="/privacy" className="hover:text-[var(--text)] transition-colors">
          Privacy
        </Link>
        {supportEmail && (
          <>
            <span className="opacity-40" aria-hidden="true">
              ·
            </span>
            <a href={`mailto:${supportEmail}`} className="hover:text-[var(--text)] transition-colors">
              Contact
            </a>
          </>
        )}
      </footer>
    </div>
  );
}

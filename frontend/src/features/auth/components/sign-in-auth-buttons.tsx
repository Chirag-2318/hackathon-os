import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../api';
import { ArrowRight } from 'lucide-react';

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
    </svg>
  );
}

interface CapacityDto {
  open: boolean;
  cap: number;
  spotsLeft: number | null;
}

interface SignInAuthButtonsProps {
  capacity: CapacityDto | undefined;
  isLoadingCapacity: boolean;
}

export function SignInAuthButtons({ capacity, isLoadingCapacity }: SignInAuthButtonsProps) {
  const [lastProvider, setLastProvider] = useState<string | null>(() => {
    try {
      return localStorage.getItem('last_provider');
    } catch {
      return null;
    }
  });

  const [activeClick, setActiveClick] = useState<'github' | 'google' | null>(null);

  // Animated tween for open spots count
  const [displayedSpots, setDisplayedSpots] = useState<number>(0);
  const tweenRef = useRef<number | null>(null);

  const spotsLeft = capacity?.spotsLeft ?? null;
  const cap = capacity?.cap ?? 1000;

  useEffect(() => {
    if (spotsLeft === null || spotsLeft === undefined) return;

    const startVal = Math.max(0, Math.floor(spotsLeft * 0.7));
    const targetVal = spotsLeft;
    const duration = 800; // ms
    const startTime = performance.now();

    const updateTween = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // ease-out quartic
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startVal + (targetVal - startVal) * ease);
      setDisplayedSpots(current);

      if (progress < 1) {
        tweenRef.current = requestAnimationFrame(updateTween);
      }
    };

    tweenRef.current = requestAnimationFrame(updateTween);
    return () => {
      if (tweenRef.current) cancelAnimationFrame(tweenRef.current);
    };
  }, [spotsLeft]);

  // Restore button state on pageshow (e.g. back button / bfcache) and 10s fallback
  useEffect(() => {
    const handlePageShow = () => {
      setActiveClick(null);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    if (activeClick) {
      const timer = setTimeout(() => {
        setActiveClick(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeClick]);

  // Keyboard shortcut listeners (H for GitHub, G for Google)
  const githubAnchorRef = useRef<HTMLAnchorElement>(null);
  const googleAnchorRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Autofocus last used provider (else GitHub) without visible outline until keyboard navigation
    const target = lastProvider === 'google' ? googleAnchorRef.current : githubAnchorRef.current;
    if (target) {
      target.focus({ preventScroll: true });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        githubAnchorRef.current?.click();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        googleAnchorRef.current?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastProvider]);

  const handleProviderClick = (provider: 'github' | 'google') => {
    try {
      localStorage.setItem('last_provider', provider);
    } catch {}
    setLastProvider(provider);
    setActiveClick(provider);
  };

  const isGitHubClicked = activeClick === 'github';
  const isGoogleClicked = activeClick === 'google';

  // Spots dot color calculation
  const hasSpots = spotsLeft !== null && cap > 0;
  const isUrgentSpots = hasSpots && spotsLeft <= 50;

  return (
    <div className="w-full flex flex-col gap-0 select-none">
      {/* 1. Buttons Stack */}
      <div className="flex flex-col gap-2 w-full">
        {/* GitHub Button (Primary: Inverse tokens) */}
        <a
          ref={githubAnchorRef}
          href={authApi.githubLoginUrl}
          onClick={() => handleProviderClick('github')}
          className={`group relative flex items-center justify-between h-[52px] px-4 rounded-[12px] font-sans text-[15px] font-medium transition-[opacity,transform,background-color] duration-160 ease-out active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 overflow-hidden ${
            isGoogleClicked ? 'opacity-50 pointer-events-none' : ''
          }`}
          style={{
            backgroundColor: 'var(--bg-inverse)',
            color: 'var(--fg-on-inverse)',
          }}
          data-testid="btn-github"
        >
          {/* Left: Icon + Label */}
          <div className="flex items-center gap-3">
            <span className="shrink-0 flex items-center justify-center size-4" aria-hidden="true">
              <GitHubIcon size={16} />
            </span>
            <span>{isGitHubClicked ? 'Opening GitHub...' : 'Continue with GitHub'}</span>
          </div>

          {/* Right: Last used indicator or Arrow + H hint */}
          <div className="flex items-center gap-2">
            {lastProvider === 'github' && !isGitHubClicked && (
              <span className="font-mono text-[11px] opacity-70 group-hover:hidden group-focus-visible:hidden">
                Last used
              </span>
            )}
            <span className="hidden group-hover:inline-block group-focus-visible:inline-block font-mono text-[11px] opacity-60">
              H
            </span>
            <ArrowRight
              size={14}
              className="shrink-0 transition-all duration-160 ease-out transform -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
              aria-hidden="true"
            />
          </div>

          {/* Bottom active loading line */}
          {isGitHubClicked && <div className="signin-btn-progress-line" />}
        </a>

        {/* Google Button (Secondary: Surface token + 1px border) */}
        <a
          ref={googleAnchorRef}
          href={authApi.googleLoginUrl}
          onClick={() => handleProviderClick('google')}
          className={`group relative flex items-center justify-between h-[52px] px-4 rounded-[12px] font-sans text-[15px] font-medium border border-[var(--border)] transition-[opacity,transform,background-color] duration-160 ease-out active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 overflow-hidden ${
            isGitHubClicked ? 'opacity-50 pointer-events-none' : ''
          }`}
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
          }}
          data-testid="btn-google"
        >
          {/* Left: Icon + Label */}
          <div className="flex items-center gap-3">
            <span className="shrink-0 flex items-center justify-center size-4" aria-hidden="true">
              <GoogleIcon size={16} />
            </span>
            <span>{isGoogleClicked ? 'Opening Google...' : 'Continue with Google'}</span>
          </div>

          {/* Right: Last used indicator or Arrow + G hint */}
          <div className="flex items-center gap-2">
            {lastProvider === 'google' && !isGoogleClicked && (
              <span className="font-mono text-[11px] text-[var(--text-muted)] group-hover:hidden group-focus-visible:hidden">
                Last used
              </span>
            )}
            <span className="hidden group-hover:inline-block group-focus-visible:inline-block font-mono text-[11px] text-[var(--text-muted)]">
              G
            </span>
            <ArrowRight
              size={14}
              className="shrink-0 transition-all duration-160 ease-out transform -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 text-[var(--text-muted)]"
              aria-hidden="true"
            />
          </div>

          {/* Bottom active loading line */}
          {isGoogleClicked && <div className="signin-btn-progress-line" />}
        </a>
      </div>

      {/* 2. Spots Line (12px gap below buttons, min-h-[20px] to prevent layout shift) */}
      <div className="mt-3 min-h-[20px] flex items-center" aria-live="polite">
        {isLoadingCapacity ? (
          <div className="h-3 w-48 rounded bg-[var(--hover-surface)] animate-pulse" />
        ) : hasSpots ? (
          <div className="flex items-center gap-2 font-mono text-[12px] text-[var(--text-muted)]">
            <span
              className={`size-1.5 rounded-full shrink-0 ${
                isUrgentSpots ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              aria-hidden="true"
            />
            {isUrgentSpots ? (
              <span className="text-amber-500 font-medium">
                Only {spotsLeft.toLocaleString()} spots left.
              </span>
            ) : (
              <span>
                Early access · {displayedSpots.toLocaleString()} of {cap.toLocaleString()} spots open
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* 3. Permissions Line (20px gap below spots line, max 40ch) */}
      <p className="mt-5 font-sans text-[12px] leading-[18px] text-[var(--text-muted)] max-w-[40ch]">
        We only ask for your name, email and public profile. Private repositories stay private unless you allow them later.
      </p>
    </div>
  );
}

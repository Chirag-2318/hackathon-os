import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { BRAND } from '@/brand';
import { apiFetch } from '@/design/api';
import { SignInLeftColumn } from './components/sign-in-left-column';
import { SignInHeroPanel } from './components/sign-in-hero-panel';
import './styles/sign-in.css';

interface CapacityDto {
  open: boolean;
  cap: number;
  spotsLeft: number | null;
}

export function SignInPage() {
  const navigate = useNavigate();
  const { data: user, isLoading: isAuthLoading } = useCurrentUser();

  // Public capacity query
  const { data: capacity, isLoading: isLoadingCapacity } = useQuery<CapacityDto>({
    queryKey: ['public-capacity'],
    queryFn: () => apiFetch<CapacityDto>('/api/v1/public/capacity').catch(() => ({
      open: true,
      cap: 1000,
      spotsLeft: null,
    })),
    staleTime: 30000,
  });

  // Immediate redirect for authenticated visitors (no flash of login screen)
  useEffect(() => {
    if (user) {
      const nextPath = typeof window !== 'undefined' ? sessionStorage.getItem('next_path') : null;
      if (nextPath) {
        sessionStorage.removeItem('next_path');
        navigate(nextPath, { replace: true });
      } else if (!user.onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/app/home', { replace: true });
      }
    }
  }, [user, navigate]);

  // SEO: title, meta tags, OpenGraph, Canonical, Twitter
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `Sign in · ${BRAND.wordmark}`;

    const updateOrCreateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateOrCreateMeta('description', 'Plans, rooms and deadlines for hackathon teams.');
    updateOrCreateMeta('robots', 'index, follow');
    updateOrCreateMeta('og:title', `Sign in · ${BRAND.wordmark}`, true);
    updateOrCreateMeta('og:description', 'Plans, rooms and deadlines for hackathon teams.', true);
    updateOrCreateMeta('og:type', 'website', true);
    updateOrCreateMeta('og:image', '/signin/og-signin.jpg', true);
    updateOrCreateMeta('twitter:card', 'summary_large_image');
    updateOrCreateMeta('twitter:title', `Sign in · ${BRAND.wordmark}`);
    updateOrCreateMeta('twitter:description', 'Plans, rooms and deadlines for hackathon teams.');
    updateOrCreateMeta('twitter:image', '/signin/og-signin.jpg');

    return () => {
      document.title = originalTitle;
    };
  }, []);

  // Avoid flash if user is already authenticated
  if (user) {
    return <div className="min-h-screen bg-[var(--page)]" />;
  }

  return (
    <div className="relative min-h-dvh w-full bg-[var(--page)] text-[var(--text)] overflow-x-hidden selection:bg-[var(--accent)] selection:text-black">
      {/* Fine SVG feTurbulence Grain (3% Opacity) */}
      <div className="signin-page-grain" aria-hidden="true" />

      {/* Accessible Skip Link */}
      <a
        href="#signin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[var(--bg-inverse)] text-[var(--fg-on-inverse)] rounded-md text-xs font-mono"
      >
        Skip to content
      </a>

      {/* Noscript Alert */}
      <noscript>
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-center font-mono text-xs text-amber-600">
          Sign-in needs JavaScript.
        </div>
      </noscript>

      {/* Main Grid: Responsive 2-Column Desktop layout / Single column mobile */}
      <div className="relative z-10 w-full min-h-dvh max-w-[1680px] mx-auto flex flex-col md:flex-row">
        {/* Left Column: 44% on desktop >= 1100px, 52% on 768-1099px, 100% on mobile */}
        <div className="w-full md:w-[52%] lg:w-[44%] shrink-0 flex flex-col">
          <SignInLeftColumn capacity={capacity} isLoadingCapacity={isLoadingCapacity} />
        </div>

        {/* Right Column (Hero Panel): 56% desktop, 48% tablet, top 30dvh banner on mobile */}
        <div className="order-first md:order-last w-full md:w-[48%] lg:w-[56%] p-3 sm:p-4 flex items-center justify-center shrink-0">
          <SignInHeroPanel />
        </div>
      </div>
    </div>
  );
}

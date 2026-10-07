/**
 * LandingPage — S01 page composition.
 * Source: PRD §3.1 (all 7 items in order).
 *
 * Renders all seven parts of the landing page in the specified order.
 * No extra content blocks, no extra header links (D§13).
 * No sidebar, topbar, or command palette (public screen).
 * Wrapped in QueryClientProvider for TanStack Query.
 */
import { LandingHeader } from './components/landing-header';
import { HeroSection } from './components/hero-section';
import { FiveWaysSection } from './components/five-ways-section';
import { PhaseWalkthrough } from './components/phase-walkthrough';
import { PlansSection } from './components/plans-section';
import { PlaybookSection } from './components/playbook-section';
import { LandingFooter } from './components/landing-footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* 1. Header */}
      <LandingHeader />

      {/* Content container */}
      <div className="mx-auto max-w-[1200px] px-6">
        {/* 2. Hero */}
        <HeroSection />

        {/* 3. Five ways teams lose */}
        <FiveWaysSection />

        {/* 4. Phase walkthrough */}
        <PhaseWalkthrough />

        {/* 5. Plans */}
        <PlansSection />

        {/* 6. Playbook cards */}
        <PlaybookSection />
      </div>

      {/* 7. Footer */}
      <LandingFooter />
    </div>
  );
}

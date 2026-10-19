/**
 * LandingPage — top-level page for the "/" route.
 * Font CSS is imported here so it ships only with the landing route bundle.
 */
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import './styles/landing.css';

import { LandingChrome } from './components/landing-chrome';
import { HudProvider } from './hooks/use-hud';
import { useOverDark } from './hooks/use-over-dark';
import { useDocumentMeta } from './hooks/use-document-meta';
import { SEO } from './data/seo';
import { LandingJsonLd } from './components/landing-json-ld';
import { ThemeProvider, getCurrentTheme } from './hooks/use-theme';
import { Hero } from './sections/hero';
import { Doors } from './sections/doors';
import { ProblemRail } from './sections/problem-rail';
import { Pivot } from './sections/pivot';
import { HowItWorks } from './sections/how-it-works';
import { DeepDives } from './sections/deep-dives';
import { StageAct } from './sections/stage-act';
import { Playbooks } from './sections/playbooks';
import { RoomGrid } from './sections/room-grid';
import { Trust } from './sections/trust';
import { Compare } from './sections/compare';
import { Pricing } from './sections/pricing';
import { Faq } from './sections/faq';
import { FinalCta } from './sections/final-cta';
import { SiteFooter } from './sections/site-footer';
import { TickRuler } from './components/tick-ruler';
import { RULER_LABELS } from './data/rulers';

function LandingContent() {
  useDocumentMeta(SEO);
  const overDark = useOverDark(['stage-act', 'final-cta', 'site-footer']);

  return (
    <HudProvider>
      <div className="landing-root" data-theme={getCurrentTheme()}>
        <a className="l-skip" href="#main">Skip to content</a>
        <LandingChrome overDark={overDark} />
        <main id="main" tabIndex={-1}>
          <Hero />
          <Doors />
          <ProblemRail />
          <Pivot />
          <HowItWorks />
          <DeepDives />
          <StageAct />
          <Playbooks />
          <TickRuler label={RULER_LABELS.playbooksToRoom} />
          <RoomGrid />
          <TickRuler label={RULER_LABELS.roomToTrust} />
          <Trust />
          <TickRuler label={RULER_LABELS.trustToCompare} />
          <Compare />
          <TickRuler label={RULER_LABELS.compareToPricing} />
          <Pricing />
          <TickRuler label={RULER_LABELS.pricingToFaq} />
          <Faq />
          <FinalCta />
        </main>
        <SiteFooter />
        <LandingJsonLd />
      </div>
    </HudProvider>
  );
}

export function LandingPage() {
  return (
    <ThemeProvider>
      <LandingContent />
    </ThemeProvider>
  );
}

/**
 * HeroSection — S01 item 2.
 * Source: PRD §3.1 item 2.
 *
 * Two-column layout: left = headline + sentence, right = framed Room Overview.
 * Asymmetric, not centered. Stacks below 768px with screen after headline.
 * No hero CTA (none specified). Static — no entrance animation.
 */
import { FramedScreen } from '@/components/primitives/framed-screen';
import { COPY } from '@/shared/constants/copy';

export function HeroSection() {
  return (
    <section
      className="grid grid-cols-1 gap-8 py-16 md:grid-cols-[5fr_7fr] md:gap-12 md:py-24"
      aria-label="Hero"
    >
      {/* Left: copy */}
      <div className="flex flex-col justify-center">
        <h1 className="text-display text-ink-strong mb-4">
          {COPY.landing.heroHeadline}
        </h1>
        <p className="text-body text-ink-muted max-w-md">
          {COPY.landing.heroSentence}
        </p>
      </div>

      {/* Right: framed Room Overview screen */}
      <div className="flex items-center">
        <FramedScreen
          label="Room Overview (S08) — placeholder"
          className="w-full"
        />
      </div>
    </section>
  );
}

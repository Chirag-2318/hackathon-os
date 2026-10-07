/**
 * SignInIllustration — S02 right panel.
 * Source: PRD §3.2.
 *
 * C10g HeroPanel: ice-blue #AEE6FF field, r-panel, CC0 illustration.
 * No bell/avatar overlay (Home-only, D§4 C10g).
 * No entrance animation on S02 (Q10).
 */
import { HeroPanel } from '@/components/primitives/hero-panel';
import { IllustrationSlot } from '@/components/primitives/illustration-slot';
import { COPY } from '@/shared/constants/copy';

export function SignInIllustration() {
  return (
    <div className="hidden md:flex md:items-center md:justify-center md:p-8 lg:p-12">
      <HeroPanel
        fillColor="var(--pastel-sky)"
        className="h-full min-h-[400px] w-full"
      >
        <IllustrationSlot color="sky" size="lg" className="w-full">
          <span className="text-caption text-ink-muted select-none" aria-hidden="true">
            {COPY.signIn.illustrationAlt}
          </span>
        </IllustrationSlot>
      </HeroPanel>
    </div>
  );
}

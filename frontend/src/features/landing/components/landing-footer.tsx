/**
 * LandingFooter — S01 item 7.
 * Source: PRD §3.1 item 7.
 *
 * No content specified in design.md. Rendered as a minimal placeholder
 * with the logo text. Copy TBD.
 */
import { COPY } from '@/shared/constants/copy';

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-body-strong text-ink">{COPY.logo}</span>
          <p className="text-caption text-ink-muted">{COPY.landing.footer}</p>
        </div>
      </div>
    </footer>
  );
}

/**
 * LandingHeader — S01 header bar.
 * Source: PRD §3.1 item 1.
 *
 * Logo · Playbooks · Pricing · Sign in (Outline) · Start a room (Primary).
 * No extra links beyond those listed (D§13 banned patterns).
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { COPY } from '@/shared/constants/copy';
import { ROUTES } from '@/shared/constants/routes';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        {/* Logo */}
        <Link
          to={ROUTES.LANDING}
          className="text-h3 text-ink font-bold whitespace-nowrap"
        >
          {COPY.logo}
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <Link
            to={ROUTES.PLAYBOOKS}
            className="hidden sm:inline-flex px-3 py-2 text-body text-ink-muted hover:text-ink transition-colors rounded-control"
          >
            {COPY.nav.playbooks}
          </Link>
          <a
            href="#plans"
            className="hidden sm:inline-flex px-3 py-2 text-body text-ink-muted hover:text-ink transition-colors rounded-control"
          >
            {COPY.nav.pricing}
          </a>
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.SIGN_IN}>{COPY.nav.signIn}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to={ROUTES.SIGN_IN}>{COPY.nav.startRoom}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

/**
 * PortfolioEntryPreview — S24
 * Read-only preview: project, role, links, awards. [D S24].
 *
 * Links: only http/https, rel="noopener noreferrer" [T §7.2].
 * Text rendered as plain text — no HTML render [T §4.4].
 * No Share/Publish/Save control [§2.2].
 *
 * AC-24-6: Project, role, links, awards. No-awards → empty state.
 *           http/https links only. No Share/Publish/Save.
 */
import { ExternalLink, Award, Link2, Briefcase } from 'lucide-react';
import { EmptyState } from '@/components/primitives/empty-state';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { PortfolioEntry, PortfolioLink } from '../api/types';

/** Only render http and https links. Anything else shows as plain text [T §7.2]. */
function SafeLink({ link }: { link: PortfolioLink }) {
  let isSafe = false;
  try {
    const parsed = new URL(link.url);
    isSafe = parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    isSafe = false;
  }

  if (isSafe) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-body text-lav-600 underline underline-offset-2 hover:text-lav-700 transition-colors"
        aria-label={`${link.label} (opens in new tab)`}
      >
        <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{link.label}</span>
      </a>
    );
  }

  // Unsafe: render as inert plain text
  return (
    <span className="text-body text-ink-muted" aria-label={`${link.label} (link not available)`}>
      {link.label} <span className="text-caption">(unsafe URL)</span>
    </span>
  );
}

interface PortfolioEntryPreviewProps {
  portfolio: PortfolioEntry;
}

export function PortfolioEntryPreview({ portfolio }: PortfolioEntryPreviewProps) {
  const { project, role, links, awards } = portfolio;

  return (
    <div className="bg-surface-raised rounded-card shadow-e1 p-5 flex flex-col gap-5">
      <h2 className="text-h3 text-ink">Portfolio entry preview</h2>

      {/* Project */}
      <section aria-labelledby="portfolio-project">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="size-4 text-ink-muted shrink-0" aria-hidden="true" />
          <h3 id="portfolio-project" className="text-label font-semibold text-ink-muted">
            Project
          </h3>
        </div>
        <p className="text-h3 text-ink">{project.name}</p>
        {project.description && (
          <p className="text-body text-ink-muted mt-1 line-clamp-3">
            {/* Plain text — never rendered as HTML [T §4.4] */}
            {project.description}
          </p>
        )}
      </section>

      {/* Role */}
      {role && (
        <section aria-labelledby="portfolio-role">
          <h3 id="portfolio-role" className="text-label font-semibold text-ink-muted mb-1">
            Role
          </h3>
          <p className="text-body text-ink">{role}</p>
        </section>
      )}

      {/* Links */}
      {links.length > 0 && (
        <section aria-labelledby="portfolio-links">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="size-4 text-ink-muted shrink-0" aria-hidden="true" />
            <h3 id="portfolio-links" className="text-label font-semibold text-ink-muted">
              Links
            </h3>
          </div>
          <ul className="flex flex-col gap-1.5">
            {links.map((link, i) => (
              <li key={i}>
                <SafeLink link={link} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Awards */}
      <section aria-labelledby="portfolio-awards">
        <div className="flex items-center gap-2 mb-2">
          <Award className="size-4 text-ink-muted shrink-0" aria-hidden="true" />
          <h3 id="portfolio-awards" className="text-label font-semibold text-ink-muted">
            Awards
          </h3>
        </div>

        {awards.length === 0 ? (
          <EmptyState
            title="No awards yet"
            description="Awards will appear here once results are available."
            dashed
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {awards.map((award, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-control bg-pastel-amber/40 px-3 py-2"
              >
                <Award className="size-4 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-body-strong text-ink line-clamp-2">
                        {/* Plain text [T §4.4] */}
                        {award.title}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>{award.title}</TooltipContent>
                  </Tooltip>
                  <p className="text-caption text-ink-muted">{award.event}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* No Share / Publish / Save control per §2.2 (OQ-13) */}
    </div>
  );
}

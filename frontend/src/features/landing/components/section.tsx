/**
 * Section — full-width landing page section with tone, grid background, and grain support.
 * All visual behaviour comes from data-attributes matched in landing.css.
 */
import type { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  /** Background tone: 'light' (shell), 'surface', or 'dark' (stage) */
  tone?: 'light' | 'surface' | 'dark';
  /** Show the hairline grid background */
  grid?: boolean;
  /** Show the film-grain texture */
  grain?: boolean;
  /** Include vertical padding (default true). Set false to remove it. */
  padded?: boolean;
  ariaLabelledBy?: string;
  className?: string;
  children: ReactNode;
}

export function Section({
  id,
  tone = 'light',
  grid = false,
  grain = false,
  padded = true,
  ariaLabelledBy,
  className,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`l-section${className ? ` ${className}` : ''}`}
      data-tone={tone}
      data-grain={grain ? 'true' : undefined}
      data-padding={padded ? undefined : 'none'}
    >
      {grid && <div className="l-grid-bg" aria-hidden="true" />}
      {children}
    </section>
  );
}

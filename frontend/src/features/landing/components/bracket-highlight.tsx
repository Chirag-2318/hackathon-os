/**
 * BracketHighlight — a small bracket pair drawn around an inline phrase.
 * A highlighted phrase is nowrap by design; a phrase that must wrap over
 * several lines needs a different approach in a later slice.
 * A highlight adds about 1.1em of total width to the line (padding plus margin on both sides), by design.
 */
import type { ReactNode } from 'react';
import { Bracket } from './bracket';

interface BracketHighlightProps {
  children: ReactNode;
  /** Controls the draw-on animation. true = brackets visible. */
  active?: boolean;
  /** 'violet' uses the brand colour (default). 'ink' uses dark ink. */
  tone?: 'violet' | 'ink';
  className?: string;
}

export function BracketHighlight({
  children,
  active = true,
  tone = 'violet',
  className,
}: BracketHighlightProps) {
  return (
    <span
      className={`l-hl${className ? ` ${className}` : ''}`}
      data-tone={tone === 'ink' ? 'ink' : undefined}
    >
      <Bracket side="left" drawn={active} />
      {children}
      <Bracket side="right" drawn={active} />
    </span>
  );
}

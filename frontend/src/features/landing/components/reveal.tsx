/**
 * Reveal — fades and rises once when scrolled into view;
 * the stagger is 60ms per index; Rise (plays on mount) is for
 * things already on screen at load, Reveal is for things further down the page.
 */
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useInViewOnce } from '../hooks/use-in-view-once';

interface RevealProps {
  as?: 'div' | 'li';
  index?: number;
  className?: string;
  children: ReactNode;
}

export function Reveal({
  as = 'div',
  index = 0,
  className = '',
  children,
}: RevealProps) {
  const { ref, inView } = useInViewOnce<HTMLElement>();
  const Tag: ElementType = as;

  return (
    <Tag
      ref={ref}
      className={`l-reveal ${className}`.trim()}
      data-revealed={inView ? 'true' : 'false'}
      style={{ '--l-i': index } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

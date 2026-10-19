/**
 * Rise — plays once when mounted; stagger is 60ms per index.
 * A scroll-triggered version arrives in a later slice.
 */
import type { CSSProperties, ReactNode } from 'react';

interface RiseProps {
  /** Stagger index: each step delays 60ms */
  index?: number;
  className?: string;
  children: ReactNode;
}

export function Rise({ index = 0, className = '', children }: RiseProps) {
  return (
    <div
      className={`l-rise ${className}`.trim()}
      style={{ '--l-i': index } as CSSProperties}
    >
      {children}
    </div>
  );
}

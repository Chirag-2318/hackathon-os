/**
 * Container — constrains landing content to max-width with horizontal padding.
 * Uses l-container (1200px) or l-container-wide (1280px) from landing.css.
 */
import type { ReactNode } from 'react';

interface ContainerProps {
  /** Use the wider 1280px max-width instead of the default 1200px */
  wide?: boolean;
  className?: string;
  children: ReactNode;
}

export function Container({ wide, className, children }: ContainerProps) {
  const base = wide ? 'l-container-wide' : 'l-container';
  return (
    <div className={`${base}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

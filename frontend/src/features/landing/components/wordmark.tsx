/**
 * Wordmark — the [brackit] logotype with coloured brackets.
 * Always renders the product name exactly as [brackit], lowercase with brackets.
 */
import type { CSSProperties } from 'react';

interface WordmarkProps {
  /** Font size in px */
  size?: number;
  /** 'light' for light backgrounds, 'dark' for the stage */
  on?: 'light' | 'dark';
  className?: string;
}

export function Wordmark({ size = 22, on = 'light', className }: WordmarkProps) {
  return (
    <span
      className={`l-wordmark${className ? ` ${className}` : ''}`}
      data-on={on}
      role="img"
      aria-label="[brackit]"
      style={{ '--l-wordmark-size': `${size}px` } as CSSProperties}
    >
      <span className="l-wordmark-br" aria-hidden="true">[</span>
      <span aria-hidden="true">brackit</span>
      <span className="l-wordmark-br" aria-hidden="true">]</span>
    </span>
  );
}

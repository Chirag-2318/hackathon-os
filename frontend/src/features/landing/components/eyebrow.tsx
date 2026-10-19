/**
 * Eyebrow — mono label used above section headings.
 *
 * IMPORTANT: the product name [brackit] must never go through CSS
 * uppercase or capitalize. Any eyebrow whose text contains the product
 * name must pass preserveCase.
 */
import type { ReactNode } from 'react';

interface EyebrowProps {
  /** Section index shown as [ NN ]. Number is zero-padded to 2 digits. */
  index?: number | string;
  children: ReactNode;
  /** Skip the uppercase transform (required when text contains [brackit]) */
  preserveCase?: boolean;
  className?: string;
}

/** Format a numeric index to two zero-padded digits */
function formatIndex(value: number | string): string {
  if (typeof value === 'number') {
    return String(value).padStart(2, '0');
  }
  return value;
}

export function Eyebrow({ index, children, preserveCase, className }: EyebrowProps) {
  const capsClass = preserveCase ? '' : ' l-eyebrow--caps';

  return (
    <p className={`l-eyebrow${capsClass}${className ? ` ${className}` : ''}`}>
      {index !== undefined && (
        <span className="l-eyebrow-index">[ {formatIndex(index)} ]</span>
      )}
      <span>{children}</span>
    </p>
  );
}

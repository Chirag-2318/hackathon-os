/**
 * Bracket — the primitive bracket shape.
 * A left or right square bracket drawn with CSS borders and animated
 * via clip-path transition. Stays crisp at any size.
 */
import type { CSSProperties } from 'react';

interface BracketProps {
  side: 'left' | 'right';
  /** Arm length in px. Uses CSS default (14px) when omitted. */
  arm?: number;
  /** Line thickness in px. Uses CSS default (2px) when omitted. */
  stroke?: number;
  /** Controls the draw-on animation. true = visible, false = clipped. */
  drawn?: boolean;
  className?: string;
}

export function Bracket({
  side,
  arm,
  stroke,
  drawn = true,
  className,
}: BracketProps) {
  const style: CSSProperties = {};
  if (arm !== undefined) {
    (style as Record<string, string>)['--l-br-arm'] = `${arm}px`;
  }
  if (stroke !== undefined) {
    (style as Record<string, string>)['--l-br-stroke'] = `${stroke}px`;
  }

  return (
    <span
      className={`l-bracket${className ? ` ${className}` : ''}`}
      data-side={side}
      data-drawn={drawn ? 'true' : 'false'}
      aria-hidden="true"
      style={Object.keys(style).length > 0 ? style : undefined}
    />
  );
}

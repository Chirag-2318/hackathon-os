/**
 * BracketFrame — tall brackets flanking a content block.
 * The brackets are absolutely positioned outside the block by CSS
 * and only appear from tablet width (768px) up.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Bracket } from './bracket';

interface BracketFrameProps {
  children: ReactNode;
  /** 'auto' inherits the section's bracket colour. 'light' or 'dark' overrides it. */
  tone?: 'auto' | 'light' | 'dark';
  /** Distance of the brackets from the block in px */
  gap?: number;
  /** Arm length passed to both brackets */
  arm?: number;
  /** Line thickness passed to both brackets */
  stroke?: number;
  /** Controls the draw-on animation on both brackets */
  drawn?: boolean;
  className?: string;
}

export function BracketFrame({
  children,
  tone = 'auto',
  gap,
  arm,
  stroke,
  drawn = true,
  className,
}: BracketFrameProps) {
  const style: CSSProperties | undefined =
    gap !== undefined
      ? ({ '--l-frame-gap': `${gap}px` } as CSSProperties)
      : undefined;

  return (
    <div
      className={`l-frame${className ? ` ${className}` : ''}`}
      data-tone={tone === 'auto' ? undefined : tone}
      style={style}
    >
      <Bracket side="left" arm={arm} stroke={stroke} drawn={drawn} />
      {children}
      <Bracket side="right" arm={arm} stroke={stroke} drawn={drawn} />
    </div>
  );
}

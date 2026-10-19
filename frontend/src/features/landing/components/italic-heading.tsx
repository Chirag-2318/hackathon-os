/**
 * ItalicHeading — the signature landing headline pattern.
 * Every heading ends with an italic phrase (the em prop).
 * The lead text (roman/upright) can be a single string or multiple lines.
 * Lines break onto their own rows only from 1280px up via the .l-line CSS rule.
 */
import { createElement } from 'react';

/** Map from semantic tag to default typographic size class */
const defaultSizeMap = {
  h1: 'h1',
  h2: 'h2',
  h3: 'display-s',
} as const;

interface ItalicHeadingProps {
  /** Semantic heading tag */
  as?: 'h1' | 'h2' | 'h3';
  /** Typographic size class. Defaults based on the `as` tag. */
  size?: 'h1' | 'h2' | 'display-s' | 'display-xl';
  /** The roman (upright) part of the heading. Array = multiple lines. */
  lead: string | string[];
  /** The italic ending phrase */
  em: string;
  /** Text alignment */
  align?: 'left' | 'center';
  id?: string;
  className?: string;
  /** Render the trailing dot (if any) with purple gradient */
  gradientDot?: boolean;
}

export function ItalicHeading({
  as = 'h2',
  size,
  lead,
  em: emText,
  align = 'left',
  id,
  className,
  gradientDot,
}: ItalicHeadingProps) {
  const resolvedSize = size ?? defaultSizeMap[as];
  const sizeClass = `l-${resolvedSize}`;

  const lines = Array.isArray(lead) ? lead : [lead];
  const lastIndex = lines.length - 1;

  const renderEm = () => {
    if (gradientDot && emText.endsWith('.')) {
      const base = emText.slice(0, -1);
      return (
        <em>
          {base}
          <span className="l-gradient-dot">.</span>
        </em>
      );
    }
    return <em>{emText}</em>;
  };

  const content = lines.map((line, i) => {
    if (i === lastIndex) {
      return (
        <span key={i} className="l-line">
          {line} {renderEm()}
        </span>
      );
    }
    return (
      <span key={i} className="l-line">
        {line}{' '}
      </span>
    );
  });

  return createElement(
    as,
    {
      id,
      className: `${sizeClass}${className ? ` ${className}` : ''}`,
      style: { textAlign: align },
    },
    ...content,
  );
}

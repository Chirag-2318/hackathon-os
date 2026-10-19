/**
 * BracketMark — the standalone [ ] logo mark as an SVG.
 * Two open square brackets rendered as paths, inheriting colour
 * from the parent's CSS `color` property.
 */

interface BracketMarkProps {
  /** Width and height in px */
  size?: number;
  /** Stroke width in viewBox units */
  strokeWidth?: number;
  className?: string;
  /** Accessible title. When provided the SVG gets role="img". */
  title?: string;
}

export function BracketMark({
  size = 40,
  strokeWidth = 2.5,
  className,
  title,
}: BracketMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      {title && <title>{title}</title>}
      <path d="M14 6H8V34H14" />
      <path d="M26 6H32V34H26" />
    </svg>
  );
}

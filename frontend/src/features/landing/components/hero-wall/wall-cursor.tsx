type WallCursorProps = {
  /** start position inside the screen, in design px */
  x: number;
  y: number;
  /** travel to the click point, in design px */
  dx: number;
  dy: number;
  /** delay before it appears, in ms */
  delay?: number;
};

export function WallCursor({ x, y, dx, dy, delay = 300 }: WallCursorProps) {
  return (
    <svg
      className="l-wall-cursor"
      viewBox="0 0 16 20"
      width="14"
      height="18"
      aria-hidden="true"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        ['--dx' as string]: `${dx}px`,
        ['--dy' as string]: `${dy}px`,
        ['--cd' as string]: `${delay}ms`,
      }}
    >
      <path className="l-wall-cursor__shape" d="M1 1 L1 15 L4.6 11.8 L7 17.5 L9.6 16.4 L7.2 10.8 L12 10.6 Z" />
    </svg>
  );
}

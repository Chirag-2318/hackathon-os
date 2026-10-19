import type { CSSProperties } from 'react';

// Decorative dashed guide lines. `verticals` are CSS `left` values, `horizontals` are CSS `top` values (measured inside the
// nearest positioned parent). Lines extend `reach` / `reachX` pixels past the block and fade out over that distance.
type BlueprintProps = {
  verticals?: string[];
  horizontals?: string[];
  reach?: number;     // how far vertical lines extend above and below the block
  reachX?: number;    // how far horizontal lines extend left and right of the block
  className?: string;
};

export function Blueprint({ verticals = [], horizontals = [], reach = 56, reachX = 120, className = '' }: BlueprintProps) {
  return (
    <div
      className={`l-bp ${className}`.trim()}
      aria-hidden="true"
      style={{ '--l-bp-reach': `${reach}px`, '--l-bp-reach-x': `${reachX}px` } as CSSProperties}
    >
      {verticals.map((left) => <span key={`v-${left}`} className="l-bp-v" style={{ left }} />)}
      {horizontals.map((top) => <span key={`h-${top}`} className="l-bp-h" style={{ top }} />)}
    </div>
  );
}

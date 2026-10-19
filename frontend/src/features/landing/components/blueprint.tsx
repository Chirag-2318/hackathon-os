import type { CSSProperties } from 'react';

// Decorative dashed guide lines. `verticals` are CSS `left` values, `horizontals` are CSS `top` values and `plus` are
// [left, top] pairs for the small "+" marks. Vertical lines reach `reach` pixels above and below the parent box.
type BlueprintProps = {
  verticals?: string[];
  horizontals?: string[];
  plus?: Array<[string, string]>;
  reach?: number;
  className?: string;
};

export function Blueprint({ verticals = [], horizontals = [], plus = [], reach = 0, className = '' }: BlueprintProps) {
  return (
    <div className={`l-bp ${className}`.trim()} aria-hidden="true" style={{ '--l-bp-reach': `${reach}px` } as CSSProperties}>
      {verticals.map((left) => <span key={`v-${left}`} className="l-bp-v" style={{ left }} />)}
      {horizontals.map((top) => <span key={`h-${top}`} className="l-bp-h" style={{ top }} />)}
      {plus.map(([left, top]) => <span key={`p-${left}-${top}`} className="l-bp-plus" style={{ left, top }} />)}
    </div>
  );
}

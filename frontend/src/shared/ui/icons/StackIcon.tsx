/**
 * StackIcon — three rounded squares offset diagonally
 * Section 4.4 #2: On nav-row hover the whole group scales to 1.08,
 * back square translates up-right, front square translates down-left.
 *
 * Fill on front squares uses --nav-icon-bg so they occlude lines behind them
 * at the correct background color.
 */
import * as React from 'react';

interface StackIconProps {
  className?: string;
  size?: number;
}

export function StackIcon({ className, size = 20 }: StackIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`stack-icon ${className ?? ''}`}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      {/* Back square (top-right) */}
      <g className="sq-back">
        <rect x="6.5" y="2.5" width="11" height="11" rx="2.5"
          fill="var(--nav-icon-bg, var(--shell))"
          stroke="currentColor"
        />
      </g>
      {/* Mid square */}
      <g className="stack-icon-group">
        <rect x="3.5" y="5.5" width="11" height="11" rx="2.5"
          fill="var(--nav-icon-bg, var(--shell))"
          stroke="currentColor"
        />
        {/* Front square (bottom-left) */}
        <g className="sq-front">
          <rect x="0.5" y="8.5" width="11" height="11" rx="2.5"
            fill="var(--nav-icon-bg, var(--shell))"
            stroke="currentColor"
          />
        </g>
      </g>
    </svg>
  );
}

/**
 * TrayArrowIcon — custom lucide-style SVG icon
 * Two separate groups so CSS can animate only the arrow.
 * Section 4.4 #1: On nav-row hover, only .icon-arrow translates up by 2px.
 */
import * as React from 'react';

interface TrayArrowIconProps {
  className?: string;
  size?: number;
}

export function TrayArrowIcon({ className, size = 20 }: TrayArrowIconProps) {
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
      className={className}
      aria-hidden="true"
    >
      {/* Tray — stays still */}
      <g className="icon-tray">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
      </g>
      {/* Arrow shaft — lifts on hover */}
      <g className="icon-arrow">
        <line x1="12" y1="15" x2="12" y2="3" />
      </g>
    </svg>
  );
}

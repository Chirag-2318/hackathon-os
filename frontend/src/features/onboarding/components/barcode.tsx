import React, { useMemo } from 'react';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Deterministic pseudo-barcode generator based on a string seed.
 */
export function Barcode({
  value,
  width = 180,
  height = 36,
  className = '',
  showText = false,
}: BarcodeProps) {
  const bars = useMemo(() => {
    const str = value || 'brackit-participant';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }

    const count = 38;
    const items: { width: number; gap: number }[] = [];
    let state = Math.abs(hash) || 12345;

    for (let i = 0; i < count; i++) {
      state = (state * 1664525 + 1013904223) >>> 0;
      const barW = (state % 3) + 1.2;
      const gapW = ((state >> 4) % 2) + 1.2;
      items.push({ width: barW, gap: gapW });
    }

    return items;
  }, [value]);

  const totalUnits = useMemo(() => {
    return bars.reduce((acc, b) => acc + b.width + b.gap, 0);
  }, [bars]);

  let currentX = 0;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalUnits} ${height}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="overflow-visible"
        aria-hidden="true"
      >
        {bars.map((bar, i) => {
          const x = currentX;
          currentX += bar.width + bar.gap;
          return (
            <rect
              key={i}
              x={x}
              y={0}
              width={bar.width}
              height={height}
              fill="currentColor"
              rx={0.5}
            />
          );
        })}
      </svg>
      {showText && (
        <span
          className="text-[9px] tracking-[0.25em] text-neutral-500 font-mono mt-1 uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {value || 'PARTICIPANT'}
        </span>
      )}
    </div>
  );
}

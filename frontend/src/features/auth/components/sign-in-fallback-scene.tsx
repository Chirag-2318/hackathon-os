import React from 'react';

/**
 * FallbackScene — SVG plus CSS monolithic architectural bracket scene.
 * Matches exact design specs: #0C0B0A bg, 56px spine/arms, 6px radius,
 * floor line at 72% with 10% reflection, radial amber glow at gap (50% x, 55% y).
 */
export function SignInFallbackScene() {
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
      style={{ backgroundColor: '#0C0B0A' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          {/* Floor reflection fade mask */}
          <linearGradient id="reflection-mask" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.10" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          <mask id="floor-fade">
            <rect x="0" y="432" width="800" height="168" fill="url(#reflection-mask)" />
          </mask>

          {/* Radial amber glow behind gap */}
          <radialGradient id="gap-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8A33D" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#E8A33D" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#E8A33D" stopOpacity="0" />
          </radialGradient>

          {/* Left bracket path with 6px fillets */}
          <path
            id="left-bracket"
            d="M 368 160
               H 264
               a 6 6 0 0 0 -6 6
               v 260
               a 6 6 0 0 0 6 6
               h 104
               a 6 6 0 0 0 6 -6
               v -44
               a 6 6 0 0 0 -6 -6
               H 320
               a 6 6 0 0 1 -6 -6
               V 228
               a 6 6 0 0 1 6 -6
               h 48
               a 6 6 0 0 0 6 -6
               v -44
               a 6 6 0 0 0 -6 -6
               Z"
          />

          {/* Right bracket path with 6px fillets */}
          <path
            id="right-bracket"
            d="M 432 160
               h 104
               a 6 6 0 0 1 6 6
               v 260
               a 6 6 0 0 1 -6 6
               H 432
               a 6 6 0 0 1 -6 -6
               v -44
               a 6 6 0 0 1 6 -6
               h 48
               a 6 6 0 0 0 6 -6
               V 228
               a 6 6 0 0 0 -6 -6
               h -48
               a 6 6 0 0 1 -6 -6
               v -44
               a 6 6 0 0 1 6 -6
               Z"
          />
        </defs>

        {/* 1. Atmospheric haze band at vertical midpoint */}
        <rect
          x="0"
          y="310"
          width="800"
          height="40"
          fill="rgba(232, 163, 61, 0.04)"
          filter="blur(16px)"
        />

        {/* 2. Radial Amber Glow at gap center (x=400, y=330 = 55% of 600) */}
        <circle
          cx="400"
          cy="330"
          r="160"
          fill="url(#gap-glow)"
          style={{ filter: 'blur(40px)' }}
        />

        {/* 3. Reflected Brackets (masked under floor) */}
        <g mask="url(#floor-fade)" transform="translate(0, 864) scale(1, -1)">
          <use href="#left-bracket" fill="#19181A" />
          <use href="#right-bracket" fill="#19181A" />
        </g>

        {/* 4. Floor line at 72% height (y=432) */}
        <line
          x1="0"
          y1="432"
          x2="800"
          y2="432"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />

        {/* 5. Left Monolith Bracket */}
        <use href="#left-bracket" fill="#19181A" />
        {/* Inner lighter highlight edge */}
        <path
          d="M 368 216 H 320 a 6 6 0 0 0 -6 6 V 370 a 6 6 0 0 0 6 6 h 48"
          fill="none"
          stroke="#2A292D"
          strokeWidth="1"
        />

        {/* 6. Right Monolith Bracket */}
        <use href="#right-bracket" fill="#19181A" />
        {/* Inner lighter highlight edge */}
        <path
          d="M 432 216 h 48 a 6 6 0 0 1 6 6 V 370 a 6 6 0 0 1 -6 6 h -48"
          fill="none"
          stroke="#2A292D"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

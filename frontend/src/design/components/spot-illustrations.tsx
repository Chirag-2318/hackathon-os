import React from 'react';
import { cn } from '@/lib/utils';

export type SpotIllustrationType =
  | 'rocket'
  | 'clipboard'
  | 'checklist'
  | 'plug'
  | 'magnifier'
  | 'flag'
  | 'bolt';

export interface SpotIllustrationProps extends React.SVGProps<SVGSVGElement> {
  name: SpotIllustrationType;
  size?: number;
  className?: string;
}

export function SpotIllustration({
  name,
  size = 48,
  className,
  ...props
}: SpotIllustrationProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: cn('shrink-0 select-none', className),
    ...props,
  };

  switch (name) {
    case 'rocket':
      return (
        <svg {...commonProps} aria-label="Rocket illustration">
          {/* Subtle soft backdrop shape */}
          <circle cx="24" cy="24" r="20" fill="var(--accent-subtle, #f0fdf4)" opacity="0.8" />
          {/* Rocket body */}
          <path
            d="M24 10C24 10 32 14 32 24C32 27 30 30 28 32L24 30L20 32C18 30 16 27 16 24C16 14 24 10 24 10Z"
            fill="var(--surface, #ffffff)"
            stroke="var(--ink, #18181b)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Window */}
          <circle cx="24" cy="19" r="3" fill="var(--accent, #3b82f6)" stroke="var(--ink, #18181b)" strokeWidth="1.5" />
          {/* Wings */}
          <path d="M16 25L10 29L16 31V25Z" fill="var(--surface-sunken, #f4f4f5)" stroke="var(--ink, #18181b)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M32 25L38 29L32 31V25Z" fill="var(--surface-sunken, #f4f4f5)" stroke="var(--ink, #18181b)" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Flame */}
          <path d="M22 32L24 38L26 32" stroke="var(--amber-500, #f59e0b)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'clipboard':
      return (
        <svg {...commonProps} aria-label="Clipboard illustration">
          <rect x="6" y="6" width="36" height="36" rx="10" fill="var(--accent-subtle, #f8fafc)" opacity="0.8" />
          {/* Board */}
          <rect x="12" y="12" width="24" height="28" rx="4" fill="var(--surface, #ffffff)" stroke="var(--ink, #18181b)" strokeWidth="2" />
          {/* Clip */}
          <path d="M19 10C19 8.9 19.9 8 21 8H27C28.1 8 29 8.9 29 10V13H19V10Z" fill="var(--surface-sunken, #e4e4e7)" stroke="var(--ink, #18181b)" strokeWidth="1.5" />
          {/* Lines */}
          <path d="M17 20H31" stroke="var(--ink-3, #a1a1aa)" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 26H28" stroke="var(--ink-3, #a1a1aa)" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 32H25" stroke="var(--ink-3, #a1a1aa)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'checklist':
      return (
        <svg {...commonProps} aria-label="Checklist illustration">
          <circle cx="24" cy="24" r="20" fill="var(--accent-subtle, #ecfdf5)" opacity="0.8" />
          {/* Card outline */}
          <rect x="11" y="9" width="26" height="30" rx="4" fill="var(--surface, #ffffff)" stroke="var(--ink, #18181b)" strokeWidth="2" />
          {/* Checkmark 1 */}
          <path d="M16 17L18.5 19.5L23 15" stroke="var(--emerald-600, #059669)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M26 17H31" stroke="var(--ink-2, #52525b)" strokeWidth="2" strokeLinecap="round" />
          {/* Checkmark 2 */}
          <path d="M16 25L18.5 27.5L23 23" stroke="var(--emerald-600, #059669)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M26 25H31" stroke="var(--ink-2, #52525b)" strokeWidth="2" strokeLinecap="round" />
          {/* Row 3 - open bullet */}
          <circle cx="18" cy="33" r="2" stroke="var(--ink-3, #a1a1aa)" strokeWidth="1.5" />
          <path d="M26 33H31" stroke="var(--ink-3, #a1a1aa)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'plug':
      return (
        <svg {...commonProps} aria-label="Plug illustration">
          <circle cx="24" cy="24" r="20" fill="var(--accent-subtle, #fef3c7)" opacity="0.8" />
          {/* Pins */}
          <path d="M20 11V18" stroke="var(--ink, #18181b)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M28 11V18" stroke="var(--ink, #18181b)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Body */}
          <rect x="16" y="18" width="16" height="14" rx="4" fill="var(--surface, #ffffff)" stroke="var(--ink, #18181b)" strokeWidth="2" />
          {/* Cable */}
          <path d="M24 32V39" stroke="var(--ink, #18181b)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'magnifier':
      return (
        <svg {...commonProps} aria-label="Magnifier illustration">
          <circle cx="24" cy="24" r="20" fill="var(--accent-subtle, #eff6ff)" opacity="0.8" />
          {/* Glass */}
          <circle cx="22" cy="21" r="9" fill="var(--surface, #ffffff)" stroke="var(--ink, #18181b)" strokeWidth="2" />
          {/* Reflection */}
          <path d="M18 17C19.5 15.5 22 15 24 16" stroke="var(--blue-400, #60a5fa)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Handle */}
          <path d="M29 28L36 35" stroke="var(--ink, #18181b)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'flag':
      return (
        <svg {...commonProps} aria-label="Flag illustration">
          <circle cx="24" cy="24" r="20" fill="var(--accent-subtle, #faf5ff)" opacity="0.8" />
          {/* Pole */}
          <path d="M16 10V38" stroke="var(--ink, #18181b)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Flag banner */}
          <path
            d="M16 12C20 10.5 25 14 30 12.5C32 12 34 13 34 13V24C34 24 31 23 29 24C24 25.5 20 22 16 23.5V12Z"
            fill="var(--purple-100, #f3e8ff)"
            stroke="var(--ink, #18181b)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'bolt':
      return (
        <svg {...commonProps} aria-label="Bolt illustration">
          <circle cx="24" cy="24" r="20" fill="var(--accent-subtle, #fffbeb)" opacity="0.8" />
          <path
            d="M26 10L14 26H24L22 38L34 22H24L26 10Z"
            fill="var(--amber-300, #fcd34d)"
            stroke="var(--ink, #18181b)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

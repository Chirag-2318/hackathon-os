import React from 'react';
import darkLogo from '../../images/dark.svg';
import lightLogo from '../../images/light.svg';
import { useTheme } from '@/components/theme-provider';
import { BRAND } from '@/brand';

export interface BrandLogoProps {
  className?: string;
  size?: number;
  collapsed?: boolean;
  onDark?: boolean;
}

export function BrandLogo({ className = '', size = 32, collapsed = false, onDark }: BrandLogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = onDark !== undefined ? onDark : resolvedTheme === 'dark';
  const logoSrc = isDark ? darkLogo : lightLogo;

  if (collapsed) {
    return (
      <div className="w-10 h-10 overflow-hidden flex items-center justify-start shrink-0">
        <img
          key={isDark ? 'dark' : 'light'}
          src={logoSrc}
          alt={BRAND.wordmark}
          className={`h-10 max-w-none object-cover object-left ${className}`}
          style={{ width: '128px' }}
          data-testid="brand-glyph"
        />
      </div>
    );
  }

  return (
    <img
      key={isDark ? 'dark' : 'light'}
      src={logoSrc}
      alt={BRAND.wordmark}
      className={`w-auto object-contain ${className}`}
      style={{ height: `${size}px` }}
      height={size}
      data-testid="brand-glyph"
    />
  );
}

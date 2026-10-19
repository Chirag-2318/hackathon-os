import type { ReactNode } from 'react';
import { useTheme } from '../../hooks/use-theme';

// Wraps static copies of the product's own screens. Inside it the screen looks exactly like the product in the current
// theme; nothing inside can be clicked, focused or read by assistive technology (a text description is provided by the
// section that uses it).
export function ProductScope({
  children,
  className = '',
  forceTheme,
}: {
  children: ReactNode;
  className?: string;
  forceTheme?: 'light' | 'dark';
}) {
  const { theme: contextTheme } = useTheme();
  const theme = forceTheme ?? contextTheme;
  const dark = theme === 'dark';
  return (
    <div
      className={`l-product-ui l-product-scope ${dark ? 'dark' : ''} ${className}`.replace(/\s+/g, ' ').trim()}
      data-product-theme={theme}
      data-theme={theme}
      aria-hidden="true"
      {...({ inert: true } as Record<string, unknown>)}
    >
      {children}
    </div>
  );
}

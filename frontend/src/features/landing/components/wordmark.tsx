import darkLogo from '../../../../images/dark.svg';
import lightLogo from '../../../../images/light.svg';

// The real [brackit] logo. `on` is the surface the logo sits on: 'dark' uses dark.svg and 'light' uses light.svg.
// If the colours turn out inverted for your backgrounds, flip SWAP_LOGOS to true (one place, nothing else changes).
const SWAP_LOGOS = false;
const LOGO_ASPECT = 7.2;

type WordmarkProps = { size?: number; on?: 'light' | 'dark'; className?: string };

export function Wordmark({ size = 24, on = 'light', className = '' }: WordmarkProps) {
  const useDark = (on === 'dark') !== SWAP_LOGOS;
  const height = size;
  return (
    <img
      className={`l-wordmark-img ${className}`.trim()}
      src={useDark ? darkLogo : lightLogo}
      alt="[brackit]"
      style={{ height: `${height}px`, width: 'auto' }}
      width={Math.round(height * LOGO_ASPECT)}
      height={height}
      decoding="async"
      draggable={false}
    />
  );
}

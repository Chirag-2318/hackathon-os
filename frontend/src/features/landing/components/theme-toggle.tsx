import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/use-theme';

// Round icon button that switches the whole landing page between the light and the dark theme.
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className={`l-theme-btn ${className}`.trim()}
      onClick={toggle}
      aria-pressed={theme === 'dark'}
      aria-label="Dark theme"
    >
      <Sun className="l-theme-sun" size={18} aria-hidden="true" />
      <Moon className="l-theme-moon" size={18} aria-hidden="true" />
    </button>
  );
}

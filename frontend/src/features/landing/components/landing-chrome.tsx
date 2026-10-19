import { useTheme } from '../hooks/use-theme';
import { ConnectedClockHud } from './clock-hud';
import { Nav } from './nav';

// The floating nav and the phone clock pill. They turn dark in the dark theme and over dark sections.
export function LandingChrome({ overDark }: { overDark: boolean }) {
  const { theme } = useTheme();
  const tone: 'light' | 'dark' = theme === 'dark' || overDark ? 'dark' : 'light';
  return (
    <>
      <Nav tone={tone} hud={<ConnectedClockHud on={tone} />} />
      <ConnectedClockHud on={tone} className="l-hud--mobile" />
    </>
  );
}

import { useHudState } from '../hooks/use-hud';
import type { HudTone } from '../hooks/use-hud';

// The small clock pill. It is purely decorative (the real information is on the page), so it is hidden from screen readers.
type ClockHudProps = {
  text: string;
  tone?: HudTone;
  on?: 'light' | 'dark';
  pulseKey?: number; // changing this number plays one ring pulse
  className?: string;
};

export function ClockHud({ text, tone = 'idle', on = 'light', pulseKey = 0, className = '' }: ClockHudProps) {
  return (
    <span className={`l-hud ${className}`.trim()} data-tone={tone} data-on={on} aria-hidden="true">
      {pulseKey > 0 ? <span key={pulseKey} className="l-hud-pulse" /> : null}
      <span className="l-hud-dot" />
      <span className="l-hud-text">{text}</span>
    </span>
  );
}

// The clock wired to the shared HUD state.
export function ConnectedClockHud({ on = 'light', className = '' }: { on?: 'light' | 'dark'; className?: string }) {
  const state = useHudState();
  return <ClockHud text={state.text} tone={state.tone} pulseKey={state.pulseKey} on={on} className={className} />;
}

import { LAUNCH } from '../../../data/stage-act';

export function LaunchScreen() {
  return (
    <div className="l-ws l-ws--launch">
      <span className="l-ws-meta">{LAUNCH.clockLabel.toUpperCase()}</span>
      <span className="l-ws-bigclock">{LAUNCH.time}</span>
      <span className="l-ws-btn l-ws-btn--ink l-ws-press">{LAUNCH.button}</span>
      <span className="l-ws-meta">{LAUNCH.note}</span>
    </div>
  );
}

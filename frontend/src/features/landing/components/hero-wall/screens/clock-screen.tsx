import { DEMO_CLOCK_START } from '../../../data/hero-demo';

export function ClockScreen() {
  return (
    <div className="l-ws l-ws--clock">
      <span className="l-ws-clockface">{DEMO_CLOCK_START}</span>
      <div className="l-ws-rail">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
    </div>
  );
}

import { LAUNCH } from '../../data/stage-act';

// The red SUBMITTED stamp. The SVG filter knocks small gaps out of the stamp so it reads as ink. To tune it: the last
// number in `values` (-7.5) sets how many gaps there are; -6.5 gives fewer, -8.5 gives more.
export function StageStamp({ show }: { show: boolean }) {
  return (
    <>
      <svg className="l-stamp-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="l-stamp-ink" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 25 -7.5" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="in" />
        </filter>
      </svg>
      {show ? (
        <div className="l-stamp" role="img" aria-label={LAUNCH.stamp}>
          <span className="l-stamp-ripple" aria-hidden="true" />
          <span className="l-stamp-face" aria-hidden="true">{LAUNCH.stamp}</span>
        </div>
      ) : null}
    </>
  );
}

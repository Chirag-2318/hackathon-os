import { MousePointer2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import { LAUNCH } from '../../data/stage-act';

type LaunchPhase = 'idle' | 'pressed' | 'stamped';

interface LaunchSceneProps {
  time?: string;
  phase?: LaunchPhase;
  submitted?: boolean; // backwards compatibility
  armed?: boolean; // show the demo cursor moving to the button
  onMark?: () => void; // pressing the button
}

export function LaunchScene({
  time = LAUNCH.time,
  phase: phaseProp,
  submitted = false,
  armed = false,
  onMark,
}: LaunchSceneProps) {
  const phase: LaunchPhase = phaseProp ?? (submitted ? 'stamped' : 'idle');
  const parts = time.split(':');
  const canPress = Boolean(onMark) && phase === 'idle';

  return (
    <div className="l-launch" data-phase={phase} data-submitted={phase === 'stamped' ? 'true' : 'false'}>
      {/* The ink filter that knocks small gaps out of the stamp. To tune it: the last number in `values`
          (-7.5) sets how many gaps there are; -6.5 gives fewer gaps, -8.5 gives more. */}
      <svg className="l-stamp-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="l-stamp-ink" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 25 -7.5"
            result="holes"
          />
          <feComposite in="SourceGraphic" in2="holes" operator="in" />
        </filter>
      </svg>

      <p className="l-launch__label l-launch-label">{LAUNCH.clockLabel}</p>
      <p className="l-launch__clock l-launch-clock" aria-label={time}>
        {parts.map((part, index) => (
          <span key={index} aria-hidden="true">
            {index > 0 ? <span className="l-colon">:</span> : null}
            {part}
          </span>
        ))}
      </p>

      <div className="l-launch__zone">
        <div className="l-launch__ask">
          <p className="l-launch__lead l-launch-line">{LAUNCH.line}</p>
          <div className="l-launch-action">
            <button
              type="button"
              className="l-launch__button l-launch-btn"
              onClick={() => {
                if (canPress) onMark?.();
              }}
              aria-disabled={!canPress}
              tabIndex={canPress ? 0 : -1}
            >
              {LAUNCH.button}
            </button>
            {armed && phase === 'idle' ? (
              <span className="l-launch-cursor" aria-hidden="true">
                <MousePointer2 size={20} fill="currentColor" />
              </span>
            ) : null}
          </div>
          <p className="l-launch__note l-launch-note">{LAUNCH.note}</p>
        </div>

        <div className="l-launch__stampbox" aria-hidden="true">
          <div className="l-stamp" role="img" aria-label={LAUNCH.stamp}>
            <span className="l-stamp-ripple" aria-hidden="true" />
            <span className="l-stamp-face" aria-hidden="true">
              {LAUNCH.stamp}
            </span>
          </div>
        </div>
      </div>

      <p className="l-launch__margin l-launch-result">{LAUNCH.result}</p>

      <div className="l-launch__timeline l-miles-wrap" aria-live="polite">
        <ol className="l-miles">
          {LAUNCH.milestones.map((label, index) => (
            <li key={label} className="l-mile" style={{ '--l-i': index } as CSSProperties}>
              <span className="l-mile-dot" aria-hidden="true" />
              <span className="l-mile-label">{label}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

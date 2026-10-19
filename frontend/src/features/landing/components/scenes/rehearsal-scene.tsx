import { REHEARSAL } from '../../data/stage-act';
import { Waveform } from '../waveform';

interface RehearsalSceneProps {
  current?: number;
  segment?: number;
  level?: number;
  phase?: number;
  animate?: boolean;
}

export function RehearsalScene({
  current = 2,
  segment = 1,
  level = 1,
  phase = 0,
  animate = false,
}: RehearsalSceneProps) {
  return (
    <div className="l-rehearsal">
      <ol className="l-prompter">
        {REHEARSAL.lines.map((line, index) => (
          <li
            key={line}
            className="l-prompter-line"
            data-current={index === current ? 'true' : 'false'}
          >
            {line}
          </li>
        ))}
      </ol>
      <div className="l-mic">
        <p className="l-mic-label">{REHEARSAL.micLabel}</p>
        <Waveform level={level} phase={phase} animate={animate} />
        <div className="l-run">
          <div className="l-run-strip" aria-hidden="true">
            {REHEARSAL.segments.map((item, index) => (
              <span
                key={item.label}
                className="l-run-seg"
                data-current={index === segment ? 'true' : 'false'}
                style={{ flexGrow: item.seconds }}
              />
            ))}
          </div>
          <ul className="l-run-legend">
            {REHEARSAL.segments.map((item, index) => (
              <li
                key={item.label}
                data-current={index === segment ? 'true' : 'false'}
              >
                {`${item.label} ${item.time}`}
              </li>
            ))}
          </ul>
          <p className="l-run-readout l-tnum">{REHEARSAL.readout}</p>
        </div>
      </div>
    </div>
  );
}

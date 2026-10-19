import type { CSSProperties, ReactNode } from 'react';
import type { DoorId } from '../data/doors';

// Small decorative illustrations for the three starting points. All sample content, aria-hidden by the card.
const PICKER_ROWS: { name: string; time: string; selected?: boolean }[] = [
  { name: 'Smart India Hackathon', time: '36 h', selected: true },
  { name: 'Devpost online event', time: '48 h' },
  { name: 'MLH weekend sprint', time: '36 h' },
];

const MINI_RINGS: [string, number][] = [['36 h', 36], ['48 h', 48], ['4 h', 4], ['24 h', 24]];

export const DOOR_VISUALS: Record<DoorId, ReactNode> = {
  prep: (
    <>
      {PICKER_ROWS.map((row) => (
        <div key={row.name} className="l-pk-row" data-selected={row.selected ? 'true' : undefined}>
          <span>{row.name}</span>
          <span className="l-pk-time">{row.time}</span>
        </div>
      ))}
    </>
  ),
  live: (
    <>
      <div className="l-lv-top">
        <span className="l-lv-label"><span className="l-live-dot" />Live</span>
        <span className="l-lv-sample">Example</span>
      </div>
      <p className="l-lv-clock">T–31<span className="l-colon">:</span>12<span className="l-colon">:</span>08</p>
      <div className="l-lv-bar"><span /></div>
      <p className="l-lv-note">Plan: 3 of 4 steps</p>
    </>
  ),
  explore: (
    <div className="l-mr-grid">
      {MINI_RINGS.map(([label, hours]) => (
        <div key={label} className="l-mr-item">
          <span className="l-mini-ring" style={{ '--p': Math.round((hours / 48) * 100) } as CSSProperties} />
          {label}
        </div>
      ))}
    </div>
  ),
};

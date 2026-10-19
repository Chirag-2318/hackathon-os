import type { ReactNode } from 'react';
import { Check, Lock, Tag } from 'lucide-react';
import { Bracket } from './bracket';
import type { RoomVisualKey } from '../data/room-grid';

function BriefVisual() {
  return (
    <div className="l-rv l-rv--brief" aria-hidden="true">
      <span className="l-rv-check"><Check size={12} strokeWidth={3} /></span>
      <span className="l-rv-hl"><Bracket side="left" arm={6} stroke={2} /><span className="l-rv-bar" /><Bracket side="right" arm={6} stroke={2} /></span>
    </div>
  );
}

const AXES = 7;
const CENTER = 40;
const RADIUS = 32;
const point = (index: number, scale: number) => {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / AXES;
  return `${(CENTER + Math.cos(angle) * RADIUS * scale).toFixed(1)},${(CENTER + Math.sin(angle) * RADIUS * scale).toFixed(1)}`;
};
const ring = (scale: number) => Array.from({ length: AXES }, (_, index) => point(index, scale)).join(' ');
const TEAM_VALUES = [0.9, 0.6, 0.8, 0.5, 0.7, 0.85, 0.55];

function TeamVisual() {
  return (
    <div className="l-rv l-rv--team" aria-hidden="true">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <polygon points={ring(1)} className="l-rv-grid" />
        <polygon points={ring(0.5)} className="l-rv-grid" />
        <polygon points={TEAM_VALUES.map((value, index) => point(index, value)).join(' ')} className="l-rv-area" />
      </svg>
    </div>
  );
}

function IdeateVisual() {
  return (
    <div className="l-rv l-rv--ideate" aria-hidden="true">
      <span className="l-rv-card" />
      <span className="l-rv-card l-rv-card--locked"><Lock size={12} /></span>
      <span className="l-rv-card" />
    </div>
  );
}

const DOC_WIDTHS = [92, 70, 84, 60, 78, 66, 88, 54, 72];

function DocsVisual() {
  return (
    <div className="l-rv l-rv--docs" aria-hidden="true">
      {DOC_WIDTHS.map((width, index) => (
        <span key={index} className="l-rv-doc" style={{ width: `${width}%` }} />
      ))}
    </div>
  );
}

const BOARD_LANES = [2, 1, 2];

function BoardVisual() {
  return (
    <div className="l-rv l-rv--board" aria-hidden="true">
      {BOARD_LANES.map((count, lane) => (
        <div key={lane} className="l-rv-lane">
          {Array.from({ length: count }, (_, item) => {
            const locked = lane === 1 && item === 0;
            return (
              <span key={item} className="l-rv-item" data-locked={locked ? 'true' : undefined}>
                {locked ? <Lock size={10} /> : null}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const LEDGER_MIX: [string, number][] = [['built', 2], ['existing', 1], ['mocked', 2], ['planned', 1]];

function LedgerVisual() {
  return (
    <div className="l-rv l-rv--ledger" aria-hidden="true">
      <div className="l-ledger-bar">
        {LEDGER_MIX.map(([status, grow]) => (
          <span key={status} className="l-ledger-seg" data-status={status} style={{ flexGrow: grow }} />
        ))}
      </div>
    </div>
  );
}

function TechVisual() {
  return (
    <div className="l-rv l-rv--tech" aria-hidden="true">
      <svg width="160" height="44" viewBox="0 0 200 44">
        <path d="M4 32H196" className="l-rv-line" />
        <path d="M60 32C80 32 80 12 100 12H150" className="l-rv-line l-rv-line--ink" />
        <circle cx="4" cy="32" r="4" className="l-rv-dot" />
        <circle cx="60" cy="32" r="4" className="l-rv-dot" />
        <circle cx="100" cy="12" r="4" className="l-rv-dot" />
        <circle cx="150" cy="12" r="4" className="l-rv-dot l-rv-dot--ink" />
      </svg>
      <span className="l-rv-tag"><Tag size={11} />frozen</span>
    </div>
  );
}

const WAVE_HEIGHTS = [10, 22, 16, 34, 24, 40, 28, 18, 36, 20, 12, 26];

function PresentVisual() {
  return (
    <div className="l-rv l-rv--present" aria-hidden="true">
      {WAVE_HEIGHTS.map((height, index) => (
        <span key={index} className="l-rv-wave" style={{ height: `${height}px` }} />
      ))}
    </div>
  );
}

const MINI_SIZE = 26;
const MINI_STROKE = 3;
const MINI_RADIUS = (MINI_SIZE - MINI_STROKE) / 2;
const MINI_CIRCUMFERENCE = 2 * Math.PI * MINI_RADIUS;
const MINI_VALUES = [100, 92, 100, 100, 100, 76];

function RingsVisual() {
  return (
    <div className="l-rv l-rv--rings" aria-hidden="true">
      {MINI_VALUES.map((value, index) => (
        <svg key={index} width={MINI_SIZE} height={MINI_SIZE} viewBox={`0 0 ${MINI_SIZE} ${MINI_SIZE}`}>
          <circle cx={MINI_SIZE / 2} cy={MINI_SIZE / 2} r={MINI_RADIUS} fill="none" className="l-rv-ring-track" strokeWidth={MINI_STROKE} />
          <circle
            cx={MINI_SIZE / 2}
            cy={MINI_SIZE / 2}
            r={MINI_RADIUS}
            fill="none"
            className="l-rv-ring-progress"
            strokeWidth={MINI_STROKE}
            strokeLinecap="round"
            strokeDasharray={MINI_CIRCUMFERENCE}
            strokeDashoffset={MINI_CIRCUMFERENCE * (1 - value / 100)}
            transform={`rotate(-90 ${MINI_SIZE / 2} ${MINI_SIZE / 2})`}
          />
        </svg>
      ))}
    </div>
  );
}

export const ROOM_VISUALS: Record<RoomVisualKey, ReactNode> = {
  brief: <BriefVisual />,
  team: <TeamVisual />,
  ideate: <IdeateVisual />,
  docs: <DocsVisual />,
  board: <BoardVisual />,
  ledger: <LedgerVisual />,
  tech: <TechVisual />,
  present: <PresentVisual />,
  readiness: <RingsVisual />,
};

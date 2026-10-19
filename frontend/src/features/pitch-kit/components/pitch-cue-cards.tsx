import React from 'react';
import type { PitchBeat } from '../api/pitch-kit-api';

export interface PitchCueCardsProps {
  beats: PitchBeat[];
  members: any[];
}

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PitchCueCards({ beats, members }: PitchCueCardsProps) {
  const memberMap = React.useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => {
      const name = m.name || m.displayName || m.username || 'Member';
      if (m.id) map.set(m.id, name);
      if (m.userId) map.set(m.userId, name);
    });
    return map;
  }, [members]);

  let cumulative = 0;

  return (
    <div className="hidden print:block print:w-full print:m-0 print:p-0">
      <style>{`
        @media print {
          @page {
            size: A5 landscape;
            margin: 12mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .cue-card-page {
            page-break-after: always;
            break-after: page;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-family: system-ui, sans-serif;
            padding: 10px;
            box-sizing: border-box;
          }
        }
      `}</style>

      {beats.map((beat, i) => {
        const start = cumulative;
        cumulative += beat.durationSec;
        const speakerName = beat.speakerUserId ? memberMap.get(beat.speakerUserId) : null;

        return (
          <div key={beat.id} className="cue-card-page">
            {/* Header: Title, Speaker and Time */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-gray-600 block">
                  Beat {i + 1} of {beats.length}
                </span>
                <h1 className="text-xl font-bold text-black">{beat.title}</h1>
              </div>

              <div className="text-right font-mono text-sm">
                <div className="font-bold text-black">
                  {fmtSec(start)} - {fmtSec(cumulative)} ({fmtSec(beat.durationSec)})
                </div>
                {speakerName && <div className="text-gray-700">@{speakerName}</div>}
              </div>
            </div>

            {/* SAY text (large) */}
            <div className="my-auto py-4">
              <p className="text-2xl leading-relaxed text-black font-serif font-normal">
                {beat.say || '(No script)'}
              </p>
            </div>

            {/* SHOW and CUE (small) */}
            <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-2 text-xs">
              <div>
                <span className="font-mono font-bold uppercase tracking-wider text-gray-700 block">
                  SHOW:
                </span>
                <p className="text-gray-900 mt-0.5">
                  {beat.show || '(Standard slides)'}
                  {beat.slideRef ? ` [${beat.slideRef}]` : ''}
                </p>
              </div>

              <div>
                <span className="font-mono font-bold uppercase tracking-wider text-gray-700 block">
                  CUE:
                </span>
                <p className="text-gray-900 mt-0.5">{beat.cue || '(None)'}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

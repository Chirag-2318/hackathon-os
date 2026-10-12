import React from 'react';

export type ExperienceLevel = 'FIRST' | 'LOW' | 'MID' | 'HIGH';

const STOPS: { id: ExperienceLevel; label: string; caption: string; badge: string }[] = [
  {
    id: 'FIRST',
    label: 'First one',
    caption: 'Zero baggage, fresh eyes, ready to ship your very first hackathon demo.',
    badge: 'Rookie',
  },
  {
    id: 'LOW',
    label: '1 – 3',
    caption: 'Knows that Red Bull at 3am is a trap, but might do it anyway.',
    badge: 'Regular',
  },
  {
    id: 'MID',
    label: '4 – 10',
    caption: 'Deploys to production 20 minutes before the clock with a steady pulse.',
    badge: 'Veteran',
  },
  {
    id: 'HIGH',
    label: '10+',
    caption: 'Has an emotional bond with the timer, remembers hackathons in VHS quality.',
    badge: 'Legend',
  },
];

export interface StepMilesTrackProps {
  value?: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
}

export function StepMilesTrack({ value = 'FIRST', onChange }: StepMilesTrackProps) {
  const currentIndex = Math.max(
    0,
    STOPS.findIndex((s) => s.id === value)
  );

  return (
    <div className="w-full flex flex-col gap-8 select-none py-2">
      {/* ── Stepped Track Container ── */}
      <div className="relative flex flex-col px-4">
        {/* Track Line */}
        <div className="relative h-2 bg-neutral-200 rounded-full my-4">
          <div
            className="absolute left-0 top-0 bottom-0 bg-neutral-900 rounded-full transition-all duration-200"
            style={{ width: `${(currentIndex / (STOPS.length - 1)) * 100}%` }}
          />

          {/* Stepped Dots */}
          <div className="absolute inset-0 flex justify-between items-center -top-1.5 -bottom-1.5">
            {STOPS.map((stop, i) => {
              const isPassed = i <= currentIndex;
              const isSelected = i === currentIndex;

              return (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => onChange(stop.id)}
                  className={`size-5 rounded-full border-2 transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 border-neutral-900 ring-4 ring-neutral-900/10 scale-125'
                      : isPassed
                      ? 'bg-neutral-900 border-neutral-900'
                      : 'bg-white border-neutral-300 hover:border-neutral-500'
                  }`}
                  aria-label={stop.label}
                />
              );
            })}
          </div>
        </div>

        {/* Labels Below Track */}
        <div className="flex justify-between items-center text-xs font-semibold text-neutral-600 mt-2">
          {STOPS.map((stop, i) => (
            <button
              key={stop.id}
              type="button"
              onClick={() => onChange(stop.id)}
              className={`transition-colors cursor-pointer text-center ${
                i === currentIndex
                  ? 'text-neutral-900 font-bold'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {stop.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Witty Crossfading Caption ── */}
      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 min-h-[72px] flex items-center">
        <p className="text-sm text-neutral-700 italic leading-relaxed">
          "{STOPS[currentIndex]?.caption}"
        </p>
      </div>
    </div>
  );
}

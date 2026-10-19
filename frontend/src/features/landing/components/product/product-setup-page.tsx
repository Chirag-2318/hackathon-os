import type { CSSProperties } from 'react';
import { Sparkles, Clock, Users, ArrowRight, Calendar } from 'lucide-react';
import { SETUP_FIXTURE } from '../../data/product-fixtures';

// Copied and adapted from:
// - frontend/src/features/onboarding/create-room-wizard.tsx
// Chosen: CreateRoomWizard (the product's dedicated room setup and playbook/template selection flow).

export function ProductSetupPage() {
  const { templates, selectedTemplateId } = SETUP_FIXTURE;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-shell text-ink w-full min-h-[640px]">
      <div
        className="w-full max-w-[620px] p-8 rounded-[20px] bg-card border border-border shadow-xl space-y-6"
      >
        {/* Header */}
        <div className="l-ps-rise" style={{ '--l-i': 0 } as CSSProperties}>
          <div className="text-2xl font-bold tracking-tight text-ink font-sans">
            {SETUP_FIXTURE.title}
          </div>
          <p className="text-xs text-ink-2 mt-1">
            {SETUP_FIXTURE.subtitle}
          </p>
        </div>

        {/* 1. Room Name & Event Details Block */}
        <div
          data-callout="Room details"
          className="l-ps-rise space-y-3 p-3.5 rounded-[14px] bg-surface/50 border border-border/80"
          style={{ '--l-i': 1 } as CSSProperties}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">
                Room Name <span className="text-rose-500">*</span>
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <Sparkles className="size-3 text-blue-600 dark:text-blue-400" />
                <span>Suggest a name</span>
              </div>
            </div>

            <div className="w-full h-10 px-3.5 rounded-[12px] border border-border bg-card text-sm text-ink flex items-center font-medium">
              {SETUP_FIXTURE.roomName}
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-[11px] font-medium text-ink-2 block">
              Event & Track Details
            </span>
            <div className="w-full px-3.5 py-2 rounded-[12px] border border-border/60 bg-card text-xs text-ink-2 flex items-center justify-between">
              <span>{SETUP_FIXTURE.description}</span>
              <span className="text-[10px] font-mono text-ink-3">Team size: {SETUP_FIXTURE.teamSize}</span>
            </div>
          </div>
        </div>

        {/* 2. Event Template Visual 2x3 Card Picker */}
        <div
          className="l-ps-rise space-y-2"
          style={{ '--l-i': 2 } as CSSProperties}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">
              Event Template
            </span>
            <span className="text-[11px] font-mono text-ink-3">
              36h hackathon selected
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {templates.slice(0, 6).map((tpl, idx) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  {...(isSelected ? { 'data-callout': 'Playbook' } : {})}
                  className={`l-ps-rise p-3 rounded-[14px] border text-left flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-surface border-border'
                  }`}
                  style={{ '--l-i': 3 + idx } as CSSProperties}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[13px] font-bold text-ink leading-snug truncate">
                        {tpl.name}
                      </p>
                      {isSelected && (
                        <span className="size-1.5 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-ink-3 line-clamp-1 mt-0.5">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-[10px] font-mono text-ink-2">
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="size-3 text-ink-3" />
                      <span>{tpl.durationHours}h</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Users className="size-3 text-ink-3" />
                      <span>{tpl.teamMin}–{tpl.teamMax}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Schedule Start Time */}
        <div
          className="l-ps-rise space-y-2 pt-1"
          style={{ '--l-i': 9 } as CSSProperties}
        >
          <div className="flex items-center justify-between p-3 rounded-[12px] bg-surface border border-border">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-card border border-border flex items-center justify-center text-ink-2 shrink-0">
                <Calendar className="size-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Schedule Start Time</p>
                <p className="text-[11px] text-ink-3 font-mono">
                  {SETUP_FIXTURE.kickoffTime}
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full text-xs font-medium border bg-blue-600 text-white border-blue-600">
              Scheduled
            </div>
          </div>
        </div>

        {/* 4. Action bar */}
        <div
          className="l-ps-rise pt-3 border-t border-border/60 flex items-center justify-between"
          style={{ '--l-i': 10 } as CSSProperties}
        >
          <div className="px-4 py-2 text-xs font-semibold text-ink-2">
            Cancel
          </div>

          <div className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-xs">
            <span>Create room</span>
            <ArrowRight className="size-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { ArrowRight, Compass, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GhostPassport: React.FC = () => {
  return (
    <div className="space-y-8 pb-14">
      {/* Unfilled Stat Strip with 0s - matches real StatStrip design token layout */}
      <div className="border-t border-b border-border bg-card/40 py-4 px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="flex flex-col px-4 py-2 first:pl-0 last:pr-0">
            <span className="font-mono text-[32px] font-normal tracking-tight text-muted-foreground/40 leading-none">
              0
            </span>
            <span className="text-[12px] text-muted-foreground mt-1.5">
              Hackathons joined
            </span>
          </div>
          <div className="flex flex-col px-4 py-2 first:pl-0 last:pr-0">
            <span className="font-mono text-[32px] font-normal tracking-tight text-muted-foreground/40 leading-none">
              0
            </span>
            <span className="text-[12px] text-muted-foreground mt-1.5">
              Projects shipped
            </span>
          </div>
          <div className="flex flex-col px-4 py-2 first:pl-0 last:pr-0">
            <span className="font-mono text-[32px] font-normal tracking-tight text-muted-foreground/40 leading-none">
              0
            </span>
            <span className="text-[12px] text-muted-foreground mt-1.5">
              Tasks completed
            </span>
          </div>
          <div className="flex flex-col px-4 py-2 first:pl-0 last:pr-0">
            <span className="font-mono text-[32px] font-normal tracking-tight text-muted-foreground/40 leading-none">
              0
            </span>
            <span className="text-[12px] text-muted-foreground mt-1.5">
              Teams led
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 sm:px-6">
        <div>
          <h2 className="text-[22px] font-display font-normal tracking-tight text-foreground flex items-center gap-2">
            <span>Hackathon Passport</span>
            <span className="font-mono text-xs text-muted-foreground">(0 stamps)</span>
          </h2>
          <p className="text-xs text-muted-foreground">Chronological passport records for every room joined</p>
        </div>

        {/* 3 Dashed, Perforated Empty Stamps matching real PassportTimeline cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="group relative flex flex-col justify-between overflow-hidden rounded-[14px] border border-dashed border-border-strong bg-card/60 p-5 min-h-[170px] transition-colors"
            >
              {/* Ticket-stub perforated circular notches on left & right edge using background token */}
              <div className="absolute -left-2.5 top-1/2 -mt-2.5 h-5 w-5 rounded-full bg-background border border-border-strong" />
              <div className="absolute -right-2.5 top-1/2 -mt-2.5 h-5 w-5 rounded-full bg-background border border-border-strong" />

              <div className="space-y-2.5 px-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    STAMP #{num}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/80 uppercase tracking-wider px-2 py-0.5 rounded border border-border/80 bg-muted/40">
                    AWAITING MISSION
                  </span>
                </div>
                <div className="h-4 w-32 rounded bg-muted/60" />
                <div className="h-3 w-48 rounded bg-muted/40" />
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-border px-1">
                <span className="text-[11px] font-mono text-muted-foreground">
                  Your first build will be stamped here
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Human, Encouraging CTA Card */}
      <div className="px-4 sm:px-6">
        <div className="rounded-[16px] border border-border bg-card p-8 text-center max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
              <Compass className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-display font-medium text-foreground tracking-tight">
              Your builder passport is waiting for its first stamp
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
              Every room you join, task you complete, and project you submit will automatically craft your case studies, milestone medals, and verified timeline.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/app/create-room"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create a room</span>
            </Link>
            <Link
              to="/app/home"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface text-foreground hover:bg-hover px-5 py-2.5 text-xs font-medium transition-colors"
            >
              <span>Explore live events</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

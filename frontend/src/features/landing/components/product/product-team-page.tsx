import type { CSSProperties } from 'react';
import { Crown, MoreHorizontal, UserPlus } from 'lucide-react';
import { TEAM_FIXTURE } from '../../data/product-fixtures';

// Copied and adapted from:
// - frontend/src/features/team/team-page.tsx

export function ProductTeamPage() {
  const { members, filledSeats, roomCap, openSeatsCount, allRoles, coveredRoles, skillSummary } = TEAM_FIXTURE;

  return (
    <div className="w-full max-w-[880px] mx-auto p-8 font-sans pb-16">
      {/* 1. Page Header */}
      <div
        className="l-ps-rise flex items-center justify-between gap-4 pb-6 border-b border-border/60"
        style={{ '--l-i': 0 } as CSSProperties}
      >
        <div>
          <div
            className="text-4xl font-normal tracking-tight text-foreground leading-none"
            style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
          >
            {TEAM_FIXTURE.title}
          </div>
          <p
            className="text-xs font-mono text-muted-foreground mt-2 tracking-wide"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            {filledSeats} of {roomCap} seats filled
          </p>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs">
            <UserPlus className="size-3.5" />
            <span>Invite</span>
          </div>
        </div>
      </div>

      {/* 2. Members & Open Seats List */}
      <div
        data-callout="Roles"
        className="divide-y divide-border/60 mt-2"
      >
        {members.map((m, idx) => {
          const roleTagsText = m.roleTags.join(' · ');

          return (
            <div
              key={m.id}
              className="l-ps-rise min-h-[56px] py-2.5 flex items-center justify-between gap-3 px-1 transition-colors rounded-lg"
              style={{ '--l-i': 1 + idx } as CSSProperties}
            >
              {/* Left: Avatar, Username, Role Tags, Leader Badge */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className="size-9 rounded-full flex items-center justify-center font-bold text-xs border border-border text-ink-strong"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </div>
                  {m.isOnline && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
                      title="Online"
                    />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      @{m.username}
                    </span>
                    {m.isLeader && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                        <Crown className="size-3" /> Leader
                      </span>
                    )}
                  </div>

                  {roleTagsText && (
                    <span className="text-xs text-muted-foreground truncate mt-0.5">
                      {roleTagsText}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Joined Date & Row action */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="text-xs font-mono text-muted-foreground"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {m.joinedText}
                </span>

                {m.isMe ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                      You
                    </span>
                    <span className="text-xs text-muted-foreground underline underline-offset-2">
                      Edit profile
                    </span>
                  </div>
                ) : (
                  <div className="size-8 rounded-md flex items-center justify-center text-muted-foreground">
                    <MoreHorizontal className="size-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 3. Open Seats (Dashed Hairline Rows) */}
        {Array.from({ length: openSeatsCount }).map((_, idx) => (
          <div
            key={`open-${idx}`}
            className="l-ps-rise h-14 flex items-center justify-between px-1 border-b border-dashed border-border/60"
            style={{ '--l-i': 5 + idx } as CSSProperties}
          >
            <span className="text-sm text-muted-foreground font-normal">
              Open seat
            </span>
            <span className="text-xs text-muted-foreground underline underline-offset-2">
              Invite someone
            </span>
          </div>
        ))}
      </div>

      {/* 4. Skill-Gap Meter / Role Coverage Line */}
      <div
        data-callout="Skill-gap meter"
        className="l-ps-rise pt-6"
        style={{ '--l-i': 7 } as CSSProperties}
      >
        <div className="p-4 rounded-[14px] bg-card border border-border space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span>Skill-Gap Meter</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              7 core roles
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {allRoles.map((role) => {
                const covered = (coveredRoles as readonly string[]).includes(role);
                return (
                  <span key={role} className="inline-flex items-center gap-1.5">
                    <span
                      className={`size-2 rounded-full shrink-0 ${
                        covered
                          ? 'bg-foreground'
                          : 'border border-muted-foreground/60 bg-transparent'
                      }`}
                    />
                    <span className={covered ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {role}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          <div
            className="text-muted-foreground font-mono text-[11px] pt-1 border-t border-border/60"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            {skillSummary}
          </div>
        </div>
      </div>
    </div>
  );
}

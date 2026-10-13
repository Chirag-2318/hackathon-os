import * as React from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/components/ui/user-avatar';
import { format } from 'date-fns';

export interface DailyActivity {
  date: string;
  count: number;
}

export interface PassportData {
  level: string;
  nextLevelIn?: number | null;
  hackathonsCompleted: number;
  tasksConfirmed: number;
  ideasApproved: number;
  streakDays: number;
  activity: DailyActivity[];
}

interface PassportSectionProps {
  passport?: PassportData | null;
  userSummary?: {
    id?: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
    login?: string;
  } | null;
}

function getLevelColor(count: number): string {
  if (count <= 0) return 'bg-black/[0.05] dark:bg-white/[0.08]';
  if (count === 1) return 'bg-[#E8A33D]/25';
  if (count === 2) return 'bg-[#E8A33D]/50';
  if (count === 3) return 'bg-[#E8A33D]/75';
  return 'bg-[#E8A33D]';
}

function getNextLevelName(currentLevel: string): string {
  switch (currentLevel.toLowerCase()) {
    case 'rookie':
      return 'Regular';
    case 'regular':
      return 'Veteran';
    case 'veteran':
      return 'Legend';
    default:
      return 'Legend';
  }
}

export function PassportSection({ passport, userSummary }: PassportSectionProps) {
  if (!passport) return null;

  const username = userSummary?.username || userSummary?.login || 'builder';
  const levelText = React.useMemo(() => {
    const lvl = passport.level || 'Rookie';
    if (lvl.toLowerCase() === 'legend' || passport.nextLevelIn == null) {
      return lvl;
    }
    const nextName = getNextLevelName(lvl);
    return `${lvl} · ${passport.nextLevelIn} more to ${nextName}`;
  }, [passport.level, passport.nextLevelIn]);

  // Organize 84 days into 12 columns of 7 days
  const activityCols = React.useMemo(() => {
    const list = passport.activity || [];
    // Ensure we have 84 items
    const padded = [...list];
    while (padded.length < 84) {
      padded.unshift({ date: '', count: 0 });
    }
    const cols: DailyActivity[][] = [];
    for (let c = 0; c < 12; c++) {
      cols.push(padded.slice(c * 7, (c + 1) * 7));
    }
    return cols;
  }, [passport.activity]);

  return (
    <section className="flex flex-col gap-5">
      {/* Title */}
      <h2
        className="text-[20px] font-normal leading-tight text-foreground"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Passport
      </h2>

      {/* User row */}
      <div className="flex items-center gap-3">
        <UserAvatar
          user={{
            name: userSummary?.name,
            avatarUrl: userSummary?.avatarUrl,
            username: userSummary?.username || userSummary?.login,
          }}
          size={48}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-medium text-foreground truncate">
            @{username}
          </span>
          <span className="text-[13px] text-muted-foreground truncate">
            {levelText}
          </span>
        </div>
      </div>

      {/* 3 Stat columns separated by hairlines */}
      <div className="grid grid-cols-3 divide-x divide-black/[0.08] dark:divide-white/[0.08] border-y border-black/[0.08] dark:border-white/[0.08] py-2.5">
        <div className="flex flex-col px-2 first:pl-0">
          <span
            className="text-[28px] font-normal leading-none tabular-nums text-foreground"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {passport.hackathonsCompleted}
          </span>
          <span className="text-[12px] text-muted-foreground mt-1 leading-tight">
            Hackathons done
          </span>
        </div>

        <div className="flex flex-col px-2">
          <span
            className="text-[28px] font-normal leading-none tabular-nums text-foreground"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {passport.tasksConfirmed}
          </span>
          <span className="text-[12px] text-muted-foreground mt-1 leading-tight">
            Tasks confirmed
          </span>
        </div>

        <div className="flex flex-col px-2 last:pr-0">
          <span
            className="text-[28px] font-normal leading-none tabular-nums text-foreground"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {passport.ideasApproved}
          </span>
          <span className="text-[12px] text-muted-foreground mt-1 leading-tight">
            Ideas approved
          </span>
        </div>
      </div>

      {/* 12-week heatmap */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span>Last 12 weeks</span>
          {passport.streakDays >= 2 && (
            <span className="text-[#E8A33D] font-medium tabular-nums">
              {passport.streakDays}-day streak
            </span>
          )}
        </div>

        <div className="flex gap-[3px] p-0 overflow-x-auto select-none">
          {activityCols.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-[3px] shrink-0">
              {col.map((item, rowIdx) => {
                const formattedDate = item.date
                  ? format(new Date(item.date), 'MMM d, yyyy')
                  : '';
                const tooltipText = item.date
                  ? `${item.count} contribution${item.count === 1 ? '' : 's'} on ${formattedDate}`
                  : '';

                return (
                  <div
                    key={rowIdx}
                    title={tooltipText}
                    className={`size-[10px] rounded-[4px] transition-colors duration-150 ${getLevelColor(item.count)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground pt-0.5">
          <span>Less</span>
          <span className="size-[8px] rounded-[2px] bg-black/[0.05] dark:bg-white/[0.08]" />
          <span className="size-[8px] rounded-[2px] bg-[#E8A33D]/25" />
          <span className="size-[8px] rounded-[2px] bg-[#E8A33D]/50" />
          <span className="size-[8px] rounded-[2px] bg-[#E8A33D]/75" />
          <span className="size-[8px] rounded-[2px] bg-[#E8A33D]" />
          <span>More</span>
        </div>
      </div>

      {/* Footer link */}
      <div>
        <Link
          to="/app/portfolio"
          className="text-[13px] font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Open portfolio
        </Link>
      </div>
    </section>
  );
}

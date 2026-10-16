import React from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/components/ui/user-avatar';

export interface ActivityEntryData {
  id: string;
  userId?: string;
  memberName: string;
  avatarUrl?: string;
  action: string;
  object: string;
  relativeTime: string;
}

export interface OverviewRecentActivityProps {
  roomId: string;
  activities: ActivityEntryData[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function OverviewRecentActivity({
  roomId,
  activities,
  isLoading,
  isError,
  onRetry,
}: OverviewRecentActivityProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <h2 className="font-display text-[22px] font-normal text-foreground tracking-tight">
          Recent activity
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-2 py-2">
          <div className="h-4 bg-muted/40 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted/30 rounded w-1/2 animate-pulse" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
          <span>Failed to load activity.</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-foreground hover:underline font-medium cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground font-normal py-2">
          Activity from your team will appear here.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {activities.map((item) => (
            <div
              key={item.id}
              className="py-2.5 flex items-center justify-between gap-3 text-sm group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <UserAvatar
                  user={{
                    id: item.userId,
                    displayName: item.memberName,
                    avatarUrl: item.avatarUrl,
                  }}
                  size={24}
                />
                <span className="truncate text-foreground font-normal">
                  <span className="font-medium text-foreground">{item.memberName}</span>{' '}
                  <span className="text-muted-foreground">{item.action}</span>{' '}
                  <span className="text-foreground font-medium">{item.object}</span>
                </span>
              </div>

              <span className="text-xs font-mono text-muted-foreground tabular-nums shrink-0">
                {item.relativeTime}
              </span>
            </div>
          ))}

          {/* View all activity link */}
          <div className="pt-3">
            <Link
              to={`/app/room/${roomId}/team`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              View all activity &rarr;
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

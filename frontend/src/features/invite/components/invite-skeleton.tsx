/**
 * InviteSkeleton — S03 loading state.
 * Source: PRD §3.3 States.
 *
 * C29 skeletons matching the card layout.
 * Resolves with 160ms cross-fade, no layout shift.
 */
import { Skeleton } from '@/components/ui/skeleton';

export function InviteSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-6" data-testid="invite-skeleton">
      {/* Room name */}
      <Skeleton className="h-7 w-3/4 rounded-control" />
      {/* Event */}
      <Skeleton className="h-5 w-1/2 rounded-control" />
      {/* Leader */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-control" />
      </div>
      {/* Roles needed chips */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-chip" />
        <Skeleton className="h-6 w-24 rounded-chip" />
        <Skeleton className="h-6 w-28 rounded-chip" />
      </div>
      {/* Member avatars */}
      <div className="flex">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="-ml-2 size-8 rounded-full" />
        <Skeleton className="-ml-2 size-8 rounded-full" />
      </div>
      {/* Select */}
      <Skeleton className="h-10 w-full rounded-control" />
      {/* Button */}
      <Skeleton className="h-10 w-full rounded-pill" />
    </div>
  );
}

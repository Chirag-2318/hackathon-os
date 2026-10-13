import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export type IdeateTab = 'all' | 'pending' | 'approved' | 'rejected';

export interface IdeateEmptyStateProps {
  tab: IdeateTab;
  onFocusComposer?: () => void;
  isLocked?: boolean;
}

export function IdeateEmptyState({ tab, onFocusComposer, isLocked }: IdeateEmptyStateProps) {
  if (tab === 'pending') {
    return (
      <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-2">
        <LightbulbSpot size={40} />
        <h3 className="text-sm font-semibold text-foreground mt-1">No pending ideas</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          All submitted ideas have been reviewed by the team leader.
        </p>
      </div>
    );
  }

  if (tab === 'approved') {
    return (
      <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-2">
        <LightbulbSpot size={40} />
        <h3 className="text-sm font-semibold text-foreground mt-1">No approved ideas yet</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          The leader approves ideas that make it into the plan. Review ideas in Pending to choose.
        </p>
      </div>
    );
  }

  if (tab === 'rejected') {
    return (
      <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-2">
        <LightbulbSpot size={40} />
        <h3 className="text-sm font-semibold text-foreground mt-1">No rejected ideas</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Ideas not moving forward to the planning phase will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
      <LightbulbSpot size={48} />
      <h3 className="text-base font-semibold text-foreground">No ideas yet</h3>
      <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
        Be first. Everyone&apos;s idea is its own card; the leader picks what feeds the plan.
      </p>
      {!isLocked && onFocusComposer && (
        <Button
          size="sm"
          onClick={onFocusComposer}
          className="mt-2 text-xs font-medium gap-1.5 h-8 px-3"
        >
          <Plus className="size-3.5" />
          <span>Post an idea</span>
        </Button>
      )}
    </div>
  );
}

function LightbulbSpot({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 select-none"
      aria-hidden="true"
    >
      {/* Soft backdrop glow circle */}
      <circle
        cx="24"
        cy="22"
        r="18"
        fill="var(--warn-bg, #FEF1D6)"
        opacity="0.6"
      />
      {/* Bulb body outline */}
      <path
        d="M24 8C17.37 8 12 13.37 12 20C12 24.3 14.28 28.06 17.69 30.17C18.52 30.68 19.03 31.57 19.03 32.55V34C19.03 35.1 19.93 36 21.03 36H26.97C28.07 36 28.97 35.1 28.97 34V32.55C28.97 31.57 29.48 30.68 30.31 30.17C33.72 28.06 36 24.3 36 20C36 13.37 30.63 8 24 8Z"
        fill="var(--card, #FFFFFF)"
        stroke="var(--ink, #0A0A0A)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Filament lines */}
      <path
        d="M21 21L24 15L27 21"
        stroke="var(--warn-fg, #A15C07)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base screw thread */}
      <path
        d="M20 39H28"
        stroke="var(--ink-2, #737373)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 42H26"
        stroke="var(--ink-3, #A3A3A3)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

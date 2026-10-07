import * as React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export function BlockerBanner({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="flex items-center justify-between w-full px-4 py-3 bg-danger-fill text-ink rounded-control min-h-[44px]">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="size-5 shrink-0" />
        <span className="text-body-strong shrink-0">{count} tasks are blocked</span>
        <span className="text-body ml-1 hidden sm:inline truncate">Review before feature freeze</span>
      </div>
      <button className="text-body-strong text-ink hover:opacity-80 shrink-0 ml-4 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-lav-600 outline-none rounded">
        View blocked tasks <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

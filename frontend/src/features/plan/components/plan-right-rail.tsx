import * as React from 'react';
import { cn } from '@/lib/utils';
import { DashedContainer } from '@/components/primitives/dashed-container';
import { ChecklistRow } from '@/components/primitives/checklist-row';
import { IconAlertCircle } from '@tabler/icons-react';

export function PlanRightRail() {
  return (
    <div className="flex flex-col gap-6 w-72 shrink-0">
      <DashedContainer className="p-4 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-ink mb-1">Context pack</h3>
        <p className="text-xs text-ink-muted mb-2">fields sent</p>
        <ChecklistRow title="Idea" checked={true} isConfirmed={true} readOnly={true} />
        <ChecklistRow title="Rubric" checked={true} isConfirmed={true} readOnly={true} />
        <ChecklistRow title="Skills" checked={true} isConfirmed={true} readOnly={true} />
        
        <div className="mt-4 flex gap-2 items-start text-ink-muted text-xs bg-surface-sunken p-3 rounded-md">
          <IconAlertCircle className="size-4 shrink-0 text-amber" />
          <p>This prompt contains your idea text. It goes to the AI service you paste it into.</p>
        </div>
      </DashedContainer>

      <div className="bg-surface-raised border border-border rounded-xl p-5 shadow-e1">
        <h3 className="text-sm font-bold text-ink mb-2">Skip copy-paste with Pro</h3>
        <p className="text-xs text-ink-muted mb-4">
          Connect your API keys or upgrade to Managed to let the app generate these files automatically.
        </p>
        <button className="w-full h-8 text-xs font-semibold rounded-md bg-ink text-surface hover:opacity-90 transition-opacity">
          Upgrade
        </button>
      </div>
    </div>
  );
}

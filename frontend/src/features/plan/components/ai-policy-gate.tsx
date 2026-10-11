import * as React from 'react';
import { DarkCallout } from '@/components/primitives/dark-callout';
import { Button } from '@/components/ui/button';

export interface AiPolicyGateProps {
  onOverride: () => void;
}

export function AiPolicyGate({ onOverride }: AiPolicyGateProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
      <div className="w-[400px]">
        <DarkCallout
          title="AI use is restricted"
          description="The Brief for this event restricts AI code generation or planning. Using this tool may violate event rules."
          buttonLabel="Override and continue"
          onAction={onOverride}
        />
      </div>
    </div>
  );
}

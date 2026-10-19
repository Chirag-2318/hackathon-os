// The dark product frame with a violet-to-amber rim glow, used by every scene of the stage act.
import type { ReactNode } from 'react';

interface StageShellProps {
  label: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function StageShell({ label, right, className = '', children }: StageShellProps) {
  return (
    <div className={`l-stage-glow ${className}`.trim()}>
      <div className="l-stage-shell">
        <div className="l-stage-bar">
          <span className="l-stage-bar-label">{label}</span>
          {right ? <div className="l-stage-bar-right">{right}</div> : null}
        </div>
        <div className="l-stage-body">{children}</div>
      </div>
    </div>
  );
}

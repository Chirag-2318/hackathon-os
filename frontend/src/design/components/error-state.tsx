import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface ErrorStateProps {
  /** Error message or title */
  message?: string;
  /** Server request ID */
  requestId?: string;
  /** Error code */
  code?: string;
  /** Callback to retry the operation */
  onRetry?: () => void;
  /** Compact card style */
  compact?: boolean;
  className?: string;
}

/**
 * ErrorState component presenting a friendly error message, request ID for debugging,
 * and an immediate Retry trigger.
 */
export function ErrorState({
  message = 'Something went wrong while loading this data.',
  requestId,
  code,
  onRetry,
  compact = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-[10px] border border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200',
        compact ? 'p-3 gap-2' : 'p-6 gap-3',
        className
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shrink-0">
        <AlertCircle className="w-4 h-4" />
      </div>

      <div className="max-w-sm space-y-1">
        <p className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>{message}</p>
        {(requestId || code) && (
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-rose-600/80 dark:text-rose-400/80">
            {code && <span>[{code}]</span>}
            {requestId && <span>ref: {requestId.slice(0, 12)}</span>}
          </div>
        )}
      </div>

      {onRetry && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="mt-1 bg-white hover:bg-rose-50 text-rose-700 border-rose-200 dark:bg-zinc-900 dark:text-rose-300 dark:border-rose-800"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * React Error Boundary for isolated component / section recovery.
 */
interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends React.Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SectionErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={this.props.fallbackMessage || this.state.error?.message || 'Section failed to render.'}
          onRetry={() => {
            this.setState({ hasError: false, error: undefined });
            this.props.onReset?.();
          }}
        />
      );
    }
    return this.props.children;
  }
}

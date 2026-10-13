import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface InlineAlertProps {
  variant?: AlertVariant;
  title?: React.ReactNode;
  children: React.ReactNode;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
}

/**
 * InlineAlert component for contextual notifications and hints with AA contrast.
 */
export function InlineAlert({
  variant = 'info',
  title,
  children,
  onDismiss,
  action,
  className,
}: InlineAlertProps) {
  const iconMap: Record<AlertVariant, React.ReactNode> = {
    info: <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
  };

  const styleMap: Record<AlertVariant, string> = {
    info: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/30 dark:text-sky-200 dark:border-sky-800',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-800',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 p-3 rounded-[8px] border text-xs leading-normal select-none',
        styleMap[variant],
        className
      )}
    >
      <span className="mt-0.5">{iconMap[variant]}</span>
      <div className="flex-1 space-y-0.5 min-w-0">
        {title && <div className="font-semibold">{title}</div>}
        <div className="opacity-90">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

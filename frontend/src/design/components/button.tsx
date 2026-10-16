import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** Shows a spinner and disables interaction */
  isLoading?: boolean;
  /** Optional icon to render before children */
  leftIcon?: React.ReactNode;
  /** Optional icon to render after children */
  rightIcon?: React.ReactNode;
}

/**
 * Button component with variants, loading state, subtle press micro-interaction (0.98),
 * and full keyboard/ARIA support.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-inverse text-on-inverse hover:opacity-90 shadow-sm border border-transparent',
    secondary:
      'bg-surface text-text border border-border hover:bg-surface-raised shadow-xs',
    ghost:
      'bg-transparent text-text-muted hover:bg-surface-raised hover:text-text',
    danger:
      'bg-danger text-on-danger hover:opacity-90 shadow-sm border border-transparent',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs h-8 px-2.5 rounded-[6px] gap-1.5',
    md: 'text-sm h-9 px-3.5 rounded-[8px] gap-2',
    lg: 'text-base h-11 px-5 rounded-[10px] gap-2.5',
    icon: 'h-9 w-9 p-0 rounded-[8px]',
  };

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

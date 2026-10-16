import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { playSound } from '@/shared/sound/sound-effects';

export interface CopyButtonProps {
  /** Value to copy into the clipboard */
  value: string;
  /** Label for copy button or tooltip */
  label?: string;
  /** Size of the button */
  size?: 'sm' | 'md' | 'icon';
  /** Variant */
  variant?: 'ghost' | 'secondary' | 'primary';
  className?: string;
}

/**
 * CopyButton with micro-interaction feedback and temporary "Copied" state.
 */
export function CopyButton({
  value,
  label,
  size = 'icon',
  variant = 'ghost',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      playSound('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn('relative transition-transform active:scale-95', className)}
      aria-label={label || 'Copy to clipboard'}
    >
      {copied ? (
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
          <Check className="w-3.5 h-3.5" />
          {size !== 'icon' && <span>Copied</span>}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <Copy className="w-3.5 h-3.5" />
          {size !== 'icon' && <span>{label || 'Copy'}</span>}
        </span>
      )}
    </Button>
  );
}

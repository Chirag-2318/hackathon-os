import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full max-w-[1200px] px-8 pb-10', className)}
      {...props}
    >
      {children}
    </div>
  );
}

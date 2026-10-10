import { cn } from '@/lib/utils';

export interface PageHeadingProps {
  title: string;
  subtitle: string;
  className?: string;
  titleTestId?: string;
  subtitleTestId?: string;
}

export function PageHeading({
  title,
  subtitle,
  className,
  titleTestId,
  subtitleTestId,
}: PageHeadingProps) {
  return (
    <div className={cn('pt-6 mb-6', className)}>
      <h1
        className="text-[32px] leading-[36px] font-bold tracking-[-0.02em] text-ink"
        data-testid={titleTestId}
      >
        {title}
      </h1>
      <p
        className="mt-1 max-w-[560px] text-[14px] leading-[20px] text-ink-2"
        data-testid={subtitleTestId}
      >
        {subtitle}
      </p>
    </div>
  );
}

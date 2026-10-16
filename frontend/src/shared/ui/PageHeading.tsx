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
        className="text-3xl sm:text-4xl font-display font-normal tracking-tight text-ink leading-tight"
        data-testid={titleTestId}
      >
        {title}
      </h1>
      <p
        className="mt-1 max-w-[560px] text-xs sm:text-sm text-ink-2 font-sans"
        data-testid={subtitleTestId}
      >
        {subtitle}
      </p>
    </div>
  );
}

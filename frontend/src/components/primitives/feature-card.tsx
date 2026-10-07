import * as React from "react";
import { cn } from "cn";
import { AvatarStack } from "./avatar-stack";
import { ProgressRow } from "./progress-row";
import { Chip } from "./chip";

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  tagLabel: string;
  tagColor?: string;
  fillColor?: string;
  participants: Array<{ id: string; name: string; initials: string; fallbackColor?: string; src?: string }>;
  progress: number;
  authorName: string;
  authorInitials: string;
  authorSrc?: string;
  metaText: string;
  illustration?: React.ReactNode;
}

function FeatureCard({
  title,
  tagLabel,
  tagColor = "bg-ink text-surface", // Solid dark fill by default
  fillColor = "var(--pastel-peach)", // Pastel fill
  participants,
  progress,
  authorName,
  authorInitials,
  authorSrc,
  metaText,
  illustration,
  className,
  ...props
}: FeatureCardProps) {
  return (
    <div
      data-slot="feature-card"
      className={cn(
        "relative flex flex-col rounded-panel p-6 shadow-e0 border border-transparent transition-transform hover:-translate-y-0.5 cursor-pointer overflow-hidden",
        className
      )}
      style={{ backgroundColor: fillColor }}
      {...props}
    >
      {/* Illustration Slot (Corner) */}
      {illustration && (
        <div className="absolute -bottom-2 -right-4 pointer-events-none opacity-90 mix-blend-multiply w-32 h-32 flex items-end justify-end">
          {illustration}
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-start justify-end mb-4 relative z-10">
        <Chip className={cn("h-7 px-3 rounded-pill font-bold", tagColor)}>
          {tagLabel}
        </Chip>
      </div>

      {/* Title */}
      <h2 className="text-h2 text-ink line-clamp-2 mb-6 min-h-[44px] relative z-10">{title}</h2>

      {/* Progress */}
      <div className="flex flex-col gap-2 mb-6 relative z-10">
        <ProgressRow 
          label="Progress" 
          percent={progress} 
          colorClass="bg-ink" 
          className="font-medium"
        />
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-ink/10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-white/50 flex items-center justify-center text-[10px] font-bold text-ink overflow-hidden shadow-sm">
            {authorSrc ? (
              <img src={authorSrc} alt={authorName} className="size-full object-cover" />
            ) : (
              authorInitials
            )}
          </div>
          <span className="text-body-strong text-ink">{authorName}</span>
        </div>
        <span className="text-caption font-bold text-ink/80 bg-white/30 px-2 py-0.5 rounded-pill shadow-sm">{metaText}</span>
      </div>
    </div>
  );
}

export { FeatureCard };
export type { FeatureCardProps };

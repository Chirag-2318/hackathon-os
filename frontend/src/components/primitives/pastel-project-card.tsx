import * as React from "react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";
import { AvatarStack } from "./avatar-stack";
import { ProgressBar } from "./progress-bar";
import { Chip } from "./chip";
import { Info } from "lucide-react";
import { IconButton } from "./icon-button";

/**
 * C10c — Pastel Project Card
 * §4 C10c: Fill = pastel by category; date chip (white pill) top-left; info-icon top-right; 
 * title H3; stage label + "Progress" chip with % ; 4px progress bar in darker tone; 
 * avatar stack; "N days left" chip bottom-right.
 */

interface PastelProjectCardProps extends Omit<React.ComponentProps<typeof Card>, "title"> {
  title: string;
  fillColor?: string; // pastel fill
  progressColor?: string; // darker progress fill
  dateText: string;
  stageLabel: string;
  progressPercent: number;
  participants: Array<{ id: string; name: string; initials: string; fallbackColor?: string; src?: string }>;
  daysLeftText: string;
  onInfoClick?: () => void;
}

function PastelProjectCard({
  title,
  fillColor = "var(--pastel-lavender)",
  progressColor = "bg-lav-600",
  dateText,
  stageLabel,
  progressPercent,
  participants,
  daysLeftText,
  onInfoClick,
  className,
  ...props
}: PastelProjectCardProps) {
  return (
    <Card
      data-slot="pastel-project-card"
      className={cn(
        "flex flex-col rounded-card p-4 shadow-e0 border-transparent transition-transform hover:-translate-y-0.5",
        className
      )}
      style={{ backgroundColor: fillColor }}
      {...props}
    >
      <div className="flex items-start justify-between mb-3">
        <Chip variant="solid" className="bg-white/80 text-ink backdrop-blur-sm shadow-sm h-7 rounded-pill">
          {dateText}
        </Chip>
        <IconButton
          tooltip="View details"
          variant="circle"
          size="sm"
          className="text-ink/60 hover:bg-black/5 hover:text-ink"
          onClick={onInfoClick}
        >
          <Info />
        </IconButton>
      </div>

      <h3 className="text-h3 text-ink mb-4 line-clamp-2 min-h-[40px]">{title}</h3>

      <div className="flex items-center justify-between mb-2">
        <span className="text-caption text-ink/80 font-medium">{stageLabel}</span>
        <span className="text-caption text-ink font-bold tabular-nums">
          {progressPercent}%
        </span>
      </div>

      <ProgressBar 
        value={progressPercent} 
        size="sm" 
        fillColor={progressColor} 
        className="bg-black/10 mb-4" 
      />

      <div className="mt-auto flex items-center justify-between">
        <AvatarStack users={participants} max={3} size="sm" />
        <Chip variant="soft" className="bg-black/5 text-ink">
          {daysLeftText}
        </Chip>
      </div>
    </Card>
  );
}

export { PastelProjectCard };
export type { PastelProjectCardProps };

import * as React from "react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * C10d — Dark Callout Card
 * §4 C10d: #2A2D32, r-card, white text. Title (H3), 2-line body in #C7CAC4, 
 * white full-width button with ink text. Maximum one per screen.
 */

interface DarkCalloutProps extends React.ComponentProps<typeof Card> {
  title: string;
  description: string;
  buttonLabel: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

function DarkCallout({
  title,
  description,
  buttonLabel,
  onAction,
  icon,
  className,
  ...props
}: DarkCalloutProps) {
  return (
    <Card
      data-slot="dark-callout"
      className={cn(
        "flex flex-col rounded-card bg-callout p-6 shadow-e0 border-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 mb-3 text-white">
        {icon && <div className="[&_svg]:size-5 [&_svg]:stroke-[1.5px] shrink-0">{icon}</div>}
        <h3 className="text-h3 text-white">{title}</h3>
      </div>
      
      <p className="text-body text-border-strong mb-6 line-clamp-2">
        {description}
      </p>

      <Button
        variant="outline"
        className="w-full bg-white border-transparent text-ink hover:bg-surface-sunken hover:text-ink active:bg-border active:border-transparent mt-auto"
        onClick={onAction}
      >
        {buttonLabel}
      </Button>
    </Card>
  );
}

export { DarkCallout };
export type { DarkCalloutProps };

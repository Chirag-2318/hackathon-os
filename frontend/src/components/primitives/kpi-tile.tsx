import * as React from "react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";
import { Chip } from "./chip";

/**
 * C10f — KPI Tile
 * §4 C10f: surface, r-card. Label (Body, muted), value (Display-ish 40/48, tabular), 
 * delta chip (lime fill, ink text, e.g., "+6%"; coral fill for negative). 
 * Optional 24px sparkline.
 */

interface KpiTileProps extends React.ComponentProps<typeof Card> {
  label: string;
  value: string | number;
  delta?: {
    value: string; // e.g. "+6%" or "-2"
    trend: "up" | "down" | "neutral";
  };
  sparkline?: React.ReactNode;
}

function KpiTile({
  label,
  value,
  delta,
  sparkline,
  className,
  ...props
}: KpiTileProps) {
  // Determine delta chip fill color based on trend
  const deltaFill = 
    delta?.trend === "up" ? "var(--color-success-fill)" :
    delta?.trend === "down" ? "var(--color-danger-fill)" :
    "var(--surface-sunken)";
    
  // Text is always ink on these fills per PRD §4.4 rules for pastel/semantic fills
  
  return (
    <Card
      data-slot="kpi-tile"
      className={cn(
        "flex flex-col rounded-card bg-surface p-4 shadow-e0 border-transparent",
        className
      )}
      {...props}
    >
      <span className="text-body text-ink-muted mb-2 font-medium">{label}</span>
      
      <div className="flex items-end justify-between gap-4 mt-auto">
        <div className="flex items-center gap-3">
          <span className="text-display tabular-nums text-ink leading-none">
            {value}
          </span>
          {delta && (
            <Chip fill={deltaFill} className="h-6 font-bold pb-0.5">
              {delta.value}
            </Chip>
          )}
        </div>
        
        {sparkline && (
          <div className="h-6 w-16 shrink-0 flex items-end">
            {sparkline}
          </div>
        )}
      </div>
    </Card>
  );
}

export { KpiTile };
export type { KpiTileProps };

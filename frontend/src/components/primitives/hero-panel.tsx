import * as React from "react";
import { cn } from "cn";

/**
 * C10g — Hero Illustration Panel
 * §4 C10g: r-panel, ice-blue #AEE6FF field with CC0 illustration; 
 * bell + avatar overlay top-right (only on Home). 
 * Holds countdown in Submission/Overview variants.
 */

interface HeroPanelProps extends React.ComponentProps<"div"> {
  illustrationSrc?: string;
  fillColor?: string;
  overlayTopRight?: React.ReactNode;
  countdownNode?: React.ReactNode;
}

function HeroPanel({
  illustrationSrc,
  fillColor = "var(--pastel-sky)",
  overlayTopRight,
  countdownNode,
  children,
  className,
  ...props
}: HeroPanelProps) {
  return (
    <div
      data-slot="hero-panel"
      className={cn(
        "relative rounded-panel overflow-hidden flex flex-col justify-end p-5",
        className
      )}
      style={{ backgroundColor: fillColor, minHeight: "260px" }}
      {...props}
    >
      {/* Background Illustration */}
      {illustrationSrc && (
        <img 
          src={illustrationSrc} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
          aria-hidden="true"
        />
      )}
      
      {/* Top Right Overlay (e.g. bell + avatar on Home) */}
      {overlayTopRight && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          {overlayTopRight}
        </div>
      )}

      {/* Content Area (e.g. countdown) */}
      <div className="relative z-10 flex flex-col items-start gap-4 mt-auto">
        {countdownNode}
        {children}
      </div>
    </div>
  );
}

export { HeroPanel };
export type { HeroPanelProps };

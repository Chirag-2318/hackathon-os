import type { ReactNode } from 'react';
import { useFitScale } from '../../hooks/use-fit-scale';

// Draws its children at a fixed design width (the width of the real product screen) and shrinks them to fit the box
// they sit in. Below the minimum scale the right-hand part is cropped instead of becoming unreadable.
export function FitScale({ designWidth, minScale, children }: { designWidth: number; minScale: number; children: ReactNode }) {
  const { boxRef, scale, designHeight } = useFitScale(designWidth, minScale);
  return (
    <div ref={boxRef} className="l-fit">
      <div className="l-fit-inner" style={{ width: designWidth, height: designHeight, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

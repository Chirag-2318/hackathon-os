export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'bottom-sheet' | 'center';

export interface SpotlightStep {
  target?: string; // data-tour value, e.g. "nav-rooms"
  title: string;
  body: string;
  tryItKey?: 'ctrl-k'; // for step 5 Ctrl+K try-it
  isFinale?: boolean;
}

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

import type { ReactNode, ComponentType } from 'react';

export type TourPath = 'LEADER' | 'MEMBER';

export interface SceneProps {
  active: boolean;
  progress: number;
  tourPath: TourPath;
  onAdvance?: () => void;
  onTryItComplete?: () => void;
  isReducedMotion?: boolean;
}

export interface TourStop {
  id: string;
  hour: number;
  label: string; // for bottom scrubber, e.g. "Brief", "Team", "Ideate"
  sidebarTag?: string; // e.g. "PLAN > Plan"
  title: string | ((path: TourPath) => string);
  caption: string | ((path: TourPath) => string);
  durationMs: number;
  hasTryIt?: boolean;
  Scene: ComponentType<SceneProps>;
}

export interface TourDraftState {
  stopIndex: number;
  path: TourPath;
}

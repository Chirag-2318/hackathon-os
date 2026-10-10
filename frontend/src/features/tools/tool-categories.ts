import type { LucideIcon } from 'lucide-react';
import {
  Clapperboard,
  Film,
  Workflow,
  Palette,
  Braces,
  Rocket,
  Wrench,
} from 'lucide-react';

export const TOOL_CATEGORIES = [
  'Recording',
  'Video',
  'Diagrams',
  'Design',
  'API',
  'Deployment',
] as const;

export interface ToolCategoryMeta {
  icon: LucideIcon;
  bgClass: string;
  fgClass: string;
  phaseHint: string;
}

const CATEGORY_MAP: Record<string, ToolCategoryMeta> = {
  recording: {
    icon: Clapperboard,
    bgClass: 'bg-cat-recording-bg',
    fgClass: 'text-cat-recording-fg',
    phaseHint: 'Best in the last 15% of the clock: rehearsal and video.',
  },
  video: {
    icon: Film,
    bgClass: 'bg-cat-video-bg',
    fgClass: 'text-cat-video-fg',
    phaseHint: 'Best in the last 15% of the clock: rehearsal and video.',
  },
  diagrams: {
    icon: Workflow,
    bgClass: 'bg-cat-diagrams-bg',
    fgClass: 'text-cat-diagrams-fg',
    phaseHint: 'Best early, while you plan and build the skeleton (15 to 25% of the clock).',
  },
  design: {
    icon: Palette,
    bgClass: 'bg-cat-design-bg',
    fgClass: 'text-cat-design-fg',
    phaseHint: 'Best during ideation and again in polish (70 to 85% of the clock).',
  },
  api: {
    icon: Braces,
    bgClass: 'bg-cat-api-bg',
    fgClass: 'text-cat-api-fg',
    phaseHint: 'Best while you build the core (25 to 60% of the clock).',
  },
  deployment: {
    icon: Rocket,
    bgClass: 'bg-cat-deployment-bg',
    fgClass: 'text-cat-deployment-fg',
    phaseHint: 'Best while you build the core, and again before you submit.',
  },
};

const DEFAULT_META: ToolCategoryMeta = {
  icon: Wrench,
  bgClass: 'bg-cat-default-bg',
  fgClass: 'text-cat-default-fg',
  phaseHint: 'Useful throughout the hackathon lifecycle.',
};

export function getToolCategoryMeta(category: string): ToolCategoryMeta {
  const key = category.trim().toLowerCase();
  return CATEGORY_MAP[key] || DEFAULT_META;
}

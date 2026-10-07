/**
 * S23 Readiness — API types
 * PRD 5b §6.1. Stand-in contract pending OQ-21 / generated client.
 */

export type BridgeStep = 'not_started' | 'prompt_copied' | 'answer_pasted' | 'validated';
export type WeakSpotSeverity = 'high' | 'medium' | 'low';

export interface ReadinessRing {
  id: string;
  label: string;
  /** 0–1 */
  progress: number;
  /** Display text shown beside or in the ring */
  valueText: string;
  /** Screen ID the ring links to (from data, never hardcoded) */
  destination: string;
}

export interface WeakSpot {
  id: string;
  /** Two-letter identity code for the pastel tile */
  code: string;
  title: string;
  severity: WeakSpotSeverity;
  /** 0–100 */
  percent: number;
  owner: string;
  updatedAt: string;
}

export interface SimulatorScore {
  criterion: string;
  weight: number;
  score: number;
}

export interface SimulatorData {
  mode: 'free' | 'pro';
  bridgeStep: BridgeStep;
  scores: SimulatorScore[];
  likelyQuestions: string[];
}

export interface ReadinessResponse {
  _fixture: string;
  rings: ReadinessRing[];
  weakSpots: WeakSpot[];
  simulator: SimulatorData;
}

export interface ValidateResult {
  success: boolean;
  missingItems?: string[];
  repairPrompt?: string;
}

/**
 * S24 Retro & Portfolio — API types
 * PRD 5b §6.2. Stand-in contract pending OQ-21 / generated client.
 */

export interface WrappedStats {
  hours: number;
  tasksDone: number;
  firstWorkingDemoHour: number;
  rehearsals: number;
}

export type PhaseId = 'prep' | 'ideate' | 'plan' | 'build' | 'freeze' | 'ship' | 'retro';

export interface Milestone {
  id: string;
  title: string;
  hour: number;
  phase: PhaseId;
}

export interface PhaseTimeEntry {
  phase: PhaseId;
  label: string;
  plannedHours: number;
  actualHours: number;
}

export interface RetroAnswers {
  worked: string;
  didnt: string;
  change: string;
}

export type DecisionChoice = 'continue' | 'archive' | null;

export interface TwoWeekPlan {
  week1: string[];
  week2: string[];
}

export interface PortfolioLink {
  label: string;
  url: string;
}

export interface PortfolioAward {
  title: string;
  event: string;
}

export interface PortfolioProject {
  name: string;
  description: string;
}

export interface PortfolioEntry {
  project: PortfolioProject;
  role: string;
  links: PortfolioLink[];
  awards: PortfolioAward[];
}

export interface RetroResponse {
  _fixture: string;
  wrapped: WrappedStats;
  milestones: Milestone[];
  phaseTime: PhaseTimeEntry[];
  retro: RetroAnswers;
  decision: DecisionChoice;
  twoWeekPlan: TwoWeekPlan;
  portfolio: PortfolioEntry;
}

export interface RetroSavePayload {
  worked?: string;
  didnt?: string;
  change?: string;
  decision?: DecisionChoice;
}

import type { ComponentType } from 'react';
import type { WallScreenId } from '../../data/hero-wall';
import { BriefScreen } from './screens/brief-screen';
import { TeamScreen } from './screens/team-screen';
import { IdeaScreen } from './screens/idea-screen';
import { PlanScreen } from './screens/plan-screen';
import { LedgerScreen } from './screens/ledger-screen';
import { RehearsalScreen } from './screens/rehearsal-screen';
import { JudgeScreen } from './screens/judge-screen';
import { ReadinessScreen } from './screens/readiness-screen';
import { LaunchScreen } from './screens/launch-screen';
import { DocsScreen } from './screens/docs-screen';
import { ClockScreen } from './screens/clock-screen';
import { PlaybooksScreen } from './screens/playbooks-screen';
import { SummaryScreen } from './screens/summary-screen';
import { ToolsScreen } from './screens/tools-screen';

export const WALL_SCREENS: Record<WallScreenId, ComponentType> = {
  brief: BriefScreen,
  team: TeamScreen,
  idea: IdeaScreen,
  plan: PlanScreen,
  ledger: LedgerScreen,
  rehearsal: RehearsalScreen,
  judge: JudgeScreen,
  readiness: ReadinessScreen,
  launch: LaunchScreen,
  docs: DocsScreen,
  clock: ClockScreen,
  playbooks: PlaybooksScreen,
  summary: SummaryScreen,
  tools: ToolsScreen,
};

/**
 * S25 Prep Mode, S26 Crowd Check, S27 Tool Directory, S28 Settings
 * API types — PRD 6a §4
 */

// ── S25 Prep ─────────────────────────────────────────────────────

export interface PrepChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface PrepEvent {
  name: string;
  startDate: string; // ISO-8601
  endDate: string;
  venue: string;
  address: string;
  weather: { temp: number; unit: 'C' | 'F'; condition: string };
  travelTime: string;
}

export interface PrepResponse {
  checklist: PrepChecklistItem[];
  event: PrepEvent | null;
  githubConnected: boolean;
  preExistingCodeAllowed: boolean;
}

// ── S26 Crowd Check ───────────────────────────────────────────────

export type Crowdedness = 'LOW' | 'MEDIUM' | 'HIGH' | null;

export interface CrowdRow {
  id: string;
  option: string;
  likelyCompetingIdeas: string;
  collegeOverlap: number | null;
  crowdedness: Crowdedness;
  notes: string;
}

export interface CrowdCheckResponse {
  rows: CrowdRow[];
}

// ── S27 Tool Directory ────────────────────────────────────────────

export type ToolCategory = 'Recording' | 'Video' | 'Diagrams' | 'Design' | 'API' | 'Deployment';
export type ToolCost = 'Free' | 'Freemium' | 'Paid';
export type ToolLicense = 'Open source' | 'Proprietary';

export interface Tool {
  id: string;
  name: string;
  oneLineUse: string;
  category: ToolCategory;
  cost: ToolCost;
  license: ToolLicense;
  lastChecked: string; // Display string from mock data, no computation
  verified: boolean;
  url: string;
}

export interface ToolsResponse {
  tools: Tool[];
}

// ── S28 Settings ──────────────────────────────────────────────────

export type RoleTag =
  | 'Frontend'
  | 'Backend'
  | 'ML/AI'
  | 'Design'
  | 'Presenter'
  | 'Domain expert'
  | 'QA/Demo operator';

export type AppTheme = 'light' | 'dark' | 'system';
export type Density = 'comfortable' | 'compact';
export type AiMode = 'promptBridge' | 'yourApiKey' | 'managed';

export interface UserProfile {
  displayName: string;
  email: string;
  githubHandle: string;
  roleTags: RoleTag[];
  availability: string;
  skills: string;
}

export interface NotificationPreferences {
  blockerAlerts: boolean;
  checkpointReminders: boolean;
  taskAssignments: boolean;
  deadlineReminders: boolean;
  teamAnnouncements: boolean;
}

export interface IntegrationStatus {
  connected: boolean;
  username?: string;
}

export interface AiAndKeys {
  mode: AiMode;
  providers: Array<{ name: string; key: string }>;
}

export interface SettingsResponse {
  profile: UserProfile;
  appearance: { theme: AppTheme; density: Density };
  notifications: NotificationPreferences;
  integrations: {
    github: IntegrationStatus;
    google: IntegrationStatus;
  };
  aiAndKeys: AiAndKeys;
  billing: { plan: 'free' | 'pro' };
}

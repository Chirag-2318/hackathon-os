import { apiClient } from '@/lib/apiClient';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiClient<T>(path, options);
}

export const fetchEventTemplates = () => apiFetch<any[]>('/api/v1/event-templates');
export const suggestRoomName = () => apiFetch<{ suggestion: string }>('/api/v1/rooms/suggest-name');
export const fetchRoomOverview = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/overview`);
export const createRoom = (data: any) => apiFetch<{ id: string, name: string }>('/api/v1/rooms', { method: 'POST', body: JSON.stringify(data) });
export type SubmissionItem = any;
export type SubmissionGroup = any;
export type LinkCheckRow = any;
export type SubmissionDraft = any;
export type SubmissionResponse = any;
export type CharterPollOption = any;
export type HealthPanelData = any;
export type TeamMember = any;
export type SkillGapRadarPoint = any;
export type PlaybookDetail = any;
export type EventTemplate = any;
export type HomeSummaryResponse = any;
export type RoomOverviewResponse = any;
export type BriefResponse = any;
export type TeamResponse = any;
export type IdeateResponse = any;
export type PlanStateResponse = any;
export type PlanValidateResult = any;
export type DocsVaultResponse = any;
export type BoardResponse = any;
export type ScheduleResponse = any;
export type MvpStudioData = any;
export type GithubResponse = any;
export type ApiHubResponse = any;
export type DiagramStudioResponse = any;
export type PitchDeckResponse = any;
export type RehearseResponse = any;
export type QaResponse = any;
export type DemoResponse = any;

export const fetchApis = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/apis`);
export type ApiEndpoint = any;
export const ApiEndpoint: any = {};
export const authWithGitHub = async (): Promise<void> => {
  window.location.href = '/oauth2/authorization/github';
};
export const authWithGoogle = async (): Promise<void> => {
  window.location.href = '/oauth2/authorization/google';
};
export type AuthResult = { authenticated: boolean; user?: any };
export const fetchBoardTasks = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/board`);
export type Task = any;
export const Task: any = {};
export type TaskStatus = any;
export const TaskStatus: any = {};
export const fetchBrief = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/brief`);
export type InsuranceItem = any;
export const InsuranceItem: any = {};
export type DemoShot = any;
export const DemoShot: any = {};
export type DemoTool = any;
export const DemoTool: any = {};
export type VideoRule = any;
export const VideoRule: any = {};
export const fetchDemo = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/demo`);
export type DiagramTemplate = any;
export const DiagramTemplate: any = {};
export const fetchDiagrams = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/diagrams`);
export type DocsVaultFile = any;
export const DocsVaultFile: any = {};
export const fetchDocsVault = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/docs`);
export type GithubBranch = any;
export const GithubBranch: any = {};
export type GithubHealthCheck = any;
export const GithubHealthCheck: any = {};
export const fetchGithub = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/github`);
export const fetchHomeSummary = () => apiFetch<any>('/api/v1/home');
export type IdeateIdea = any;
export const IdeateIdea: any = {};
export const fetchIdeate = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/ideate`);
export type InviteRoom = any;
export const InviteRoom: any = {};
export const fetchPlaybooks = () => apiFetch<any[]>('/api/v1/playbooks');
export type PlaybookCard = any;
export const PlaybookCard: any = {};
export type CoreFlowStep = any;
export const CoreFlowStep: any = {};
export type RealityLedgerItem = any;
export const RealityLedgerItem: any = {};
export const fetchMvpStudio = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/mvp`);
export type PitchLintIssue = any;
export const PitchLintIssue: any = {};
export type LintType = any;
export const LintType: any = {};
export type PitchSlide = any;
export const PitchSlide: any = {};
export const fetchPitchDeck = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/deck`);
export const fetchRehearse = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/rehearse`);
export const fetchQa = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/qa`);
export const fetchPlanState = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/plan`);
export const validatePlanStep = (roomId: string, data?: any) =>
  apiFetch<any>(`/api/v1/rooms/${roomId}/plan/validate`, { method: 'POST', body: JSON.stringify(data ?? {}) });
export type ProgressChartPoint = any;
export const ProgressChartPoint: any = {};
export type HeatmapCell = any;
export const HeatmapCell: any = {};
export type ScheduleEvent = any;
export const ScheduleEvent: any = {};
export const fetchSchedule = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/schedule`);
export type InviteView = any;
export const InviteView: any = {};
export const fetchTeam = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/team`);
export const fetchSubmission = (roomId: string) => apiFetch<any>(`/api/v1/rooms/${roomId}/submission`);
export const fetchPlaybookDetail = (slug: string) => apiFetch<any>(`/api/v1/playbooks/${slug}`);

// ── PRESENT group: Deck source ──────────────────────────────────────────────
export const fetchDeckSource = (roomId: string) =>
  apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/deck/source`);
export const saveDeckSource = (roomId: string, body: { provider: string; url: string; title: string }) =>
  apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/deck/source`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteDeckSource = (roomId: string) =>
  apiFetch<void>(`/api/v1/rooms/${roomId}/pitch/deck/source`, { method: 'DELETE' });

// ── Pitch script ─────────────────────────────────────────────────────────────
export const fetchPitchScript = (roomId: string) =>
  apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/script`);
export const generatePitchScript = (roomId: string, body: {
  type: string; speakerCount: number; speakerUserIds?: string[]; instructions?: string;
}) => apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/generate`, { method: 'POST', body: JSON.stringify(body) });
export const updatePitchSlide = (roomId: string, n: number, body: { say?: string; show?: string }) =>
  apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/script/slides/${n}`, { method: 'PUT', body: JSON.stringify(body) });
export const deletePitchScript = (roomId: string) =>
  apiFetch<void>(`/api/v1/rooms/${roomId}/pitch/script`, { method: 'DELETE' });

// ── Q&A generate (adds why_asked, risk_point, difficulty) ───────────────────
export const generateQa = (roomId: string, body: { level: 'friendly'|'mixed'|'grill'; count?: number }) =>
  apiFetch<any[]>(`/api/v1/rooms/${roomId}/pitch/qa/generate`, { method: 'POST', body: JSON.stringify(body) });

// ── Rehearsal with stats ─────────────────────────────────────────────────────
export const saveRehearsalRun = (roomId: string, body: {
  durationSec: number;
  sectionPaces: Array<{ label: string; targetSec: number; actualSec: number }>;
  notes?: string;
  stats?: { wordsPerMinute: number; fillerCount: number; keyPointsHit: number; keyPointsTotal: number };
}) => apiFetch<any>(`/api/v1/rooms/${roomId}/pitch/rehearse`, { method: 'POST', body: JSON.stringify(body) });

// ── Canva integration ────────────────────────────────────────────────────────
export const fetchCanvaStatus = (roomId: string) =>
  apiFetch<{ connected: boolean }>(`/api/v1/integrations/canva/status`);
export const fetchCanvaDesigns = (q?: string) =>
  apiFetch<any[]>(`/api/v1/integrations/canva/designs${q ? `?q=${encodeURIComponent(q)}` : ''}`);



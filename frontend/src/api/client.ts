const BASE_URL = 'http://localhost:8080';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // sends the session cookie
  });

  if (res.status === 401) {
    window.location.href = `${BASE_URL}/oauth2/authorization/github`;
    throw new Error('Not authenticated');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
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

export const fetchApis = async (...args: any[]): Promise<any> => {};
export type ApiEndpoint = any;
export const ApiEndpoint: any = {};
export const authWithGitHub = async (...args: any[]): Promise<any> => {};
export const authWithGoogle = async (...args: any[]): Promise<any> => {};
export const AuthResult = async (...args: any[]): Promise<any> => {};
export const fetchBoardTasks = async (...args: any[]): Promise<any> => {};
export type Task = any;
export const Task: any = {};
export type TaskStatus = any;
export const TaskStatus: any = {};
export const fetchBrief = async (...args: any[]): Promise<any> => {};
export type InsuranceItem = any;
export const InsuranceItem: any = {};
export type DemoShot = any;
export const DemoShot: any = {};
export type DemoTool = any;
export const DemoTool: any = {};
export type VideoRule = any;
export const VideoRule: any = {};
export const fetchDemo = async (...args: any[]): Promise<any> => {};
export type DiagramTemplate = any;
export const DiagramTemplate: any = {};
export const fetchDiagrams = async (...args: any[]): Promise<any> => {};
export type DocsVaultFile = any;
export const DocsVaultFile: any = {};
export const fetchDocsVault = async (...args: any[]): Promise<any> => {};
export type GithubBranch = any;
export const GithubBranch: any = {};
export type GithubHealthCheck = any;
export const GithubHealthCheck: any = {};
export const fetchGithub = async (...args: any[]): Promise<any> => {};
export const fetchHomeSummary = () => apiFetch<any>('/api/v1/home');
export type IdeateIdea = any;
export const IdeateIdea: any = {};
export const fetchIdeate = async (...args: any[]): Promise<any> => {};
export type InviteRoom = any;
export const InviteRoom: any = {};
export const fetchPlaybooks = async (...args: any[]): Promise<any> => {};
export type PlaybookCard = any;
export const PlaybookCard: any = {};
export type CoreFlowStep = any;
export const CoreFlowStep: any = {};
export type RealityLedgerItem = any;
export const RealityLedgerItem: any = {};
export const fetchMvpStudio = async (...args: any[]): Promise<any> => {};
export type PitchLintIssue = any;
export const PitchLintIssue: any = {};
export type LintType = any;
export const LintType: any = {};
export type PitchSlide = any;
export const PitchSlide: any = {};
export const fetchPitchDeck = async (...args: any[]): Promise<any> => {};
export const fetchRehearse = async (...args: any[]): Promise<any> => {};
export const fetchQa = async (...args: any[]): Promise<any> => {};
export const fetchPlanState = async (...args: any[]): Promise<any> => {};
export const validatePlanStep = async (...args: any[]): Promise<any> => {};
export type ProgressChartPoint = any;
export const ProgressChartPoint: any = {};
export type HeatmapCell = any;
export const HeatmapCell: any = {};
export type ScheduleEvent = any;
export const ScheduleEvent: any = {};
export const fetchSchedule = async (...args: any[]): Promise<any> => {};
export type InviteView = any;
export const InviteView: any = {};
export const fetchTeam = async (...args: any[]): Promise<any> => {};
export const fetchSubmission = async (...args: any[]): Promise<any> => {};

export const fetchPlaybookDetail = async (...args: any[]): Promise<any> => {};


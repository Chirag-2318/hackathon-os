import { apiFetch } from '@/api/client';

export interface PitchSettings {
  roomId: string;
  format: 'LIVE' | 'VIDEO' | 'BOTH';
  pitchLimitSec: number;
  qaLimitSec: number;
  presenterUserId: string | null;
  operatorUserId: string | null;
  locked: boolean;
  lockedBy: string | null;
  wpm: number;
  version: number;
}

export interface PatchPitchSettingsRequest {
  format?: 'LIVE' | 'VIDEO' | 'BOTH';
  pitchLimitSec?: number;
  qaLimitSec?: number;
  presenterUserId?: string | null;
  operatorUserId?: string | null;
  locked?: boolean;
  wpm?: number;
  version?: number;
}

export interface PitchKitReadinessItem {
  id: string;
  label: string;
  status: 'READY' | 'PARTIAL' | 'MISSING';
  detail: string;
  route: string;
  weight: number;
}

export interface PitchKitReadinessResponse {
  readyCount: number;
  totalCount: number;
  scorePercent: number;
  items: PitchKitReadinessItem[];
}

export interface DemoAsset {
  id: string;
  roomId: string;
  kind: 'FULL_RECORDING' | 'BACKUP_RECORDING' | 'LIVE_LINK' | 'SCREENSHOT';
  url: string;
  provider: string;
  title: string;
  status: 'NOT_ADDED' | 'CHECKING' | 'REACHABLE' | 'NEEDS_LOGIN' | 'NOT_FOUND' | 'UNREACHABLE';
  checkedAt: string | null;
  caption: string;
  position: number;
  addedBy: string | null;
  createdAt: string;
}

export interface DemoLadderRung {
  rung: 'A' | 'B' | 'C' | 'D';
  name: string;
  status: 'READY' | 'MISSING' | 'UNTESTED';
  sayText: string;
  testedAt: string | null;
  testedBy: string | null;
  testedByName: string | null;
}

export interface DemoPreflightItem {
  id: string;
  itemHash: string;
  label: string;
  checked: boolean;
  checkedBy: string | null;
  checkedByName: string | null;
  checkedAt: string | null;
  source: string;
  position: number;
}

export const fetchPitchSettings = (roomId: string) =>
  apiFetch<PitchSettings>(`/api/v1/rooms/${roomId}/pitchkit/settings`);

export const patchPitchSettings = (roomId: string, req: PatchPitchSettingsRequest) =>
  apiFetch<PitchSettings>(`/api/v1/rooms/${roomId}/pitchkit/settings`, {
    method: 'PATCH',
    body: JSON.stringify(req),
  });

export const fetchPitchReadiness = (roomId: string) =>
  apiFetch<PitchKitReadinessResponse>(`/api/v1/rooms/${roomId}/pitchkit/readiness`);

export const fetchDemoAssets = (roomId: string) =>
  apiFetch<DemoAsset[]>(`/api/v1/rooms/${roomId}/demo/assets`);

export const createDemoLink = (roomId: string, req: { kind: string; url: string; title?: string }) =>
  apiFetch<DemoAsset>(`/api/v1/rooms/${roomId}/demo/assets`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

export const uploadDemoScreenshot = (roomId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<DemoAsset>(`/api/v1/rooms/${roomId}/demo/assets/screenshot`, {
    method: 'POST',
    body: formData,
  });
};

export const updateDemoAsset = (roomId: string, assetId: string, req: { caption?: string; position?: number }) =>
  apiFetch<DemoAsset>(`/api/v1/rooms/${roomId}/demo/assets/${assetId}`, {
    method: 'PATCH',
    body: JSON.stringify(req),
  });

export const deleteDemoAsset = (roomId: string, assetId: string) =>
  apiFetch<void>(`/api/v1/rooms/${roomId}/demo/assets/${assetId}`, {
    method: 'DELETE',
  });

export const checkDemoAsset = (roomId: string, assetId: string) =>
  apiFetch<DemoAsset>(`/api/v1/rooms/${roomId}/demo/assets/${assetId}/check`, {
    method: 'POST',
  });

export const fetchDemoLadder = (roomId: string) =>
  apiFetch<DemoLadderRung[]>(`/api/v1/rooms/${roomId}/demo/ladder`);

export const updatePitchSettings = patchPitchSettings;

export const createDemoAsset = createDemoLink;

export const uploadScreenshot = uploadDemoScreenshot;

export const updateDemoLadderRung = (roomId: string, rung: string, req: string | { sayText: string }) => {
  const sayText = typeof req === 'string' ? req : req.sayText;
  return apiFetch<DemoLadderRung>(`/api/v1/rooms/${roomId}/demo/ladder/${rung}`, {
    method: 'PATCH',
    body: JSON.stringify({ sayText }),
  });
};

export const testDemoLadderRung = (roomId: string, rung: string) =>
  apiFetch<DemoLadderRung>(`/api/v1/rooms/${roomId}/demo/ladder/${rung}/test`, {
    method: 'POST',
  });

export const markDemoLadderTested = testDemoLadderRung;

export const fetchDemoPreflight = (roomId: string) =>
  apiFetch<DemoPreflightItem[]>(`/api/v1/rooms/${roomId}/demo/preflight`);

export const addDemoPreflight = (roomId: string, label: string) =>
  apiFetch<DemoPreflightItem>(`/api/v1/rooms/${roomId}/demo/preflight`, {
    method: 'POST',
    body: JSON.stringify({ label }),
  });

export const addDemoPreflightItem = addDemoPreflight;

export const toggleDemoPreflight = (roomId: string, itemId: string, checked: boolean) =>
  apiFetch<DemoPreflightItem>(`/api/v1/rooms/${roomId}/demo/preflight/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ checked }),
  });

export const toggleDemoPreflightItem = toggleDemoPreflight;

export const resetDemoPreflight = (roomId: string) =>
  apiFetch<void>(`/api/v1/rooms/${roomId}/demo/preflight/reset`, {
    method: 'POST',
  });

// ── Pitch & Rehearsal Station API ──────────────────────────────────────────

export interface PitchBeat {
  id: string;
  title: string;
  durationSec: number;
  say: string;
  show: string;
  cue: string;
  speakerUserId?: string | null;
  slideRef?: string | null;
}

export interface PitchDetail {
  roomId: string;
  version: number;
  beats: PitchBeat[];
  timeLimitSec: number;
  source: 'DOC' | 'CUSTOM';
  docVersion: number | null;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export interface UpdatePitchRequest {
  expectedVersion?: number;
  beats: PitchBeat[];
  timeLimitSec?: number;
}

export interface PullFromDocResponse {
  diff: string;
  beats: PitchBeat[];
  applied: boolean;
  version: number;
}

export interface PushToDocResponse {
  docVersion: number;
}

export interface PitchVersionSummary {
  id: string;
  version: number;
  note: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  beatCount: number;
}

export interface MatchingBeat {
  id: string;
  title: string;
}

export interface RubricCoverageItem {
  criterion: string;
  weight: number;
  matchingBeats: MatchingBeat[];
}

export interface PitchAiEditRequest {
  action: 'Tighten to fit' | 'Punchier' | 'Explain the jargon';
  beatSay: string;
  title: string;
  targetSeconds?: number;
}

export interface PitchAiEditResponse {
  proposedText: string;
  diff: string;
}

export interface StartRehearsalRequest {
  mode: 'TIMED' | 'VOICE';
  scope: 'FULL' | 'MY_BEATS' | 'ONE_BEAT';
  beatIds?: string[];
}

export interface StartRehearsalResponse {
  id: string;
  beats: PitchBeat[];
  limitSec: number;
}

export interface BeatTiming {
  beatId: string;
  plannedMs: number;
  actualMs: number;
  startedAtMs: number;
}

export interface Stumble {
  atMs: number;
  beatId: string;
}

export interface FinishRehearsalRequest {
  beatTimings: BeatTiming[];
  stumbles: Stumble[];
  endedReason: 'COMPLETE' | 'STOPPED';
}

export interface BeatMetric {
  beatId: string;
  wpm: number;
  fillerCount: number;
  scriptCoveragePct: number;
  missedPhrases: string[];
  deltaMs: number;
}

export interface RehearsalMetrics {
  overallWpm: number;
  totalFillers: number;
  fillersPerMin: number;
  overallCoveragePct: number;
  totalStumbles: number;
  totalDeltaMs: number;
  slowestBeatId: string | null;
  slowestBeatDeltaMs: number;
  beatMetrics: BeatMetric[];
}

export interface CoachFixItem {
  issue: string;
  evidence: string;
  drill: string;
}

export interface CoachFeedback {
  worked: string[];
  fix: CoachFixItem[];
  oneDrill: string;
}

export interface RehearsalDelta {
  wpmDelta?: number | null;
  durationDeltaMs?: number | null;
  fillersDelta?: number | null;
  coverageDeltaPct?: number | null;
}

export interface RehearsalSummary {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  mode: 'TIMED' | 'VOICE';
  scope: 'FULL' | 'MY_BEATS' | 'ONE_BEAT';
  startedAt: string;
  durationMs: number;
  plannedMs: number;
  completed: boolean;
  completionPct: number;
  countsTowardReadiness: boolean;
  delta?: RehearsalDelta | null;
}

export interface RehearsalDetail extends RehearsalSummary {
  endedAt: string;
  pitchVersion: number;
  beatTimings: BeatTiming[];
  stumbles: Stumble[];
  transcript: Record<string, string>;
  metrics: RehearsalMetrics;
  coach: CoachFeedback | null;
  beats: PitchBeat[];
}

export const fetchPitch = (roomId: string) =>
  apiFetch<PitchDetail>(`/api/v1/rooms/${roomId}/pitch`);

export const updatePitch = (roomId: string, req: UpdatePitchRequest) =>
  apiFetch<PitchDetail>(`/api/v1/rooms/${roomId}/pitch`, {
    method: 'PUT',
    body: JSON.stringify(req),
  });

export const pullPitchFromDoc = (roomId: string, confirm: boolean = false) =>
  apiFetch<PullFromDocResponse>(`/api/v1/rooms/${roomId}/pitch/pull-from-doc?confirm=${confirm}`, {
    method: 'POST',
  });

export const pushPitchToDoc = (roomId: string) =>
  apiFetch<PushToDocResponse>(`/api/v1/rooms/${roomId}/pitch/push-to-doc`, {
    method: 'POST',
  });

export const fetchPitchVersions = (roomId: string) =>
  apiFetch<PitchVersionSummary[]>(`/api/v1/rooms/${roomId}/pitch/versions`);

export const restorePitchVersion = (roomId: string, version: number) =>
  apiFetch<PitchDetail>(`/api/v1/rooms/${roomId}/pitch/versions/${version}/restore`, {
    method: 'POST',
  });

export const fetchPitchCoverage = (roomId: string) =>
  apiFetch<RubricCoverageItem[]>(`/api/v1/rooms/${roomId}/pitch/coverage`);

export const aiEditPitchBeat = (roomId: string, req: PitchAiEditRequest) =>
  apiFetch<PitchAiEditResponse>(`/api/v1/rooms/${roomId}/pitch/ai-edit`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

export const startRehearsal = (roomId: string, req: StartRehearsalRequest) =>
  apiFetch<StartRehearsalResponse>(`/api/v1/rooms/${roomId}/rehearsals`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

export const uploadRehearsalAudio = (roomId: string, rid: string, beatId: string, audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, `beat-${beatId}.webm`);
  return apiFetch<{ text: string }>(`/api/v1/rooms/${roomId}/rehearsals/${rid}/audio?beat=${encodeURIComponent(beatId)}`, {
    method: 'POST',
    body: formData,
  });
};

export const finishRehearsal = (roomId: string, rid: string, req: FinishRehearsalRequest) =>
  apiFetch<RehearsalDetail>(`/api/v1/rooms/${roomId}/rehearsals/${rid}/finish`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

export const fetchRehearsalCoach = (roomId: string, rid: string) =>
  apiFetch<CoachFeedback>(`/api/v1/rooms/${roomId}/rehearsals/${rid}/coach`, {
    method: 'POST',
  });

export const fetchRehearsals = (roomId: string) =>
  apiFetch<RehearsalSummary[]>(`/api/v1/rooms/${roomId}/rehearsals`);

export const fetchRehearsalDetail = (roomId: string, rid: string) =>
  apiFetch<RehearsalDetail>(`/api/v1/rooms/${roomId}/rehearsals/${rid}`);

export const deleteRehearsal = (roomId: string, rid: string) =>
  apiFetch<void>(`/api/v1/rooms/${roomId}/rehearsals/${rid}`, {
    method: 'DELETE',
  });



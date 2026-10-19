import { apiFetch } from '@/api/client';

export interface QnaTeammateAnswer {
  userId: string;
  userName: string;
  handle: string;
  ownAnswer: string;
  updatedAt: string;
}

export interface QnaItem {
  id: string;
  hash: string;
  kind: 'QUESTION' | 'CODE' | 'TRUTH' | 'ASK';
  category: string;
  criterion?: string | null;
  question: string;
  answer?: string | null;
  followup?: string | null;
  counter?: string | null;
  proof?: string | null;
  ownerUserId?: string | null;
  ownerHandle?: string | null;
  source: 'DOC' | 'AI' | 'CUSTOM';
  myMastery: number; // 0 UNSEEN, 1 MISSED, 2 SHAKY, 3 SOLID
  teamMastery: number;
  myOwnAnswer?: string | null;
  myShared: boolean;
  sharedAnswers: QnaTeammateAnswer[];
  position: number;
}

export interface QnaCriterionLane {
  criterion: string;
  weight: number;
  total: number;
  solid: number;
  shaky: number;
  missed: number;
  unseen: number;
}

export interface QnaTeamMemberProgress {
  userId: string;
  userName: string;
  userHandle: string;
  practisedCount: number;
  solidCount: number;
  weakestOwnedCount: number;
}

export interface QnaMapResponse {
  totalQuestions: number;
  solidQuestions: number;
  solidPercent: number;
  weakestCriterion: string;
  weakestSolidCount: number;
  weakestTotalCount: number;
  lanes: QnaCriterionLane[];
  teamMembers: QnaTeamMemberProgress[];
  weakestOwnerHandle?: string | null;
  weakestOwnerCount: number;
}

export interface StartSessionRequest {
  size: number;
  focus: 'ALL' | 'WEAKEST' | 'WEIGHTED' | 'MINE' | 'CRITERION';
  criterion?: string;
  pressure: boolean;
  answerMode: 'THINK' | 'SPEAK' | 'TYPE';
  timerSec: number;
  persona: 'SKEPTICAL_ENGINEER' | 'BUSINESS' | 'DOMAIN_EXPERT' | 'FRIENDLY_MENTOR';
}

export interface StartSessionResponse {
  id: string;
  questions: QnaItem[];
  config: Record<string, any>;
}

export interface SubmitSessionAnswerRequest {
  hash: string;
  rating: number; // 1..3
  answerText?: string;
  durationMs?: number;
  followupShown?: boolean;
  coveredPoints?: string[];
}

export interface SessionSummary {
  counts: { solid: number; shaky: number; missed: number };
  avgAnswerMs: number;
  longestHesitation: number;
  weakestCriterion: string;
  revisit: string[];
}

export interface AiGradeResponse {
  score: number;
  verdict: string;
  missed: string[];
  better: string;
}

export const fetchQnaItems = (roomId: string) =>
  apiFetch<QnaItem[]>(`/api/v1/rooms/${roomId}/qna`);

export const fetchQnaMap = (roomId: string) =>
  apiFetch<QnaMapResponse>(`/api/v1/rooms/${roomId}/qna/map`);

export const updateMyQnaAnswer = (roomId: string, hash: string, req: { ownAnswer?: string; shared?: boolean }) =>
  apiFetch<void>(`/api/v1/rooms/${roomId}/qna/${hash}/mine`, {
    method: 'PUT',
    body: JSON.stringify(req),
  });

export const updateQnaMastery = (roomId: string, hash: string, level: number) =>
  apiFetch<void>(`/api/v1/rooms/${roomId}/qna/${hash}/mastery`, {
    method: 'PUT',
    body: JSON.stringify({ level }),
  });

export const createCustomQnaItem = (roomId: string, req: Partial<QnaItem>) =>
  apiFetch<QnaItem>(`/api/v1/rooms/${roomId}/qna/items`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

export const patchCustomQnaItem = (roomId: string, itemId: string, req: Partial<QnaItem>) =>
  apiFetch<QnaItem>(`/api/v1/rooms/${roomId}/qna/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(req),
  });

export const deleteCustomQnaItem = (roomId: string, itemId: string) =>
  apiFetch<void>(`/api/v1/rooms/${roomId}/qna/items/${itemId}`, {
    method: 'DELETE',
  });

export const startHotSeatSession = (roomId: string, req: StartSessionRequest) =>
  apiFetch<StartSessionResponse>(`/api/v1/rooms/${roomId}/qna/sessions`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

export const submitHotSeatAnswer = (roomId: string, sessionId: string, req: SubmitSessionAnswerRequest) =>
  apiFetch<void>(`/api/v1/rooms/${roomId}/qna/sessions/${sessionId}/answers`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

export const uploadHotSeatAudio = (roomId: string, sessionId: string, hash: string, audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, `qna-${hash}.webm`);
  return apiFetch<{ text: string }>(`/api/v1/rooms/${roomId}/qna/sessions/${sessionId}/audio?hash=${encodeURIComponent(hash)}`, {
    method: 'POST',
    body: formData,
  });
};

export const finishHotSeatSession = (roomId: string, sessionId: string) =>
  apiFetch<SessionSummary>(`/api/v1/rooms/${roomId}/qna/sessions/${sessionId}/finish`, {
    method: 'POST',
  });

export const aiGradeQnaAnswer = (roomId: string, hash: string, answerText: string) =>
  apiFetch<AiGradeResponse>(`/api/v1/rooms/${roomId}/qna/grade`, {
    method: 'POST',
    body: JSON.stringify({ hash, answerText }),
  });

export const aiGenerateMoreQna = (roomId: string, req: { criterion?: string; persona: string; count: number }) =>
  apiFetch<QnaItem[]>(`/api/v1/rooms/${roomId}/qna/more`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

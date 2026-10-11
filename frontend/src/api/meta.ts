import { apiClient } from '@/lib/apiClient';

export interface MetaLimits {
  ideaMaxChars: number;
  taskSummaryMax: number;
  docMaxChars: number;
  uploadMaxMb: number;
}

export interface MetaResponse {
  roles: string[];
  skills: string[];
  priorities: string[];
  taskStatuses: string[];
  retroTags: string[];
  diagramKinds: string[];
  pitchFormats: string[];
  crowdCliches: string[];
  timezones: string[];
  noteTypes: string[];
  limits: MetaLimits;
}

let cachedMeta: MetaResponse | null = null;

export async function fetchMeta(): Promise<MetaResponse> {
  if (cachedMeta) return cachedMeta;
  const meta = await apiClient<MetaResponse>('/api/v1/meta');
  cachedMeta = meta;
  return meta;
}

export function getCachedMeta(): MetaResponse | null {
  return cachedMeta;
}

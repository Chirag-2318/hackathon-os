import { apiFetch } from '@/api/client';

export type AuthType = 'NONE' | 'API_KEY' | 'BEARER' | 'OAUTH' | 'BASIC';
export type ApiStatus = 'WORKING' | 'FAILING' | 'UNKNOWN';
export type FallbackType = 'NONE' | 'MOCKED' | 'CACHED';
export type EndpointSource = 'MANUAL' | 'IMPORT' | 'PLAN';

export interface ExternalDto {
  id: string;
  roomId: string;
  name: string;
  baseUrl: string;
  authType: AuthType;
  keyLocation?: string;
  rateLimit?: string;
  cost?: string;
  ownerUserId?: string;
  status: ApiStatus;
  fallback: FallbackType;
  fallbackNotes?: string;
  docsUrl?: string;
  notes?: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EndpointDto {
  id: string;
  roomId: string;
  method: string;
  path: string;
  summary: string;
  description?: string;
  tag?: string;
  requestSchema?: any;
  responseSchemas?: any;
  parameters?: any;
  mockResponse?: any;
  mockStatus?: number;
  authRequired?: boolean;
  source: EndpointSource;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiHubSummaryResponse {
  mockedCount: number;
  cachedCount: number;
  noneCount: number;
  totalEndpoints: number;
  totalExternals: number;
}

export interface ImportApiResponse {
  success: boolean;
  dryRun: boolean;
  mode: string;
  endpointsFound: number;
  tags: string[];
  servers: string[];
  warnings: string[];
  created: number;
  updated: number;
  skipped: number;
  error?: string;
}

export interface ImportFromPlanResponse {
  success: boolean;
  count: number;
  message: string;
}

export interface ApiHubResponse {
  endpoints: EndpointDto[];
  externals: ExternalDto[];
  summary: ApiHubSummaryResponse;
}

export const apiHubService = {
  async getHub(roomId: string): Promise<ApiHubResponse> {
    return apiFetch<ApiHubResponse>(`/api/v1/rooms/${roomId}/api-hub`);
  },

  async getSummary(roomId: string): Promise<ApiHubSummaryResponse> {
    return apiFetch<ApiHubSummaryResponse>(`/api/v1/rooms/${roomId}/api-hub/summary`);
  },

  // External APIs
  async createExternal(roomId: string, req: Partial<ExternalDto>): Promise<ExternalDto> {
    return apiFetch<ExternalDto>(`/api/v1/rooms/${roomId}/api-hub/external`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async updateExternal(roomId: string, apiId: string, req: Partial<ExternalDto>): Promise<ExternalDto> {
    return apiFetch<ExternalDto>(`/api/v1/rooms/${roomId}/api-hub/external/${apiId}`, {
      method: 'PATCH',
      body: JSON.stringify(req),
    });
  },

  async deleteExternal(roomId: string, apiId: string): Promise<void> {
    return apiFetch<void>(`/api/v1/rooms/${roomId}/api-hub/external/${apiId}`, {
      method: 'DELETE',
    });
  },

  async checkExternal(roomId: string, apiId: string): Promise<ExternalDto> {
    return apiFetch<ExternalDto>(`/api/v1/rooms/${roomId}/api-hub/external/${apiId}/check`, {
      method: 'POST',
    });
  },

  // Our Endpoints
  async createEndpoint(roomId: string, req: Partial<EndpointDto>): Promise<EndpointDto> {
    return apiFetch<EndpointDto>(`/api/v1/rooms/${roomId}/api-hub/endpoints`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async updateEndpoint(roomId: string, endpointId: string, req: Partial<EndpointDto>): Promise<EndpointDto> {
    return apiFetch<EndpointDto>(`/api/v1/rooms/${roomId}/api-hub/endpoints/${endpointId}`, {
      method: 'PATCH',
      body: JSON.stringify(req),
    });
  },

  async deleteEndpoint(roomId: string, endpointId: string): Promise<void> {
    return apiFetch<void>(`/api/v1/rooms/${roomId}/api-hub/endpoints/${endpointId}`, {
      method: 'DELETE',
    });
  },

  // Import OpenAPI
  async importJson(roomId: string, req: { text?: string; mode?: string; dryRun?: boolean }): Promise<ImportApiResponse> {
    return apiFetch<ImportApiResponse>(`/api/v1/rooms/${roomId}/api-hub/import`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async importMultipart(roomId: string, formData: FormData): Promise<ImportApiResponse> {
    const res = await fetch(`/api/v1/rooms/${roomId}/api-hub/import`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Import failed');
    }
    return res.json();
  },

  // Seed from ARCHITECTURE.md
  async importFromPlan(roomId: string): Promise<ImportFromPlanResponse> {
    return apiFetch<ImportFromPlanResponse>(`/api/v1/rooms/${roomId}/api-hub/import-from-plan`, {
      method: 'POST',
    });
  },

  // OpenAPI spec
  async getOpenApiJson(roomId: string): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/api-hub/openapi.json`);
  },

  downloadOpenApi(roomId: string, format: 'json' | 'yaml') {
    const url = `/api/v1/rooms/${roomId}/api-hub/openapi.${format}?download=true`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `openapi.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};

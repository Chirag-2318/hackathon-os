/**
 * Tool Directory API client — S27
 * PRD 6a §4.3
 */
import type { ToolsResponse, ToolCategory, ToolCost, ToolLicense } from './types';

interface ToolFilters {
  category?: ToolCategory;
  cost?: ToolCost;
  license?: ToolLicense;
}

export async function fetchTools(filters?: ToolFilters): Promise<ToolsResponse> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.cost)     params.set('cost', filters.cost);
  if (filters?.license)  params.set('license', filters.license);

  const res = await fetch(`/api/v1/tools?${params.toString()}`);
  if (!res.ok) throw new Error(`fetchTools: ${res.status}`);
  return res.json() as Promise<ToolsResponse>;
}

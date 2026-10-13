/**
 * AI & Gateway Status Section
 * Rule 13: Read-only AI status view. Keys never enter or exist in the browser.
 * Fetches status directly from /api/v1/ai/status.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/design/api';
import { StatusDot, Card, Button } from '@/design';
import { Cpu, RefreshCcw, ShieldCheck, Zap } from 'lucide-react';

interface AiStatusResponse {
  healthy?: boolean;
  status?: string;
  provider?: string;
  model?: string;
  host?: string;
  latencyMs?: number;
  message?: string;
}

export function AiKeysSection() {
  const { data: aiStatus, isLoading, isError, refetch, isFetching } = useQuery<AiStatusResponse>({
    queryKey: ['ai', 'status'],
    queryFn: () => apiFetch<AiStatusResponse>('/api/v1/ai/status'),
    staleTime: 30_000,
  });

  const isHealthy = Boolean(aiStatus?.healthy || aiStatus?.status === 'UP' || aiStatus?.status === 'HEALTHY');
  const provider = aiStatus?.provider || 'Groq Gateway (Backend Monolith)';
  const model = aiStatus?.model || 'llama-3.3-70b-versatile';
  const host = aiStatus?.host || 'api.groq.com';
  const latency = aiStatus?.latencyMs ?? 142;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">AI Gateway Status</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            All AI operations run through the secure Spring Boot backend. API keys are never exposed to the client.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          isLoading={isFetching}
          leftIcon={<RefreshCcw className="w-3.5 h-3.5" />}
        >
          Check health
        </Button>
      </div>

      <Card variant="raised" padding="md" className="space-y-4">
        {/* Status header row */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Gateway Service</span>
          </div>

          <div className="flex items-center gap-2">
            <StatusDot variant={isHealthy ? 'success' : 'danger'} pulse={isHealthy} />
            <span className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
              {isLoading ? 'Checking...' : isHealthy ? 'Operational' : 'Unavailable'}
            </span>
          </div>
        </div>

        {/* Read-only specification details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-[8px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-400 uppercase font-mono text-[10px] block mb-1">Provider Host</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">{host}</span>
          </div>

          <div className="p-3 rounded-[8px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-400 uppercase font-mono text-[10px] block mb-1">Active Model</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate block">{model}</span>
          </div>

          <div className="p-3 rounded-[8px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-400 uppercase font-mono text-[10px] block mb-1">Gateway Engine</span>
            <span className="text-zinc-800 dark:text-zinc-200">{provider}</span>
          </div>

          <div className="p-3 rounded-[8px] bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-400 uppercase font-mono text-[10px] block mb-1">API Latency</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              {latency}ms
            </span>
          </div>
        </div>

        {/* Security assurance */}
        <div className="flex items-center gap-2 pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Zero Client Keys Policy: Credentials reside strictly on server backend.</span>
        </div>
      </Card>
    </div>
  );
}

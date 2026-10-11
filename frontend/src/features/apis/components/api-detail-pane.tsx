import { type ApiEndpoint } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Code2, ExternalLink } from 'lucide-react';

interface ApiDetailPaneProps {
  endpoint: ApiEndpoint | null;
}

export function ApiDetailPane({ endpoint }: ApiDetailPaneProps) {
  if (!endpoint) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-50 dark:bg-slate-900/50">
        <Code2 className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-medium">Select an endpoint</h3>
        <p className="text-sm">Choose an API from the list to view its details</p>
      </div>
    );
  }

  const getMethodColor = (method?: string) => {
    switch (method) {
      case 'GET': return 'bg-sky-500/20 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400';
      case 'POST': return 'bg-lime-500/20 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400';
      case 'PUT': return 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
      case 'PATCH': return 'bg-lavender-500/20 text-lavender-700 dark:bg-lavender-500/10 dark:text-lavender-400';
      case 'DELETE': return 'bg-coral-500/20 text-coral-700 dark:bg-coral-500/10 dark:text-coral-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {endpoint.method && (
              <Badge variant="secondary" className={`${getMethodColor(endpoint.method)} uppercase tracking-wider`}>
                {endpoint.method}
              </Badge>
            )}
            <h2 className="text-2xl font-semibold tracking-tight">{endpoint.name}</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-500 font-mono items-center">
            {endpoint.baseUrl}
            {endpoint.path}
            {endpoint.isExternal && <ExternalLink className="h-3 w-3 inline" />}
          </div>
          {endpoint.tags && endpoint.tags.length > 0 && (
            <div className="flex gap-2 mt-4">
              {endpoint.tags.map((tag: any) => (
                <Badge key={tag} variant="outline" className="text-slate-500">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Properties */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Authentication</h4>
            <p className="font-medium">{endpoint.auth}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Key Location</h4>
            <p className="font-mono text-sm">{endpoint.keyLocation}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Rate Limit</h4>
            <p className="font-medium">{endpoint.rateLimit}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cost</h4>
            <p className="font-medium">{endpoint.cost}</p>
          </Card>
        </div>

        {/* Examples */}
        {endpoint.requestExample && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Request Example</h4>
            <div className="bg-[#1C1C1E] rounded-md p-4 overflow-x-auto text-sm font-mono text-slate-300">
              <pre>{endpoint.requestExample}</pre>
            </div>
          </div>
        )}

        {endpoint.responseExample && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Response Example</h4>
            <div className="bg-[#1C1C1E] rounded-md p-4 overflow-x-auto text-sm font-mono text-slate-300">
              <pre>{endpoint.responseExample}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { type ApiEndpoint } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface ApiListPaneProps {
  endpoints: ApiEndpoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ApiListPane({ endpoints, selectedId, onSelect }: ApiListPaneProps) {
  const externalApis = endpoints.filter((e) => e.isExternal);
  const internalApis = endpoints.filter((e) => !e.isExternal);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Live': return 'text-emerald-500 fill-emerald-500';
      case 'Down': return 'text-rose-500 fill-rose-500';
      case 'Mocked': return 'text-amber-500 fill-amber-500';
      default: return 'text-slate-400 fill-slate-400';
    }
  };

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

  const renderList = (list: ApiEndpoint[]) => (
    <ul className="space-y-1">
      {list.map((api) => (
        <li key={api.id}>
          <button
            onClick={() => onSelect(api.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between group transition-colors ${
              selectedId === api.id
                ? 'bg-lavender-100 dark:bg-lavender-900/30 font-medium'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {api.method ? (
                <Badge variant="secondary" className={`text-[10px] px-1 py-0 h-4 rounded-sm ${getMethodColor(api.method)}`}>
                  {api.method}
                </Badge>
              ) : (
                <Circle className={`h-2 w-2 ${getStatusColor(api.status)}`} />
              )}
              <span className="truncate">{api.name}</span>
            </div>
            {api.fallbackType !== 'None' && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 ml-2 shrink-0">{api.fallbackType}</Badge>
            )}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="w-64 border-r bg-white dark:bg-[#1C1C1E] flex flex-col h-full overflow-y-auto">
      <div className="p-4 flex-1 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">External APIs</h3>
          {renderList(externalApis)}
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">Our Endpoints</h3>
          {renderList(internalApis)}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Circle, Plus, Upload, FileText, Loader2 } from 'lucide-react';
import type { ExternalDto, EndpointDto } from '../api/api-hub-service';

export type SelectedApiItem =
  | { type: 'external'; id: string; data: ExternalDto }
  | { type: 'endpoint'; id: string; data: EndpointDto };

interface ApiListPaneProps {
  externals: ExternalDto[];
  endpoints: EndpointDto[];
  selectedItem: SelectedApiItem | null;
  onSelect: (item: SelectedApiItem) => void;
  onAddExternal: () => void;
  onAddEndpoint: () => void;
  onOpenImport: () => void;
  onImportFromPlan: () => void;
  isImportingPlan: boolean;
}

export function ApiListPane({
  externals,
  endpoints,
  selectedItem,
  onSelect,
  onAddExternal,
  onAddEndpoint,
  onOpenImport,
  onImportFromPlan,
  isImportingPlan,
}: ApiListPaneProps) {
  const getStatusDot = (status: string) => {
    switch (status) {
      case 'WORKING':
        return 'text-emerald-500 fill-emerald-500';
      case 'FAILING':
        return 'text-rose-500 fill-rose-500';
      default:
        return 'text-slate-400 fill-slate-400';
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-sky-500/15 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border-sky-500/20';
      case 'POST':
        return 'bg-lime-500/15 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400 border-lime-500/20';
      case 'PUT':
        return 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/20';
      case 'PATCH':
        return 'bg-purple-500/15 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-500/20';
      case 'DELETE':
        return 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="w-80 border-r border-border bg-surface flex flex-col h-full overflow-y-auto shrink-0 select-none">
      <div className="p-4 space-y-6">
        {/* GROUP 1: External APIs */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                External APIs
              </h3>
              <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                {externals.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddExternal}
              className="h-6 px-1.5 text-xs text-primary hover:text-primary gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </Button>
          </div>

          {externals.length === 0 ? (
            <div className="p-3 text-center border border-dashed border-border/70 rounded-lg my-1">
              <p className="text-xs text-muted-foreground mb-2">No external APIs</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddExternal}
                className="h-7 text-xs w-full gap-1"
              >
                <Plus className="h-3 w-3" /> Add external API
              </Button>
            </div>
          ) : (
            <ul className="space-y-1">
              {externals.map((api) => {
                const isSelected = selectedItem?.type === 'external' && selectedItem.id === api.id;
                return (
                  <li key={api.id}>
                    <button
                      type="button"
                      onClick={() => onSelect({ type: 'external', id: api.id, data: api })}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center justify-between group transition-colors border ${
                        isSelected
                          ? 'bg-accent/80 text-accent-foreground border-border font-medium'
                          : 'border-transparent text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <Circle className={`h-2 w-2 shrink-0 ${getStatusDot(api.status)}`} />
                        <span className="truncate font-medium">{api.name}</span>
                        {api.authType && api.authType !== 'NONE' && (
                          <span className="text-[10px] text-muted-foreground shrink-0 uppercase">
                            {api.authType.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 font-normal ml-1 shrink-0 capitalize border-border/80"
                      >
                        {api.fallback.toLowerCase()}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* GROUP 2: Our Endpoints */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Our Endpoints
              </h3>
              <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                {endpoints.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddEndpoint}
              className="h-6 px-1.5 text-xs text-primary hover:text-primary gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </Button>
          </div>

          {endpoints.length === 0 ? (
            <div className="p-3 text-center border border-dashed border-border/70 rounded-lg my-1 space-y-2">
              <p className="text-xs text-muted-foreground">No endpoints defined yet</p>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddEndpoint}
                  className="h-7 text-xs w-full gap-1"
                >
                  <Plus className="h-3 w-3" /> Add endpoint
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenImport}
                  className="h-7 text-xs w-full gap-1"
                >
                  <Upload className="h-3 w-3" /> Import a spec
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onImportFromPlan}
                  disabled={isImportingPlan}
                  className="h-7 text-xs w-full gap-1 text-primary hover:text-primary"
                >
                  {isImportingPlan ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  Import from the architecture doc
                </Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-1">
              {endpoints.map((ep) => {
                const isSelected = selectedItem?.type === 'endpoint' && selectedItem.id === ep.id;
                return (
                  <li key={ep.id}>
                    <button
                      type="button"
                      onClick={() => onSelect({ type: 'endpoint', id: ep.id, data: ep })}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex flex-col gap-1 group transition-colors border ${
                        isSelected
                          ? 'bg-accent/80 text-accent-foreground border-border font-medium'
                          : 'border-transparent text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono font-semibold px-1 py-0 h-4 rounded ${getMethodBadge(
                            ep.method
                          )}`}
                        >
                          {ep.method}
                        </Badge>
                        <span className="font-mono text-foreground truncate font-medium">
                          {ep.path}
                        </span>
                      </div>
                      {ep.summary && (
                        <p className="text-[11px] text-muted-foreground truncate pl-1">
                          {ep.summary}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

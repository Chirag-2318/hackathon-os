import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiHubService, type ApiHubResponse, type FallbackType } from './api/api-hub-service';
import { ApiListPane, type SelectedApiItem } from './components/api-list-pane';
import { ApiDetailPane } from './components/api-detail-pane';
import { SwaggerView } from './components/swagger-view';
import { ImportSpecDialog } from './components/import-spec-dialog';
import { ApiModalForm } from './components/api-modal-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Search,
  Code2,
  Upload,
  AlertCircle,
  WifiOff,
  FilterX,
  FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ApiPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'endpoints' | 'swagger'>('endpoints');
  const [search, setSearch] = useState('');
  const [fallbackFilter, setFallbackFilter] = useState<FallbackType | null>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedApiItem | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Modal dialog states
  const [importOpen, setImportOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add-external' | 'edit-external' | 'add-endpoint' | 'edit-endpoint'>('add-endpoint');
  const [isImportingPlan, setIsImportingPlan] = useState(false);

  // Query API Hub data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ApiHubResponse>({
    queryKey: ['api-hub', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Missing room ID');
      try {
        const res = await apiHubService.getHub(roomId);
        try {
          localStorage.setItem(`api_hub_cache_${roomId}`, JSON.stringify(res));
        } catch (e) {}
        return res;
      } catch (err) {
        const cached = localStorage.getItem(`api_hub_cache_${roomId}`);
        if (cached) {
          return JSON.parse(cached);
        }
        throw err;
      }
    },
    enabled: !!roomId,
    staleTime: 30000,
  });

  const externals = useMemo(() => data?.externals || [], [data?.externals]);
  const endpoints = useMemo(() => data?.endpoints || [], [data?.endpoints]);
  const summary = data?.summary;

  // Filtered lists
  const filteredExternals = useMemo(() => {
    let list = externals;
    if (fallbackFilter) {
      list = list.filter((e) => e.fallback === fallbackFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.baseUrl.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [externals, fallbackFilter, search]);

  const filteredEndpoints = useMemo(() => {
    let list = endpoints;
    if (fallbackFilter) {
      if (fallbackFilter === 'MOCKED') {
        list = list.filter((e) => e.mockResponse != null);
      } else if (fallbackFilter === 'NONE') {
        list = list.filter((e) => e.mockResponse == null);
      } else {
        list = [];
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.path.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.method.toLowerCase().includes(q) ||
          (e.tag && e.tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [endpoints, fallbackFilter, search]);

  // Sync selected item
  useEffect(() => {
    if (!selectedItem) {
      if (filteredEndpoints.length > 0) {
        setSelectedItem({ type: 'endpoint', id: filteredEndpoints[0].id, data: filteredEndpoints[0] });
      } else if (filteredExternals.length > 0) {
        setSelectedItem({ type: 'external', id: filteredExternals[0].id, data: filteredExternals[0] });
      }
    } else {
      if (selectedItem.type === 'endpoint') {
        const fresh = endpoints.find((e) => e.id === selectedItem.id);
        if (fresh) setSelectedItem({ type: 'endpoint', id: fresh.id, data: fresh });
      } else {
        const fresh = externals.find((e) => e.id === selectedItem.id);
        if (fresh) setSelectedItem({ type: 'external', id: fresh.id, data: fresh });
      }
    }
  }, [endpoints, externals, filteredEndpoints, filteredExternals, selectedItem]);

  const handleSelectItem = (item: SelectedApiItem) => {
    setSelectedItem(item);
    if (window.innerWidth < 1024) {
      setMobileSheetOpen(true);
    }
  };

  const handleImportFromPlan = async () => {
    if (!roomId) return;
    setIsImportingPlan(true);
    try {
      const res = await apiHubService.importFromPlan(roomId);
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['api-hub', roomId] });
    } catch (err: any) {
      toast.error(err?.message || 'No API contract found in ARCHITECTURE.md');
    } finally {
      setIsImportingPlan(false);
    }
  };

  const handleDeleteItem = async (item: SelectedApiItem) => {
    if (!roomId) return;
    if (!confirm(`Are you sure you want to delete ${item.type === 'external' ? item.data.name : item.data.path}?`)) {
      return;
    }
    try {
      if (item.type === 'external') {
        await apiHubService.deleteExternal(roomId, item.id);
      } else {
        await apiHubService.deleteEndpoint(roomId, item.id);
      }
      toast.success('Deleted successfully');
      setSelectedItem(null);
      setMobileSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['api-hub', roomId] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col p-6 space-y-4 bg-background">
        <Skeleton className="h-10 w-48" />
        <div className="flex flex-1 gap-4">
          <Skeleton className="w-80 h-full" />
          <Skeleton className="flex-1 h-full" />
        </div>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h2 className="text-base font-semibold text-foreground mb-1">Failed to load API Hub</h2>
        <p className="text-xs text-muted-foreground mb-4 max-w-sm">{(error as any)?.message || 'An error occurred'}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-full h-full bg-page">
      {/* Top Header */}
      <div className="h-14 border-b border-border bg-page flex items-center px-4 sm:px-6 shrink-0 justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-normal tracking-tight text-foreground">API Hub</h1>
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('endpoints')}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                viewMode === 'endpoints' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Endpoints & Specs
            </button>
            <button
              type="button"
              onClick={() => setViewMode('swagger')}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                viewMode === 'swagger' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Code2 className="size-3.5" />
              <span>Swagger UI</span>
            </button>
          </div>
        </div>

        {viewMode === 'endpoints' && (
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search APIs & endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        )}
      </div>

      {viewMode === 'swagger' ? (
        <SwaggerView
          roomId={roomId || ''}
          hasEndpoints={endpoints.length > 0}
          onOpenImport={() => setImportOpen(true)}
          onOpenAddEndpoint={() => {
            setFormMode('add-endpoint');
            setFormOpen(true);
          }}
        />
      ) : (
        <div className="flex flex-1 min-h-0 h-full">
          {/* Left List Pane */}
          <ApiListPane
            externals={filteredExternals}
            endpoints={filteredEndpoints}
            selectedItem={selectedItem}
            onSelect={handleSelectItem}
            onAddExternal={() => {
              setFormMode('add-external');
              setFormOpen(true);
            }}
            onAddEndpoint={() => {
              setFormMode('add-endpoint');
              setFormOpen(true);
            }}
            onOpenImport={() => setImportOpen(true)}
            onImportFromPlan={handleImportFromPlan}
            isImportingPlan={isImportingPlan}
          />

          {/* Center Detail Pane (Desktop) */}
          <div className="hidden lg:flex flex-1 min-h-0 h-full overflow-hidden bg-page">
            <ApiDetailPane
              selectedItem={selectedItem}
              onEdit={(item) => {
                setFormMode(item.type === 'external' ? 'edit-external' : 'edit-endpoint');
                setFormOpen(true);
              }}
              onDelete={handleDeleteItem}
            />
          </div>

          {/* Right Fallbacks Panel */}
          <div className="w-72 border-l border-border bg-surface p-5 overflow-y-auto hidden xl:block shrink-0 h-full">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              API Fallbacks
            </h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Strategy
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Always have a mock or cached fallback for external APIs to survive demo day if rate limits are hit or wifi fails.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Current Coverage
                  </h4>
                  {fallbackFilter && (
                    <button
                      onClick={() => setFallbackFilter(null)}
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    >
                      <FilterX className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>

                <div
                  onClick={() => setFallbackFilter(fallbackFilter === 'MOCKED' ? null : 'MOCKED')}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-xs",
                    fallbackFilter === 'MOCKED'
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border/70 hover:bg-muted/50"
                  )}
                >
                  <span className="text-foreground">Mocked</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {summary?.mockedCount ?? 0}
                  </Badge>
                </div>

                <div
                  onClick={() => setFallbackFilter(fallbackFilter === 'CACHED' ? null : 'CACHED')}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-xs",
                    fallbackFilter === 'CACHED'
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border/70 hover:bg-muted/50"
                  )}
                >
                  <span className="text-foreground">Cached</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {summary?.cachedCount ?? 0}
                  </Badge>
                </div>

                <div
                  onClick={() => setFallbackFilter(fallbackFilter === 'NONE' ? null : 'NONE')}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-xs",
                    fallbackFilter === 'NONE'
                      ? "border-amber-500 bg-amber-500/10 font-medium"
                      : "border-border/70 hover:bg-muted/50"
                  )}
                >
                  <span className="text-foreground">None</span>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-xs">
                    {summary?.noneCount ?? 0}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportOpen(true)}
                  className="w-full text-xs h-8 gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" /> Import OpenAPI Spec
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Detail Sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="right" className="p-0 sm:max-w-lg w-full flex flex-col">
          <SheetHeader className="p-4 border-b border-border/60">
            <SheetTitle className="text-sm font-semibold">API Details</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <ApiDetailPane
              selectedItem={selectedItem}
              onEdit={(item) => {
                setFormMode(item.type === 'external' ? 'edit-external' : 'edit-endpoint');
                setFormOpen(true);
              }}
              onDelete={handleDeleteItem}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Import Spec Dialog */}
      <ImportSpecDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        roomId={roomId || ''}
        onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['api-hub', roomId] })}
      />

      {/* Add / Edit Drawer Modal */}
      <ApiModalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        roomId={roomId || ''}
        mode={formMode}
        initialExternal={selectedItem?.type === 'external' ? selectedItem.data : null}
        initialEndpoint={selectedItem?.type === 'endpoint' ? selectedItem.data : null}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['api-hub', roomId] })}
      />
    </div>
  );
}

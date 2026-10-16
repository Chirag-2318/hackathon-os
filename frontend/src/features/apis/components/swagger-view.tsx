import React, { Suspense, useState, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Upload, AlertCircle, Info } from 'lucide-react';
import { apiHubService } from '../api/api-hub-service';
import 'swagger-ui-react/swagger-ui.css';

const LazySwaggerUI = React.lazy(() => import('swagger-ui-react'));

interface SwaggerViewProps {
  roomId: string;
  hasEndpoints: boolean;
  onOpenImport: () => void;
  onOpenAddEndpoint: () => void;
}

export function SwaggerView({
  roomId,
  hasEndpoints,
  onOpenImport,
  onOpenAddEndpoint,
}: SwaggerViewProps) {
  const { theme } = useTheme();
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiHubService
      .getOpenApiJson(roomId)
      .then((data) => {
        if (mounted) {
          setSpec(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.message || 'Failed to load OpenAPI spec');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <span className="text-sm">Rendering Swagger UI...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">Failed to load API spec</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            apiHubService.getOpenApiJson(roomId).then(setSpec).finally(() => setLoading(false));
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const paths = spec?.paths ? Object.keys(spec.paths) : [];
  if (!hasEndpoints || paths.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
          <Upload className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No API endpoints in spec</h3>
        <p className="text-xs text-muted-foreground mb-6">
          Import an OpenAPI (Swagger) spec file, seed from your ARCHITECTURE.md doc, or manually add your first endpoint to preview it here.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onOpenImport} className="gap-2 text-xs">
            <Upload className="h-3.5 w-3.5" />
            Import Spec
          </Button>
          <Button variant="default" size="sm" onClick={onOpenAddEndpoint} className="gap-2 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Endpoint
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto bg-background swagger-container ${isDark ? 'swagger-dark' : 'swagger-light'}`}>
      {/* Notice Banner */}
      <div className="mx-6 mt-4 p-3 rounded-lg border border-border/80 bg-muted/40 flex items-center gap-2.5 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 text-primary" />
        <span>Requests are not sent from the browser. Use the saved mock responses.</span>
      </div>

      <div className="p-4 sm:p-6">
        <Suspense
          fallback={
            <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading Swagger UI components...
            </div>
          }
        >
          <LazySwaggerUI
            spec={spec}
            docExpansion="list"
            defaultModelsExpandDepth={-1}
            supportedSubmitMethods={[]}
          />
        </Suspense>
      </div>

      <style>{`
        /* Hide Topbar and Server Selector */
        .swagger-container .swagger-ui .topbar { display: none !important; }
        .swagger-container .swagger-ui .servers { display: none !important; }
        .swagger-container .swagger-ui .try-out { display: none !important; }
        .swagger-container .swagger-ui .btn.execute { display: none !important; }
        .swagger-container .swagger-ui .information-container { padding: 0 0 16px 0 !important; }
        .swagger-container .swagger-ui .scheme-container { display: none !important; }

        /* General container resets */
        .swagger-container .swagger-ui {
          color: hsl(var(--foreground)) !important;
          font-family: inherit !important;
        }

        /* Dark Mode Overrides */
        .swagger-dark .swagger-ui {
          filter: invert(88%) hue-rotate(180deg);
        }
        .swagger-dark .swagger-ui .opblock {
          border-radius: 8px !important;
        }
        .swagger-dark .swagger-ui img {
          filter: invert(100%) hue-rotate(180deg);
        }
      `}</style>
    </div>
  );
}

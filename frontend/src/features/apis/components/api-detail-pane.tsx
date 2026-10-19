import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Code2,
  ExternalLink,
  Edit2,
  Trash2,
  Shield,
  Clock,
  DollarSign,
  Key,
  Copy,
  Check,
  Circle,
  HelpCircle,
} from 'lucide-react';
import type { SelectedApiItem } from './api-list-pane';
import { toast } from 'sonner';

interface ApiDetailPaneProps {
  selectedItem: SelectedApiItem | null;
  onEdit: (item: SelectedApiItem) => void;
  onDelete: (item: SelectedApiItem) => void;
}

export function ApiDetailPane({ selectedItem, onEdit, onDelete }: ApiDetailPaneProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeRespTab, setActiveRespTab] = useState<string>('200');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  if (!selectedItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-page">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
          <Code2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Select an API or endpoint</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Choose an external API or endpoint from the left sidebar to view its contract, credentials reference, schemas, and mock responses.
        </p>
      </div>
    );
  }

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

  // 1. External API Detail View
  if (selectedItem.type === 'external') {
    const ext = selectedItem.data;
    return (
      <div className="flex-1 overflow-y-auto p-6 bg-page space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5">
              <Circle className={`h-2.5 w-2.5 ${getStatusDot(ext.status)}`} />
              <h2 className="text-xl font-semibold tracking-tight text-foreground truncate">
                {ext.name}
              </h2>
              <Badge variant="outline" className="text-xs uppercase">
                {ext.authType.replace('_', ' ')}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                Fallback: {ext.fallback.toLowerCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>{ext.baseUrl}</span>
              {ext.docsUrl && (
                <a
                  href={ext.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 font-sans"
                >
                  <ExternalLink className="h-3 w-3" /> Docs
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(selectedItem)}
              className="h-8 text-xs gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(selectedItem)}
              className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>

        {/* Property Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 border-border/60 bg-card">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <Key className="h-3.5 w-3.5 text-primary" />
              <span>Key Location</span>
            </div>
            <p className="font-mono text-xs text-foreground bg-muted/60 p-2 rounded">
              {ext.keyLocation || 'No key required or configured'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Secrets are stored in .env or secret managers — never committed to the database.
            </p>
          </Card>

          <Card className="p-4 border-border/60 bg-card">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Fallback Strategy</span>
            </div>
            <p className="text-xs font-medium text-foreground capitalize">
              {ext.fallback.toLowerCase()}
            </p>
            {ext.fallbackNotes && (
              <p className="text-xs text-muted-foreground mt-1 bg-muted/40 p-2 rounded">
                {ext.fallbackNotes}
              </p>
            )}
          </Card>

          <Card className="p-4 border-border/60 bg-card">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Rate Limit</span>
            </div>
            <p className="text-xs text-foreground">{ext.rateLimit || 'Not specified'}</p>
          </Card>

          <Card className="p-4 border-border/60 bg-card">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span>Cost Model</span>
            </div>
            <p className="text-xs text-foreground">{ext.cost || 'Free / Unspecified'}</p>
          </Card>
        </div>

        {ext.notes && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </h4>
            <div className="p-3 rounded-lg border border-border/60 bg-muted/30 text-xs text-foreground">
              {ext.notes}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Our Endpoint Detail View
  const ep = selectedItem.data;
  const responseMap: Record<string, any> =
    ep.responseSchemas && typeof ep.responseSchemas === 'object'
      ? ep.responseSchemas
      : { '200': { description: 'Successful response' } };
  const respCodes = Object.keys(responseMap);
  const currentRespCode = respCodes.includes(activeRespTab) ? activeRespTab : respCodes[0] || '200';

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-page space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border/60 pb-5">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${getMethodBadge(
                ep.method
              )}`}
            >
              {ep.method}
            </Badge>
            <h2 className="text-xl font-mono font-medium tracking-tight text-foreground truncate">
              {ep.path}
            </h2>
            {ep.tag && (
              <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
                {ep.tag}
              </Badge>
            )}
            {ep.authRequired && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Shield className="h-3 w-3" /> Auth Required
              </Badge>
            )}
          </div>
          {ep.summary && <p className="text-xs text-muted-foreground">{ep.summary}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(selectedItem)}
            className="h-8 text-xs gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(selectedItem)}
            className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {ep.description && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Description
          </h4>
          <p className="text-xs text-foreground bg-muted/20 p-3 rounded-lg border border-border/50">
            {ep.description}
          </p>
        </div>
      )}

      {/* Mock Response & Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Saved Mock Response
            </h4>
            <Badge variant="secondary" className="font-mono text-xs">
              Status {ep.mockStatus || 200}
            </Badge>
          </div>
          {ep.mockResponse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(JSON.stringify(ep.mockResponse, null, 2), 'mock')
              }
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              {copied === 'mock' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>{copied === 'mock' ? 'Copied' : 'Copy Mock'}</span>
            </Button>
          )}
        </div>
        <div className="rounded-lg border border-border/80 bg-card p-4 overflow-x-auto font-mono text-xs text-foreground">
          {ep.mockResponse ? (
            <pre>{JSON.stringify(ep.mockResponse, null, 2)}</pre>
          ) : (
            <span className="text-muted-foreground italic">No mock response saved</span>
          )}
        </div>
      </div>

      {/* Request Schema */}
      {ep.requestSchema && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Request Schema
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(JSON.stringify(ep.requestSchema, null, 2), 'req')
              }
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              {copied === 'req' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>{copied === 'req' ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
          <div className="rounded-lg border border-border/80 bg-card p-4 overflow-x-auto font-mono text-xs text-foreground">
            <pre>{JSON.stringify(ep.requestSchema, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Response Schemas */}
      {respCodes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Response Schemas
            </h4>
            <div className="flex items-center gap-1.5">
              {respCodes.map((code) => (
                <button
                  key={code}
                  onClick={() => setActiveRespTab(code)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    currentRespCode === code
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border/80 bg-card p-4 overflow-x-auto font-mono text-xs text-foreground">
            <pre>
              {JSON.stringify(responseMap[currentRespCode] || responseMap, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

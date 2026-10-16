import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ConflictBanner } from '@/design';
import { Loader2, Plus, Trash2, Eye, AlertCircle } from 'lucide-react';
import {
  apiHubService,
  type ExternalDto,
  type EndpointDto,
  type AuthType,
  type ApiStatus,
  type FallbackType,
} from '../api/api-hub-service';
import { toast } from 'sonner';

type FormMode = 'add-external' | 'edit-external' | 'add-endpoint' | 'edit-endpoint';

interface ApiModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  mode: FormMode;
  initialExternal?: ExternalDto | null;
  initialEndpoint?: EndpointDto | null;
  onSuccess: () => void;
}

export function ApiModalForm({
  open,
  onOpenChange,
  roomId,
  mode,
  initialExternal,
  initialEndpoint,
  onSuccess,
}: ApiModalFormProps) {
  const isExternal = mode.includes('external');
  const isEditing = mode.includes('edit');

  // External API Form State
  const [extName, setExtName] = useState('');
  const [extBaseUrl, setExtBaseUrl] = useState('');
  const [extAuthType, setExtAuthType] = useState<AuthType>('NONE');
  const [extKeyLocation, setExtKeyLocation] = useState('');
  const [extRateLimit, setExtRateLimit] = useState('');
  const [extCost, setExtCost] = useState('');
  const [extStatus, setExtStatus] = useState<ApiStatus>('WORKING');
  const [extFallback, setExtFallback] = useState<FallbackType>('NONE');
  const [extFallbackNotes, setExtFallbackNotes] = useState('');
  const [extDocsUrl, setExtDocsUrl] = useState('');
  const [extNotes, setExtNotes] = useState('');

  // Endpoint Form State
  const [endMethod, setEndMethod] = useState('GET');
  const [endPath, setEndPath] = useState('');
  const [endSummary, setEndSummary] = useState('');
  const [endDescription, setEndDescription] = useState('');
  const [endTag, setEndTag] = useState('');
  const [endAuthRequired, setEndAuthRequired] = useState(false);
  const [endMockStatus, setEndMockStatus] = useState(200);
  const [endMockResponse, setEndMockResponse] = useState('{\n  "status": "ok"\n}');
  const [endRequestSchema, setEndRequestSchema] = useState('');
  const [endResponseCode, setEndResponseCode] = useState('200');
  const [endResponses, setEndResponses] = useState<Record<string, string>>({
    '200': '{\n  "description": "Successful response"\n}',
  });

  // UI / Concurrency states
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showMockPreview, setShowMockPreview] = useState(false);

  // Sync initial state on open
  useEffect(() => {
    if (open) {
      setConflict(null);
      setJsonError(null);
      setShowMockPreview(false);

      if (isExternal && initialExternal) {
        setExtName(initialExternal.name || '');
        setExtBaseUrl(initialExternal.baseUrl || '');
        setExtAuthType(initialExternal.authType || 'NONE');
        setExtKeyLocation(initialExternal.keyLocation || '');
        setExtRateLimit(initialExternal.rateLimit || '');
        setExtCost(initialExternal.cost || '');
        setExtStatus(initialExternal.status || 'WORKING');
        setExtFallback(initialExternal.fallback || 'NONE');
        setExtFallbackNotes(initialExternal.fallbackNotes || '');
        setExtDocsUrl(initialExternal.docsUrl || '');
        setExtNotes(initialExternal.notes || '');
      } else if (isExternal) {
        setExtName('');
        setExtBaseUrl('');
        setExtAuthType('NONE');
        setExtKeyLocation('');
        setExtRateLimit('');
        setExtCost('');
        setExtStatus('WORKING');
        setExtFallback('NONE');
        setExtFallbackNotes('');
        setExtDocsUrl('');
        setExtNotes('');
      } else if (!isExternal && initialEndpoint) {
        setEndMethod(initialEndpoint.method || 'GET');
        setEndPath(initialEndpoint.path || '');
        setEndSummary(initialEndpoint.summary || '');
        setEndDescription(initialEndpoint.description || '');
        setEndTag(initialEndpoint.tag || '');
        setEndAuthRequired(!!initialEndpoint.authRequired);
        setEndMockStatus(initialEndpoint.mockStatus || 200);
        setEndMockResponse(
          initialEndpoint.mockResponse
            ? JSON.stringify(initialEndpoint.mockResponse, null, 2)
            : '{\n  "status": "ok"\n}'
        );
        setEndRequestSchema(
          initialEndpoint.requestSchema
            ? JSON.stringify(initialEndpoint.requestSchema, null, 2)
            : ''
        );
        if (initialEndpoint.responseSchemas && typeof initialEndpoint.responseSchemas === 'object') {
          const respMap: Record<string, string> = {};
          for (const [k, v] of Object.entries(initialEndpoint.responseSchemas)) {
            respMap[k] = JSON.stringify(v, null, 2);
          }
          setEndResponses(respMap);
          const firstCode = Object.keys(respMap)[0] || '200';
          setEndResponseCode(firstCode);
        } else {
          setEndResponses({ '200': '{\n  "description": "Successful response"\n}' });
          setEndResponseCode('200');
        }
      } else {
        setEndMethod('GET');
        setEndPath('/');
        setEndSummary('');
        setEndDescription('');
        setEndTag('General');
        setEndAuthRequired(false);
        setEndMockStatus(200);
        setEndMockResponse('{\n  "status": "ok"\n}');
        setEndRequestSchema('');
        setEndResponses({ '200': '{\n  "description": "Successful response"\n}' });
        setEndResponseCode('200');
      }
    }
  }, [open, mode, initialExternal, initialEndpoint, isExternal]);

  const validateJson = (str: string, fieldName: string): any => {
    if (!str.trim()) return null;
    try {
      return JSON.parse(str);
    } catch (e: any) {
      throw new Error(`Invalid JSON in ${fieldName}: ${e.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setConflict(null);
    setJsonError(null);

    try {
      if (isExternal) {
        if (!extName.trim()) throw new Error('Name is required');
        if (!extBaseUrl.trim()) throw new Error('Base URL is required');

        const payload: Partial<ExternalDto> = {
          name: extName.trim(),
          baseUrl: extBaseUrl.trim(),
          authType: extAuthType,
          keyLocation: extKeyLocation.trim(),
          rateLimit: extRateLimit.trim(),
          cost: extCost.trim(),
          status: extStatus,
          fallback: extFallback,
          fallbackNotes: extFallbackNotes.trim(),
          docsUrl: extDocsUrl.trim(),
          notes: extNotes.trim(),
          version: isEditing ? initialExternal?.version : 0,
        };

        if (isEditing && initialExternal) {
          await apiHubService.updateExternal(roomId, initialExternal.id, payload);
          toast.success(`Updated ${extName}`);
        } else {
          await apiHubService.createExternal(roomId, payload);
          toast.success(`Created external API ${extName}`);
        }
      } else {
        if (!endPath.trim().startsWith('/')) {
          throw new Error('Path must begin with "/" (e.g. /api/users)');
        }
        if (!endSummary.trim()) {
          throw new Error('Summary is required');
        }

        const parsedMock = validateJson(endMockResponse, 'Mock Response');
        const parsedReq = validateJson(endRequestSchema, 'Request Body Schema');

        const parsedResponses: Record<string, any> = {};
        for (const [code, val] of Object.entries(endResponses)) {
          if (val && val.trim()) {
            parsedResponses[code] = validateJson(val, `Response Schema (${code})`);
          }
        }

        const payload: Partial<EndpointDto> = {
          method: endMethod.toUpperCase(),
          path: endPath.trim(),
          summary: endSummary.trim(),
          description: endDescription.trim(),
          tag: endTag.trim() || 'General',
          authRequired: endAuthRequired,
          mockStatus: Number(endMockStatus) || 200,
          mockResponse: parsedMock,
          requestSchema: parsedReq,
          responseSchemas: parsedResponses,
          version: isEditing ? initialEndpoint?.version : 0,
        };

        if (isEditing && initialEndpoint) {
          await apiHubService.updateEndpoint(roomId, initialEndpoint.id, payload);
          toast.success(`Updated ${endMethod} ${endPath}`);
        } else {
          await apiHubService.createEndpoint(roomId, payload);
          toast.success(`Created ${endMethod} ${endPath}`);
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      if (err?.status === 409 || err?.message?.includes('conflict') || err?.message?.includes('VERSION')) {
        setConflict('This item was modified by another teammate. Please reload before saving.');
      } else {
        setJsonError(err?.message || 'Failed to save item');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {isExternal
              ? isEditing
                ? 'Edit External API'
                : 'Add External API'
              : isEditing
              ? 'Edit Endpoint'
              : 'Add Endpoint'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isExternal
              ? 'External dependency with key storage reference and demo fallback strategy.'
              : 'Our internal API endpoint with request/response schemas and mock data.'}
          </DialogDescription>
        </DialogHeader>

        {conflict && (
          <div className="mb-2">
            <ConflictBanner
              lastEditedBy="Another teammate"
              remoteContent="The server version of this resource was updated by another team member."
              localContent="Your current edits in this form."
              onKeepMine={() => {
                setConflict(null);
              }}
              onUseRemote={() => {
                setConflict(null);
                onSuccess();
                onOpenChange(false);
              }}
            />
          </div>
        )}

        {jsonError && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{jsonError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-xs">
          {/* EXTERNAL API FIELDS */}
          {isExternal && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">API Name *</Label>
                  <Input
                    placeholder="e.g. Stripe, OpenAI, Resend"
                    value={extName}
                    onChange={(e) => setExtName(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Base URL *</Label>
                  <Input
                    placeholder="https://api.stripe.com/v1"
                    value={extBaseUrl}
                    onChange={(e) => setExtBaseUrl(e.target.value)}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Auth Type</Label>
                  <Select value={extAuthType} onValueChange={(v) => setExtAuthType(v as AuthType)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None / Public</SelectItem>
                      <SelectItem value="API_KEY">API Key</SelectItem>
                      <SelectItem value="BEARER">Bearer Token</SelectItem>
                      <SelectItem value="OAUTH">OAuth 2.0</SelectItem>
                      <SelectItem value="BASIC">Basic Auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Key Location Hint</Label>
                  <Input
                    placeholder='.env: STRIPE_SECRET_KEY'
                    value={extKeyLocation}
                    onChange={(e) => setExtKeyLocation(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Note: Secrets and actual API keys are never stored here.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={extStatus} onValueChange={(v) => setExtStatus(v as ApiStatus)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WORKING">Working (Live)</SelectItem>
                      <SelectItem value="FAILING">Failing</SelectItem>
                      <SelectItem value="UNKNOWN">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fallback Strategy</Label>
                  <Select value={extFallback} onValueChange={(v) => setExtFallback(v as FallbackType)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="MOCKED">Mocked</SelectItem>
                      <SelectItem value="CACHED">Cached</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Rate Limit</Label>
                  <Input
                    placeholder="e.g. 100 req/min"
                    value={extRateLimit}
                    onChange={(e) => setExtRateLimit(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cost</Label>
                  <Input
                    placeholder="e.g. Free tier / $0.002 per token"
                    value={extCost}
                    onChange={(e) => setExtCost(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Fallback Notes</Label>
                <Input
                  placeholder="Notes on fallback behavior if the provider is down..."
                  value={extFallbackNotes}
                  onChange={(e) => setExtFallbackNotes(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Docs URL</Label>
                <Input
                  placeholder="https://docs.stripe.com/api"
                  value={extDocsUrl}
                  onChange={(e) => setExtDocsUrl(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </>
          )}

          {/* ENDPOINT FIELDS */}
          {!isExternal && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">Method</Label>
                  <Select value={endMethod} onValueChange={setEndMethod}>
                    <SelectTrigger className="h-8 text-xs font-mono font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Path *</Label>
                  <Input
                    placeholder="/api/v1/resource"
                    value={endPath}
                    onChange={(e) => setEndPath(e.target.value)}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Summary *</Label>
                  <Input
                    placeholder="Brief description of operation"
                    value={endSummary}
                    onChange={(e) => setEndSummary(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">Tag</Label>
                  <Input
                    placeholder="e.g. Users, Auth, Payments"
                    value={endTag}
                    onChange={(e) => setEndTag(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Switch
                  id="auth-req"
                  checked={endAuthRequired}
                  onCheckedChange={setEndAuthRequired}
                />
                <Label htmlFor="auth-req" className="text-xs cursor-pointer">
                  Authentication required
                </Label>
              </div>

              {/* Request Body JSON Schema */}
              {['POST', 'PUT', 'PATCH'].includes(endMethod) && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Request Body Schema (JSON)</Label>
                  <Textarea
                    rows={4}
                    value={endRequestSchema}
                    onChange={(e) => setEndRequestSchema(e.target.value)}
                    placeholder='{\n  "type": "object",\n  "properties": { "name": { "type": "string" } }\n}'
                    className="font-mono text-[11px] resize-none"
                  />
                </div>
              )}

              {/* Response Schemas with Status Code Tabs */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">Response Schemas</Label>
                  <div className="flex items-center gap-1.5">
                    {['200', '201', '400', '404', '500'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          if (!endResponses[code]) {
                            setEndResponses((prev) => ({
                              ...prev,
                              [code]: `{\n  "description": "${code} Response"\n}`,
                            }));
                          }
                          setEndResponseCode(code);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          endResponseCode === code
                            ? 'bg-primary text-primary-foreground font-medium'
                            : endResponses[code]
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  rows={4}
                  value={endResponses[endResponseCode] || ''}
                  onChange={(e) =>
                    setEndResponses((prev) => ({
                      ...prev,
                      [endResponseCode]: e.target.value,
                    }))
                  }
                  placeholder={`Response schema for status ${endResponseCode}`}
                  className="font-mono text-[11px] resize-none"
                />
              </div>

              {/* Mock Response Editor & Preview */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-foreground">Mock Response</Label>
                    <Input
                      type="number"
                      value={endMockStatus}
                      onChange={(e) => setEndMockStatus(Number(e.target.value))}
                      className="h-6 w-16 text-center text-xs font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMockPreview(!showMockPreview)}
                    className="h-6 text-[11px] gap-1 text-primary"
                  >
                    <Eye className="h-3 w-3" />
                    {showMockPreview ? 'Hide Preview' : 'Preview Mock'}
                  </Button>
                </div>

                {showMockPreview ? (
                  <div className="p-3 rounded bg-muted/60 border border-border font-mono text-[11px] max-h-36 overflow-y-auto">
                    <pre>{endMockResponse}</pre>
                  </div>
                ) : (
                  <Textarea
                    rows={4}
                    value={endMockResponse}
                    onChange={(e) => setEndMockResponse(e.target.value)}
                    placeholder='{\n  "data": "sample mock data"\n}'
                    className="font-mono text-[11px] resize-none"
                  />
                )}
              </div>
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={saving} className="text-xs h-8">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

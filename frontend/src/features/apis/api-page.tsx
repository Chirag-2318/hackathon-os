import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApis, type ApiEndpoint, type ApiHubResponse } from '@/api/client';
import { ApiListPane } from './components/api-list-pane';
import { ApiDetailPane } from './components/api-detail-pane';
import { OpenApiDropzone } from './components/openapi-dropzone';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function ApiPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [data, setData] = useState<ApiHubResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (roomId) {
      fetchApis(roomId).then(setData);
    }
  }, [roomId]);

  if (!data) {
    return <div className="p-8 text-center text-slate-500">Loading APIs...</div>;
  }

  const selectedEndpoint = data.endpoints.find((e: any) => e.id === selectedId) || null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1C1C1E]">
      {/* Top Header */}
      <div className="h-14 border-b flex items-center px-6 shrink-0 justify-between">
        <h1 className="font-semibold">API Hub</h1>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input placeholder="Search endpoints..." className="pl-9 h-9" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ApiListPane
          endpoints={data.endpoints}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        
        <ApiDetailPane endpoint={selectedEndpoint} />

        {/* Fallbacks Panel */}
        <div className="w-80 border-l bg-slate-50 dark:bg-[#2A2D32]/20 p-6 overflow-y-auto hidden xl:block">
          <h3 className="text-sm font-semibold mb-6">API Fallbacks</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Strategy</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Always have a mock or cached fallback for external APIs to survive demo day if rate limits are hit or wifi fails.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Coverage</h4>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1C1C1E] rounded-md border">
                <span className="text-sm">Mocked</span>
                <Badge variant="secondary">2</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1C1C1E] rounded-md border">
                <span className="text-sm">Cached</span>
                <Badge variant="secondary">1</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1C1C1E] rounded-md border border-coral-500/20">
                <span className="text-sm text-coral-600 dark:text-coral-400 font-medium">None</span>
                <Badge variant="outline" className="text-coral-500 border-coral-500/20">1</Badge>
              </div>
            </div>

            <div className="pt-4">
              <OpenApiDropzone />
              <p className="text-[11px] text-slate-500 text-center mt-4">
                Note: This is an embedded reference viewer. Actual API mocking is handled via MSW backend setup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchDemo } from '@/api/client';
import type { DemoResponse } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShotListTable } from './components/shot-list-table';
import { DemoInsuranceChecklist } from './components/demo-insurance-checklist';
import { VideoRulesCheck } from './components/video-rules-check';
import { ToolStrip } from './components/tool-strip';
import { cn } from '@/lib/utils';

const COPY_TODO_OVER_LIMIT = 'Over the time limit';

export function DemoPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [data, setData] = useState<DemoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    fetchDemo(roomId)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load demo data:', err);
        setLoading(false);
      });
  }, [roomId]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!data) return null;

  const beats = Array.isArray(data.beats) ? data.beats : (Array.isArray(data.sections) ? data.sections : []);
  const maxSeconds = data.videoMaxSeconds || 120;
  const totalSeconds = beats.reduce((sum: number, b: any) => sum + (b.seconds || b.durationSec || 0), 0);
  const isOverLimit = totalSeconds > maxSeconds;
  const pct = Math.min(100, (totalSeconds / maxSeconds) * 100);

  // Filter tools to recording and video categories only
  const allTools = Array.isArray(data.tools) ? data.tools : [];
  const filteredTools = allTools.filter((t: any) => {
    const cat = (t.category || '').toLowerCase();
    return cat === 'recording' || cat === 'video';
  });
  const toolsToDisplay = filteredTools.length > 0 ? filteredTools : allTools;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <h1 className="text-xl font-semibold">Demo and Video Studio</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Script Builder */}
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Script builder</h3>
              <div className="divide-y">
                {beats.map((beat: any, idx: number) => (
                  <div key={beat.id || idx} className="flex items-start gap-4 py-3.5">
                    <span className="text-sm font-semibold w-28 shrink-0 pt-0.5">{beat.label || beat.title}</span>
                    <span className="text-sm tabular-nums text-slate-500 w-12 shrink-0 pt-0.5 text-right">
                      {beat.seconds || beat.durationSec || 0}s
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">{beat.text || beat.notes || '—'}</p>
                  </div>
                ))}
                {beats.length === 0 && (
                  <p className="py-4 text-xs text-slate-400">No script beats defined.</p>
                )}
              </div>

              {/* Total duration bar */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>Total: {totalSeconds}s of {maxSeconds}s</span>
                  {isOverLimit && (
                    <span className="flex items-center gap-1 text-[#B34700] font-medium">
                      ⚠ {COPY_TODO_OVER_LIMIT}
                    </span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      isOverLimit ? 'bg-[#F9B672]' : 'bg-lav-600'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Shot List */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Shot list</h3>
              <ShotListTable shots={data.shots || []} />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <DemoInsuranceChecklist
              items={data.insurance || []}
              onToggle={(id) => {
                setData((prev: any) => {
                  if (!prev || !Array.isArray(prev.insurance)) return prev;
                  return {
                    ...prev,
                    insurance: prev.insurance.map((item: any) =>
                      (item.id === id || item.key === id || item.itemKey === id)
                        ? { ...item, done: !item.done }
                        : item
                    ),
                  };
                });
              }}
            />
            <VideoRulesCheck rules={data.videoRuleItems || data.videoRules} />
          </div>
        </div>

        {/* Tool Strip */}
        <ToolStrip tools={toolsToDisplay} />
      </div>
    </div>
  );
}

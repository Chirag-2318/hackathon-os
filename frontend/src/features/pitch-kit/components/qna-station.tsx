import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { AlertCircle, RefreshCw, Flame, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  fetchQnaItems,
  fetchQnaMap,
  startHotSeatSession,
  type QnaItem,
  type StartSessionRequest,
} from '../api/qna-api';
import { docsService } from '@/services/docsService';
import { QnaDefenceMap } from './qna-defence-map';
import { QnaLibrary } from './qna-library';
import { QnaDetailDrawer } from './qna-detail-drawer';
import { HotSeatSetupDialog } from './hot-seat-setup-dialog';
import { HotSeatStage } from './hot-seat-stage';
import { toast } from 'sonner';

interface QnaStationProps {
  roomId: string;
  roomAiAllowed: boolean;
}

export function QnaStation({ roomId, roomAiAllowed }: QnaStationProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'map' | 'library'>('map');
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QnaItem | null>(null);

  // Hot Seat launch state
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupInitialFocus, setSetupInitialFocus] = useState<StartSessionRequest['focus']>('WEIGHTED');
  const [setupInitialCriterion, setSetupInitialCriterion] = useState<string | undefined>();
  const [setupInitialSize, setSetupInitialSize] = useState<number | undefined>();

  // Active Hot Seat stage state
  const [activeSession, setActiveSession] = useState<{
    id: string;
    questions: QnaItem[];
    config: StartSessionRequest;
  } | null>(null);

  // Queries
  const {
    data: items = [],
    isLoading: itemsLoading,
    isError: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['qna-items', roomId],
    queryFn: () => fetchQnaItems(roomId),
    enabled: !!roomId,
    staleTime: 15_000,
  });

  const {
    data: mapData,
    isLoading: mapLoading,
    isError: mapError,
    refetch: refetchMap,
  } = useQuery({
    queryKey: ['qna-map', roomId],
    queryFn: () => fetchQnaMap(roomId),
    enabled: !!roomId,
    staleTime: 15_000,
  });

  // Raw QNA.md fallback query if items are empty
  const {
    data: rawDoc,
    isLoading: rawDocLoading,
  } = useQuery({
    queryKey: ['raw-qna-doc', roomId],
    queryFn: async () => {
      try {
        return await docsService.getDoc(roomId, 'QNA.md');
      } catch {
        return null;
      }
    },
    enabled: !!roomId && items.length === 0 && !itemsLoading,
  });

  const handleRefreshAll = () => {
    refetchItems();
    refetchMap();
    queryClient.invalidateQueries({ queryKey: ['pitchkit-readiness', roomId] });
  };

  const handleLaunchHotSeat = async (config: StartSessionRequest) => {
    try {
      const res = await startHotSeatSession(roomId, config);
      if (!res.questions || res.questions.length === 0) {
        toast.error('No questions available for the selected drill options');
        return;
      }
      setActiveSession({
        id: res.id,
        questions: res.questions,
        config,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start Hot seat');
    }
  };

  const handleDrillSingle = async (item: QnaItem) => {
    try {
      const config: StartSessionRequest = {
        size: 1,
        focus: 'ALL',
        pressure: true,
        answerMode: 'THINK',
        timerSec: 45,
        persona: 'SKEPTICAL_ENGINEER',
      };
      const res = await startHotSeatSession(roomId, config);
      setActiveSession({
        id: res.id,
        questions: [item],
        config,
      });
      setSelectedQuestion(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to drill question');
    }
  };

  const handleDrillCriterion = (criterion: string) => {
    setSetupInitialFocus('CRITERION');
    setSetupInitialCriterion(criterion);
    setSetupInitialSize(5);
    setSetupOpen(true);
  };

  const criteriaList = mapData?.lanes.map((l) => l.criterion) || [];

  if (itemsLoading || mapLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (itemsError || mapError) {
    return (
      <div className="p-8 text-center space-y-4 border border-dashed border-border rounded-xl">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
        <p className="text-sm font-mono text-muted-foreground">Failed to load Q&A defence station.</p>
        <Button size="sm" variant="outline" onClick={handleRefreshAll} className="font-mono text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  // Empty State: Missing QNA.md or Parsing issue
  if (items.length === 0) {
    if (rawDoc && rawDoc.currentContent) {
      return (
        <div className="space-y-6">
          <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg text-xs font-mono text-amber-600 dark:text-amber-400">
            <strong>Notice:</strong> Parsing could not detect structured questions in QNA.md. Displaying document as Markdown:
          </div>
          <div className="prose dark:prose-invert max-w-none text-sm p-4 border border-border rounded-lg bg-card/30">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
              {rawDoc.currentContent}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    return (
      <div className="py-16 text-center space-y-3 border border-dashed border-border rounded-xl">
        <h3 className="font-display text-2xl font-normal text-foreground">No Q&A document found</h3>
        <p className="text-xs text-muted-foreground font-mono max-w-md mx-auto">
          Create your anticipated judge questions and defense strategy.
        </p>
        <div className="pt-2">
          <Button asChild size="sm" className="font-mono text-xs">
            <Link to={`/app/room/${roomId}/plan?step=4`}>
              Generate your Q&A in Plan, step 4
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const solidCount = mapData?.solidQuestions ?? items.filter((i) => i.myMastery === 3).length;

  return (
    <div className="space-y-8">
      {/* Station Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h2 className="font-display text-3xl font-normal text-foreground">Q&A</h2>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            {items.length} questions · {solidCount} solid
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quiet Tab Switch */}
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-colors',
                activeTab === 'map' ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-colors',
                activeTab === 'library' ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Library
            </button>
          </div>

          {/* Primary Action: Enter the hot seat */}
          <Button
            size="sm"
            onClick={() => {
              setSetupInitialFocus('WEIGHTED');
              setSetupInitialCriterion(undefined);
              setSetupOpen(true);
            }}
            className="font-mono text-xs h-9 px-4"
          >
            Enter the hot seat
          </Button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'map' && mapData ? (
        <QnaDefenceMap
          mapData={mapData}
          onSelectCriterion={(crit) => {
            setSelectedCriterion(crit);
            setActiveTab('library');
          }}
          onDrillCriterion={handleDrillCriterion}
        />
      ) : (
        <QnaLibrary
          roomId={roomId}
          items={items}
          criteria={criteriaList}
          roomAiAllowed={roomAiAllowed}
          selectedCriterionFilter={selectedCriterion}
          onSelectCriterionFilter={setSelectedCriterion}
          onOpenQuestion={(q) => setSelectedQuestion(q)}
          onRefresh={handleRefreshAll}
        />
      )}

      {/* Slide-over Drawer for Question Exchange */}
      <QnaDetailDrawer
        roomId={roomId}
        item={selectedQuestion}
        open={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        onUpdated={handleRefreshAll}
        onPracticeSingle={handleDrillSingle}
      />

      {/* Hot Seat Launch Setup Dialog */}
      <HotSeatSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        criteria={criteriaList}
        roomAiAllowed={roomAiAllowed}
        initialFocus={setupInitialFocus}
        initialCriterion={setupInitialCriterion}
        initialSize={setupInitialSize}
        onLaunch={handleLaunchHotSeat}
      />

      {/* Active Hot Seat Stage Portal */}
      {activeSession && (
        <HotSeatStage
          roomId={roomId}
          sessionId={activeSession.id}
          initialQuestions={activeSession.questions}
          config={activeSession.config}
          roomAiAllowed={roomAiAllowed}
          onClose={() => {
            setActiveSession(null);
            handleRefreshAll();
          }}
          onFinishSession={() => {
            handleRefreshAll();
          }}
        />
      )}
    </div>
  );
}

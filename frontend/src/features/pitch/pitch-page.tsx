import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchPitchDeck, fetchRehearse, fetchQa } from '@/api/client';
import type { PitchDeckResponse, RehearseResponse, QaResponse } from '@/api/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SlideRail } from './components/slide-rail';
import { CriteriaCoverageMatrix } from './components/criteria-coverage-matrix';
import { SlideLintList } from './components/slide-lint-list';
import { cn } from '@/lib/utils';
import { Code2, HelpCircle } from 'lucide-react';
import { useDraftStore } from '@/app/layout/use-draft-store';

const RUBRIC = [
  { id: 'innovation', name: 'Innovation' },
  { id: 'feasibility', name: 'Feasibility' },
  { id: 'impact', name: 'Impact' },
  { id: 'technical_depth', name: 'Technical depth' },
  { id: 'ux', name: 'UX' },
  { id: 'presentation', name: 'Presentation' },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PitchPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<PitchDeckResponse | null>(null);
  const [rehearse, setRehearse] = useState<RehearseResponse | null>(null);
  const [qa, setQa] = useState<QaResponse | null>(null);
  
  const selectedSlideId = useDraftStore((s) => s.drafts[roomId || '']?.pitch?.selectedSlideId ?? null);
  const setSelectedSlideId = useDraftStore((s) => s.setPitchSlide);
  const activeTab = useDraftStore((s) => s.drafts[roomId || '']?.pitch?.activeTab ?? 'deck');
  const setActiveTab = useDraftStore((s) => s.setPitchTab);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    if (location.pathname.endsWith('/rehearse')) {
      setActiveTab(roomId, 'rehearse');
    } else if (location.pathname.endsWith('/qa')) {
      setActiveTab(roomId, 'qa');
    } else if (location.pathname.endsWith('/deck')) {
      setActiveTab(roomId, 'deck');
    }
  }, [location.pathname, roomId, setActiveTab]);

  const handleTabChange = (val: string) => {
    if (roomId) {
      setActiveTab(roomId, val);
      navigate(`/app/room/${roomId}/pitch/${val}`);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    Promise.all([
      fetchPitchDeck(roomId),
      fetchRehearse(roomId),
      fetchQa(roomId),
    ]).then(([d, r, q]) => {
      setDeck(d);
      setRehearse(r);
      setQa(q);
      
      // If no slide is selected and we just loaded them, select the first one
      const currentSelected = useDraftStore.getState().drafts[roomId]?.pitch?.selectedSlideId;
      if (!currentSelected && d.slides.length > 0) {
        setSelectedSlideId(roomId, d.slides[0].id);
      }
      
      setLoading(false);
    });
  }, [roomId]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const selectedSlide = deck?.slides.find((s: any) => s.id === selectedSlideId);

  // Compute slide-level coverage status
  const coverageStatus: Record<string, 'covered' | 'partly' | 'not_yet'> = {};
  if (deck) {
    for (const slide of deck.slides) {
      const coveredCriteria = RUBRIC.filter(
        (c) => (deck.coverage[c.id] ?? []).includes(slide.id)
      );
      if (coveredCriteria.length === 0) coverageStatus[slide.id] = 'not_yet';
      else if (coveredCriteria.length >= RUBRIC.length) coverageStatus[slide.id] = 'covered';
      else coverageStatus[slide.id] = 'partly';
    }
  }

  const lastRun = rehearse?.runs[rehearse.runs.length - 1];

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 shrink-0">
          <h1 className="text-xl font-semibold mb-3">Pitch Studio</h1>
          <TabsList className="bg-slate-100 dark:bg-slate-800/50">
            <TabsTrigger value="deck">Deck</TabsTrigger>
            <TabsTrigger value="rehearse">Rehearse</TabsTrigger>
            <TabsTrigger value="qa">Q&A</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Deck Tab ── */}
        <TabsContent value="deck" className="flex-1 overflow-hidden mt-0">
          <div className="flex h-full">
            {/* Slide Rail */}
            {deck && (
              <SlideRail
                slides={deck.slides}
                selectedId={selectedSlideId}
                coverageStatus={coverageStatus}
                onSelect={(id) => setSelectedSlideId(roomId || '', id)}
              />
            )}

            {/* Slide Guide + Content Editor */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedSlide && (
                <Card className="p-5 bg-lav-50/50 dark:bg-lav-900/10 border-lav-100">
                  <p className="text-sm">
                    <span className="font-semibold text-lav-700 dark:text-lav-300">This slide must answer: </span>
                    <span className="text-ink dark:text-slate-200">{selectedSlide.guide}</span>
                  </p>
                </Card>
              )}
              {selectedSlide && (
                <Card className="p-5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Content</h3>
                  <div className="min-h-[120px] text-sm text-ink dark:text-slate-300 whitespace-pre-wrap">
                    {selectedSlide.content}
                  </div>
                </Card>
              )}
            </div>

            {/* Right rail: Coverage Matrix + Lint */}
            <div className="w-80 shrink-0 border-l overflow-y-auto p-4 space-y-4 hidden lg:block">
              {deck && (
                <CriteriaCoverageMatrix
                  rubric={RUBRIC}
                  slides={deck.slides}
                  coverage={deck.coverage}
                />
              )}
              {deck && (
                <SlideLintList
                  issues={deck.lint}
                  onSelectSlide={(slideId: string) => roomId && setSelectedSlideId(roomId, slideId)}
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Rehearse Tab ── */}
        <TabsContent value="rehearse" className="flex-1 overflow-y-auto mt-0">
          <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {/* Timer + Run Count */}
            <div className="flex items-baseline justify-between">
              <div className="text-[40px] font-extrabold tabular-nums tracking-tight text-ink dark:text-white">
                {lastRun ? formatTime(lastRun.durationSeconds) : '0:00'}
              </div>
              <span className="text-sm text-slate-500">
                Rehearsed {rehearse?.runs.length ?? 0} times
              </span>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rehearse?.roles.map((role: any) => (
                <Card key={role.memberId} className="p-5 shadow-sm">
                  <h3 className="text-base font-semibold mb-3">{role.role}</h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs bg-lav-100 text-lav-700">
                        {role.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{role.name}</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Target vs Last Run Bar */}
            {rehearse && lastRun && (
              <Card className="p-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>Target: {formatTime(rehearse.targetSeconds)}</span>
                  <span>Last run: {formatTime(lastRun.durationSeconds)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      lastRun.durationSeconds <= rehearse.targetSeconds
                        ? 'bg-emerald-500'
                        : 'bg-[#F9B672]'
                    )}
                    style={{ width: `${Math.min(100, (lastRun.durationSeconds / rehearse.targetSeconds) * 100)}%` }}
                  />
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Q&A Tab ── */}
        <TabsContent value="qa" className="flex-1 overflow-y-auto mt-0">
          <div className="p-6 space-y-8 max-w-3xl mx-auto">
            {/* Question Cards */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Questions
              </h2>
              <div className="space-y-3">
                {qa?.questions.map((q: any) => (
                  <Card key={q.id} className="p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold line-clamp-2">{q.text}</p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'shrink-0 text-xs',
                          q.status === 'answered'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                        )}
                      >
                        {q.status === 'answered' ? 'Answered' : 'Needs work'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Code Defense */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Code Defense
              </h2>
              <Card className="divide-y">
                {qa?.codeDefense.map((mod: any) => (
                  <div key={mod.id} className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-sm font-medium">{mod.module}</span>
                    <span className="text-xs text-lav-600 dark:text-lav-400">Explain this</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

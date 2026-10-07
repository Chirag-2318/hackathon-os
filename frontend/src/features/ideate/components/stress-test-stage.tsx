import * as React from 'react';

import type { IdeateResponse } from '@/api/client';
import { cn } from 'cn';
import { Check, X, ShieldAlert } from 'lucide-react';
import { Chip } from '@/components/primitives/chip';

export function StressTestStage({ data }: { data: IdeateResponse }) {
  const [selectedIdeaId, setSelectedIdeaId] = React.useState<string>(data.ideas[0]?.id);
  const selectedIdea = data.ideas.find(i => i.id === selectedIdeaId);
  const stressTest = data.stressTests.find(s => s.ideaId === selectedIdeaId);

  return (
    <div className="flex h-full gap-6">
      {/* Left List */}
      <div className="w-1/3 flex flex-col gap-3 overflow-auto pr-2">
        <h2 className="text-xl font-bold mb-2">Stress Test</h2>
        {data.ideas.map(idea => {
          const st = data.stressTests.find(s => s.ideaId === idea.id);
          const badgeColor = st?.overallBadge === 'Pass' ? 'bg-success-fill text-success-text' : 
                             st?.overallBadge === 'Fail' ? 'bg-red-100 text-red-700' : 
                             'bg-yellow-100 text-yellow-700';

          return (
            <div 
              key={idea.id}
              onClick={() => setSelectedIdeaId(idea.id)}
              className={cn(
                "p-4 rounded-lg cursor-pointer transition-colors border flex flex-col gap-2",
                selectedIdeaId === idea.id 
                  ? "bg-primary/5 border-primary" 
                  : "bg-surface-raised border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-ink line-clamp-1">{idea.title}</h4>
                {st && (
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", badgeColor)}>
                    {st.overallBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted line-clamp-1">{idea.identitySentence}</p>
            </div>
          );
        })}
      </div>

      {/* Right Panel */}
      {selectedIdea && stressTest ? (
        <div className="flex-1 bg-surface-raised border border-border rounded-lg p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldAlert className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{selectedIdea.title}</h3>
              <p className="text-sm text-ink-muted">AI Stress Test Analysis</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto space-y-4">
            {stressTest.questions.map((q, idx) => (
              <div 
                key={idx}
                className={cn(
                  "p-4 border rounded-lg flex items-center justify-between transition-colors",
                  q.passed ? "bg-surface border-border" : "bg-red-50 border-red-100"
                )}
              >
                <span className={cn("font-medium", q.passed ? "text-ink" : "text-red-700")}>
                  {q.question}
                </span>
                {q.passed ? (
                  <div className="size-6 rounded-full bg-success-fill flex items-center justify-center">
                    <Check className="size-4 text-success-text" />
                  </div>
                ) : (
                  <div className="size-6 rounded-full bg-red-200 flex items-center justify-center">
                    <X className="size-4 text-red-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="pt-6 mt-6 border-t border-border flex justify-between items-center">
            <span className="font-semibold text-ink-muted">Final Assessment</span>
            <Chip 
              color={stressTest.overallBadge === 'Pass' ? 'lime' : 'peach'}
              className="text-sm px-4 py-1"
            >
              {stressTest.overallBadge}
            </Chip>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-ink-muted">
          Select an idea to view its stress test
        </div>
      )}
    </div>
  );
}

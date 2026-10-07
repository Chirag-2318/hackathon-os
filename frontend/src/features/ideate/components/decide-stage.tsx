import * as React from 'react';

import type { IdeateResponse } from '@/api/client';
import { cn } from 'cn';
import { Lock, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DarkCallout } from '@/components/primitives/dark-callout';

export function DecideStage({ data, onContinue }: { data: IdeateResponse, onContinue: () => void }) {
  // Use lockedIdeaId if available, or just mock picking the first idea
  const chosenIdea = data.ideas.find(i => i.id === data.lockedIdeaId) || data.ideas[0];
  const parkedIdeas = data.ideas.filter(i => i.id !== chosenIdea.id);
  
  const [isLocked, setIsLocked] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleLock = () => {
    setIsAnimating(true);
    // M05 Lock choreography timing
    setTimeout(() => {
      setIsLocked(true);
      setIsAnimating(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Lock the decision</h2>
          <p className="text-ink-muted mt-1">Make the final call to move to planning.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 relative">
        {/* Dark Callout (Leader only) */}
        {!isLocked && (
          <div className={cn(
            "transition-all duration-300 z-10", 
            isAnimating && "opacity-0 scale-95 pointer-events-none"
          )}>
            <DarkCallout
              icon={<Lock />}
              title="Time to decide"
              description={`Voting has concluded. ${chosenIdea.title} has the most support.`}
              buttonLabel="Lock Idea"
              onAction={handleLock}
              className="bg-ink text-surface shadow-xl"
            />
          </div>
        )}

        {/* Ideas Grid */}
        <div className={cn(
          "grid gap-4 transition-all duration-700 ease-in-out",
          isLocked ? "grid-cols-1" : "grid-cols-2"
        )}>
          {/* Chosen Idea */}
          <div className={cn(
            "p-6 border rounded-lg transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]", // e3 spring approximation
            isAnimating && "scale-[1.03] shadow-2xl border-primary ring-2 ring-primary/20",
            isLocked && "bg-surface-raised border-success-fill ring-1 ring-success-fill/20",
            !isAnimating && !isLocked && "bg-surface border-primary"
          )}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold">{chosenIdea.title}</h3>
              {isLocked && (
                <div className="flex items-center gap-2 bg-success-fill/10 text-success-fill px-3 py-1 rounded-full text-sm font-bold">
                  <Check className="size-4" />
                  LOCKED
                </div>
              )}
            </div>
            <p className={cn("text-ink-muted transition-all duration-500", isLocked ? "text-base" : "text-sm")}>
              {chosenIdea.identitySentence}
            </p>
            
            {isLocked && (
              <div className="mt-8 pt-6 border-t border-border flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button size="lg" onClick={onContinue} className="gap-2">
                  Continue to Plan
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Parked Ideas */}
          {!isLocked && parkedIdeas.map((idea, index) => (
            <div 
              key={idea.id}
              className={cn(
                "p-6 border border-border bg-surface-sunken rounded-lg transition-all duration-500",
                isAnimating && "opacity-40 translate-x-4 scale-95" // sliding into parked mockup
              )}
              style={{
                transitionDelay: isAnimating ? `${index * 100}ms` : '0ms'
              }}
            >
              <h3 className="text-sm font-bold text-ink-muted mb-2">{idea.title}</h3>
              <p className="text-xs text-ink-muted line-clamp-2">{idea.identitySentence}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

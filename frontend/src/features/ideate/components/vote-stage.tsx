import * as React from 'react';

import type { IdeateResponse } from '@/api/client';
import { cn } from 'cn';
import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VoteStage({ data }: { data: IdeateResponse }) {
  const [selectedIdeaId, setSelectedIdeaId] = React.useState<string | null>(null);
  const [isClosed, setIsClosed] = React.useState(data.voteData.isClosed);
  const [hasVoted, setHasVoted] = React.useState(false);

  const handleVote = () => {
    if (selectedIdeaId) {
      setHasVoted(true);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Vote on the best idea</h2>
          <p className="text-ink-muted mt-1">Select one idea to move forward with.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{hasVoted ? data.voteData.votedCount + 1 : data.voteData.votedCount}</span>
            <span className="text-sm text-ink-muted">/ {data.voteData.totalVoters} voted</span>
          </div>
          
          <Button 
            variant="outline"
            onClick={() => setIsClosed(!isClosed)}
          >
            {isClosed ? 'Open Voting' : 'Close Voting (Leader)'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 overflow-auto pb-6">
        {data.ideas.map((idea: any) => {
          const isSelected = selectedIdeaId === idea.id;
          const voteResult = data.voteData.results.find((r: any) => r.ideaId === idea.id);
          // If the user has voted and selected this one, we increment the mock display
          const displayVotes = (voteResult?.votes || 0) + (hasVoted && isSelected ? 1 : 0);

          return (
            <div 
              key={idea.id}
              onClick={() => {
                if (!hasVoted && !isClosed) {
                  setSelectedIdeaId(idea.id);
                }
              }}
              className={cn(
                "p-6 border rounded-lg transition-all flex flex-col h-full relative",
                !hasVoted && !isClosed && "cursor-pointer hover:border-primary/50",
                isSelected && !isClosed && "border-primary bg-primary/5 ring-1 ring-primary/20",
                hasVoted && isSelected && "border-success-fill bg-success-fill/10",
                hasVoted && !isSelected && "opacity-60 border-border bg-surface-sunken"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold line-clamp-2 pr-8">{idea.title}</h3>
                
                {/* Radio indicator */}
                {!isClosed && !hasVoted && (
                  <div className="absolute top-6 right-6">
                    {isSelected ? (
                      <CheckCircle2 className="size-6 text-primary" />
                    ) : (
                      <Circle className="size-6 text-ink-muted opacity-30" />
                    )}
                  </div>
                )}
                
                {/* Voted check */}
                {hasVoted && isSelected && !isClosed && (
                  <div className="absolute top-6 right-6 flex flex-col items-center">
                    <CheckCircle2 className="size-6 text-success-fill" />
                    <span className="text-[10px] font-bold text-success-fill mt-1 uppercase">Voted</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-ink-muted flex-1">{idea.identitySentence}</p>
              
              {/* Results (only visible when closed) */}
              {isClosed && (
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <span className="font-medium">Votes</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{displayVotes}</span>
                    <span className="text-sm text-ink-muted">
                      ({Math.round((displayVotes / data.voteData.totalVoters) * 100)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {!hasVoted && !isClosed && (
        <div className="pt-4 border-t border-border flex justify-end animate-in fade-in">
          <Button 
            onClick={handleVote}
            disabled={!selectedIdeaId}
            size="lg"
            className="w-48"
          >
            Submit Vote
          </Button>
        </div>
      )}
    </div>
  );
}

import * as React from 'react';

import type { IdeateResponse } from '@/api/client';
import { cn } from 'cn';

const CRITERIA = [
  { key: 'rubricFit', label: 'Rubric Fit' },
  { key: 'finishable', label: 'Finishable' },
  { key: 'differentiation', label: 'Differentiation' },
  { key: 'userClarity', label: 'User Clarity' },
  { key: 'teamSkillFit', label: 'Team Skill Fit' },
];

function DotRating({ value, onChange }: { value: number; onChange?: (val: number) => void }) {
  // Demo Bounce animation when value changes
  const [animate, setAnimate] = React.useState(false);
  
  React.useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(v => (
        <div 
          key={v}
          onClick={() => onChange?.(v)}
          className={cn(
            "size-4 rounded-full transition-all cursor-pointer",
            v <= value 
              ? "bg-primary" 
              : "bg-surface-sunken border border-border hover:border-primary/50",
            animate && v <= value && "animate-in zoom-in spin-in-1 duration-300" // Simple bounce mockup
          )}
        />
      ))}
    </div>
  );
}

export function CritiqueStage({ data }: { data: IdeateResponse }) {
  // Using local state to allow interactive dot selection for the demo
  const [scores, setScores] = React.useState(data.critiqueScores);
  const ideas = data.ideas;

  const handleScoreChange = (ideaId: string, criteriaKey: string, val: number) => {
    setScores(prev => prev.map(score => {
      if (score.ideaId !== ideaId) return score;
      
      const newScore = { ...score, [criteriaKey]: val };
      // Recalculate total
      newScore.total = CRITERIA.reduce((acc, c) => acc + (newScore[c.key as keyof typeof newScore] as number), 0);
      return newScore;
    }));
  };

  return (
    <div className="flex flex-col h-full bg-surface-raised border border-border rounded-lg p-6 overflow-auto">
      <h2 className="text-xl font-bold mb-6">Critique Matrix (C15)</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="p-4 border-b border-border font-semibold text-ink sticky left-0 bg-surface-raised z-10 w-64">
                Idea
              </th>
              {CRITERIA.map(c => (
                <th key={c.key} className="p-4 border-b border-border font-medium text-sm text-ink-muted text-center">
                  {c.label}
                </th>
              ))}
              <th className="p-4 border-b border-border font-bold text-ink text-center w-24">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((idea) => {
              const score = scores.find(s => s.ideaId === idea.id);
              if (!score) return null;

              return (
                <tr key={idea.id} className="border-b border-border hover:bg-surface transition-colors">
                  <td className="p-4 sticky left-0 bg-surface-raised z-10 group-hover:bg-surface">
                    <p className="font-semibold text-ink line-clamp-1">{idea.title}</p>
                    <p className="text-xs text-ink-muted mt-1">{idea.authorName || 'Anonymous'}</p>
                  </td>
                  
                  {CRITERIA.map(c => (
                    <td key={c.key} className="p-4">
                      <div className="flex justify-center">
                        <DotRating 
                          value={score[c.key as keyof typeof score] as number} 
                          onChange={(val) => handleScoreChange(idea.id, c.key, val)} 
                        />
                      </div>
                    </td>
                  ))}
                  
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center justify-center bg-surface-sunken rounded px-3 py-1 text-lg font-bold">
                      {score.total}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

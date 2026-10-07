import * as React from 'react';
import { ProgressRow } from '@/components/primitives/progress-row';

export function SkillCoverageCard() {
  const mockSkills = [
    { capability: 'build', coverage: 80 },
    { capability: 'design', coverage: 60 },
    { capability: 'presentation', coverage: 40 },
    { capability: 'domain', coverage: 90 },
    { capability: 'ai', coverage: 70 },
  ];

  return (
    <div className="flex flex-col p-5 bg-surface-raised rounded-card border border-border shadow-e0 min-w-0">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-ink">Skill Coverage</h3>
      </header>
      <div className="flex flex-col gap-3">
        {mockSkills.map((skill) => (
          <ProgressRow 
            key={skill.capability} 
            label={skill.capability.charAt(0).toUpperCase() + skill.capability.slice(1)} 
            percent={skill.coverage} 
            colorClass="bg-info-solid" 
          />
        ))}
      </div>
    </div>
  );
}

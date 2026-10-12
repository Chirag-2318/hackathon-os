import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/primitives/chip';
import type { SkillGapRadarPoint } from '@/api/client';

export interface SkillGapRadarProps {
  data?: any[];
}

export function SkillGapRadar({ data = [] }: SkillGapRadarProps) {
  const safeData = Array.isArray(data) ? data : [];
  
  // Map data for recharts (support both capability/coverage and skill/count/isGap)
  const chartData = safeData.map(d => {
    const rawSubject = d.capability || d.skill || '';
    const subject = rawSubject ? rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1) : 'Skill';
    const coverageVal = typeof d.coverage === 'number' 
      ? d.coverage 
      : typeof d.count === 'number' 
        ? (d.count > 0 ? 100 : 0) 
        : 50;

    return {
      subject,
      A: coverageVal,
      fullMark: 100,
    };
  });

  const missingSkill = safeData.find(d => d.isGap || d.count === 0 || d.coverage === 0);
  const missingLabel = missingSkill ? (missingSkill.skill || missingSkill.capability) : null;

  return (
    <div className="flex flex-col p-5 bg-surface border border-border shadow-e0 rounded-card">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-ink">Skill Gap Radar</h3>
        {missingLabel ? (
          <Chip fill="danger" className="text-danger font-bold text-caption">Missing: {missingLabel}</Chip>
        ) : (
          <Chip fill="mint" className="text-ink font-bold text-caption">Full coverage</Chip>
        )}
      </header>
      <div className="w-full aspect-square max-h-[220px] p-3 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--ink-muted)', fontSize: 10 }} />
            <Radar
              name="Team"
              dataKey="A"
              stroke="var(--lav-500)"
              fill="var(--lav-400)"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

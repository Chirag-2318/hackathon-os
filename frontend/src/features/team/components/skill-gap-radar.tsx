import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/primitives/chip';
import type { SkillGapRadarPoint } from '@/api/client';

export interface SkillGapRadarProps {
  data: SkillGapRadarPoint[];
}

export function SkillGapRadar({ data }: SkillGapRadarProps) {
  // Map data for recharts
  const chartData = data.map(d => ({
    subject: d.capability.charAt(0).toUpperCase() + d.capability.slice(1),
    A: d.coverage,
    fullMark: 100,
  }));

  return (
    <div className="flex flex-col p-5 bg-surface border border-border shadow-e0 rounded-card">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-ink">Skill Gap Radar</h3>
        <Chip fill="danger" className="text-danger font-bold text-caption">Missing: Design</Chip>
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

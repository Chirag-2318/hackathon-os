import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ProgressChartProps {
  data: any[];
}

export function ProgressVsPlanChart({ data }: ProgressChartProps) {
  const chartConfig = {
    actual: { label: "Actual", color: "var(--success-solid)" },
    planned: { label: "Planned", color: "var(--ink-muted)" },
  };

  return (
    <div className="flex flex-col p-5 bg-surface-raised rounded-card border border-border shadow-e0">
      <header className="flex items-start justify-between mb-4">
        <div className="flex flex-col">
          <h3 className="text-h3 text-ink">Progress vs plan</h3>
        </div>
        <div className="flex items-center gap-3 text-caption text-ink-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success-solid" /> Actual</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-ink-muted border-dashed" /> Planned</span>
        </div>
      </header>
      <div className="h-[160px] w-full relative">
        <span className="sr-only">View data table</span>
        <ChartContainer config={chartConfig} className="w-full h-full">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success-solid)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--success-solid)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area dataKey="planned" type="monotone" stroke="var(--ink-muted)" strokeWidth={2} strokeDasharray="4 4" fill="none" />
            <Area dataKey="actual" type="monotone" fill="url(#fillActual)" stroke="var(--success-solid)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}

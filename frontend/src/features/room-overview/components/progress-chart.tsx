import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ProgressChartPoint } from '@/api/client';
import { useChartEntry } from '@/shared/motion/use-chart-entry';
import { cn } from 'cn';

interface ProgressChartProps {
  data: ProgressChartPoint[];
  className?: string;
}

export function ProgressChart({ data, className }: ProgressChartProps) {
  const { shouldAnimate } = useChartEntry('progress-vs-plan');
  
  // Since we don't have the definitive answer for OQ-7, we'll use placeholder series
  const chartConfig = {
    actual: {
      label: 'Actual Progress',
      color: 'var(--ink)',
    },
    planned: {
      label: 'Planned Progress',
      color: 'var(--ink-muted)',
    },
    series1: {
      label: 'Code (Est)',
      color: '#5880D1',
    },
    series2: {
      label: 'Docs (Est)',
      color: '#C9EF84',
    },
    series3: {
      label: 'Design (Est)',
      color: '#B9D4FE',
    },
  };

  return (
    <div className={cn("flex-1 min-h-[300px]", shouldAnimate ? "animate-chart-reveal" : "", className)}>
      <span className="sr-only">
        Line chart showing cumulative actual progress against the planned schedule, broken down by three sub-categories.
      </span>
      <ChartContainer config={chartConfig} className="w-full h-full">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fillSeries1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartConfig.series1.color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={chartConfig.series1.color} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillSeries2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartConfig.series2.color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={chartConfig.series2.color} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillSeries3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartConfig.series3.color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={chartConfig.series3.color} stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="label" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: 'var(--ink-muted)', fontSize: 12 }} 
            dy={10} 
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: 'var(--ink-muted)', fontSize: 12 }} 
            ticks={[0, 20, 40, 60, 80, 100]}
            domain={[0, 100]}
          />
          
          <ChartTooltip 
            cursor={{ stroke: 'var(--ink-muted)', strokeWidth: 1, strokeDasharray: '4 4' }} 
            content={<ChartTooltipContent />} 
          />

          {/* Stacked area series */}
          <Area
            type="monotone"
            dataKey="series3"
            stackId="1"
            stroke={chartConfig.series3.color}
            fill="url(#fillSeries3)"
            isAnimationActive={shouldAnimate}
            animationDuration={600}
          />
          <Area
            type="monotone"
            dataKey="series2"
            stackId="1"
            stroke={chartConfig.series2.color}
            fill="url(#fillSeries2)"
            isAnimationActive={shouldAnimate}
            animationDuration={600}
          />
          <Area
            type="monotone"
            dataKey="series1"
            stackId="1"
            stroke={chartConfig.series1.color}
            fill="url(#fillSeries1)"
            isAnimationActive={shouldAnimate}
            animationDuration={600}
          />

          {/* Ideal/Planned line overlay */}
          <Area
            type="monotone"
            dataKey="planned"
            stroke="var(--ink-muted)"
            strokeDasharray="5 5"
            fill="none"
            isAnimationActive={shouldAnimate}
            animationDuration={600}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

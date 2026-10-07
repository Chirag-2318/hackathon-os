import { Card } from '@/components/ui/card';
import type { HeatmapCell as HeatmapCellData } from '@/api/client';
import { useChartEntry } from '@/shared/motion/use-chart-entry';
import { cn } from 'cn';

interface TeamHeatmapProps {
  data: HeatmapCellData[];
  className?: string;
}

export function TeamHeatmap({ data, className }: TeamHeatmapProps) {
  const { shouldAnimate } = useChartEntry('team-heatmap');

  // We group data by hour and day to build the grid
  // In a real implementation, we'd calculate domains from data.
  const hours = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
  const days = ['2026-11-21']; // Mocked single day for now based on fixture

  const getCellColor = (category: string) => {
    switch (category) {
      case 'code':
        return '#5880D1'; // Blue
      case 'docs':
        return '#C9EF84'; // Lime
      case 'design':
        return '#B9D4FE'; // Light Blue
      default:
        return 'var(--surface-sunken)';
    }
  };

  return (
    <div className={cn("flex-1 overflow-x-auto", shouldAnimate ? "animate-chart-reveal" : "", className)}>
      <span className="sr-only">
        Heatmap showing team activity clustered by time of day, categorized by Code, Docs, and Design.
      </span>
      <div className="min-w-[400px] flex gap-2">
        {/* Y Axis Labels (Hours) */}
        <div className="flex flex-col gap-[4px] pt-1">
          {hours.map(h => (
            <div key={h} className="h-[20px] flex items-center justify-end pr-2 text-[10px] text-ink-muted w-8">
              {h}
            </div>
          ))}
        </div>

        {/* Grid area */}
        <div className="flex flex-col gap-[4px] pt-1">
          {hours.map((hour, rIndex) => (
            <div key={hour} className="flex gap-[4px]">
              {days.map((day, cIndex) => {
                const cell = data.find(d => d.hour === hour && d.day === day);
                const color = cell && cell.intensityOrPresent ? getCellColor(cell.category) : getCellColor('empty');
                
                // Diagonal sweep animation delay based on row and col
                const delay = (rIndex + cIndex) * 0.05;
                
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="w-[24px] h-[20px] rounded-sm transition-transform hover:scale-110 cursor-default"
                    style={{ 
                      backgroundColor: color,
                      animationDelay: shouldAnimate ? `${delay}s` : '0s',
                      animationFillMode: 'backwards'
                    }}
                    title={`${hour}:00 - ${cell?.category || 'None'}`}
                  />
                );
              })}
              {/* Fill empty columns for demonstration if days is short */}
              {Array.from({ length: 9 }).map((_, i) => (
                 <div
                   key={`empty-${i}`}
                   className="w-[24px] h-[20px] rounded-sm transition-transform hover:scale-110 cursor-default"
                   style={{ 
                     backgroundColor: getCellColor('empty'),
                     animationDelay: shouldAnimate ? `${(rIndex + days.length + i) * 0.05}s` : '0s',
                     animationFillMode: 'backwards'
                   }}
                 />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

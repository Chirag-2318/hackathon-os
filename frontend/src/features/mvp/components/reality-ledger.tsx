import * as React from 'react';
import { type RealityLedgerItem } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, Library, MonitorPlay, CalendarClock } from 'lucide-react';

interface RealityLedgerProps {
  items: RealityLedgerItem[];
}

export function RealityLedger({ items }: RealityLedgerProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Built this weekend':
        return { color: 'bg-green-100 text-green-900 border-green-200', icon: Check };
      case 'Library / API':
        return { color: 'bg-lav-100 text-lav-900 border-lav-200', icon: Library };
      case 'Mocked':
        return { color: 'bg-amber-100 text-amber-900 border-amber-200', icon: MonitorPlay };
      case 'Planned':
        return { color: 'bg-surface-sunken text-ink-muted border-border', icon: CalendarClock };
      default:
        return { color: 'bg-surface-sunken text-ink-muted border-border', icon: Check };
    }
  };

  return (
    <div className="r-card bg-surface overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Reality Ledger</h3>
          <p className="text-sm text-ink-muted">What is real vs. mocked</p>
        </div>
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => {
          const { color, icon: Icon } = getStatusConfig(item.status);
          return (
            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-surface-sunken/50 transition-colors">
              <span className="font-semibold">{item.name}</span>
              <Badge variant="outline" className={cn("r-chip border font-semibold flex items-center gap-1.5", color)}>
                <Icon className="h-3 w-3" />
                {item.status}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

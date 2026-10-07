/**
 * TimePerPhaseChart — S24 highlighted-bar chart
 * PRD 5b §4. [D S24, §7; A §6.2, §8].
 *
 * Recharts bar chart (already installed). Static configuration — library
 * default animation disabled, motion driven by framer-motion.
 *
 * Bar fill: #C7CAC4. Highlighted (most overrun) bar: #F9B672 (peach).
 * Dark C33 tooltip. Direct labels on bars. Accessible summary sentence.
 * View data link opens a table.
 *
 * AC-24-3: Bars #C7CAC4, one bar #F9B672 for largest overrun (Build),
 *           dark tooltip with percent, H3 title, unit subtitle,
 *           one-sentence summary, direct labels, working View data table.
 */
import { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { EmptyState } from '@/components/primitives/empty-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { PhaseTimeEntry } from '../api/types';
import { BarChart2 } from 'lucide-react';

const BAR_FILL = '#C7CAC4';
const HIGHLIGHT_FILL = '#F9B672';
const TOOLTIP_BG = '#2A2D32';

/** Find the phase with the largest positive overrun. Ties → first. No overrun → none. */
function findHighlightedPhase(data: PhaseTimeEntry[]): string | null {
  let maxOverrun = 0;
  let highlighted: string | null = null;

  for (const entry of data) {
    const overrun = entry.actualHours - entry.plannedHours;
    if (overrun > maxOverrun) {
      maxOverrun = overrun;
      highlighted = entry.phase;
    }
  }

  return highlighted;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  total: number;
}

function CustomTooltip({ active, payload, label, total }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const hours = payload[0].value as number;
  const pct = total > 0 ? Math.round((hours / total) * 100) : 0;

  return (
    <div
      className="rounded-pop px-3 py-2 text-white shadow-e3"
      style={{ backgroundColor: TOOLTIP_BG, minWidth: '8rem' }}
      role="tooltip"
    >
      <p className="text-label font-semibold">{label}</p>
      <p className="text-body tabular-nums">{hours}h · {pct}% of shown total</p>
    </div>
  );
}

interface DataTableModalProps {
  data: PhaseTimeEntry[];
}

function DataTableModal({ data }: DataTableModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-caption text-ink-muted underline">
          View data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Time per phase data</DialogTitle>
        </DialogHeader>
        <table className="w-full text-body border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-label font-semibold text-ink-muted">Phase</th>
              <th className="text-right py-2 text-label font-semibold text-ink-muted">Hours (actual)</th>
              <th className="text-right py-2 pl-4 text-label font-semibold text-ink-muted">Hours (planned)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.phase} className="border-b border-border last:border-b-0">
                <td className="py-2 pr-4 text-ink font-medium">{entry.label}</td>
                <td className="py-2 text-right tabular-nums text-ink">{entry.actualHours}</td>
                <td className="py-2 pl-4 text-right tabular-nums text-ink-muted">{entry.plannedHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DialogContent>
    </Dialog>
  );
}

interface TimePerPhaseChartProps {
  data: PhaseTimeEntry[];
  onDrawComplete?: () => void;
}

/** Per-session flag: chart animation fires once per session [A §8] */
const sessionChartAnimated = new Set<string>();

export function TimePerPhaseChart({
  data,
  onDrawComplete,
}: TimePerPhaseChartProps) {
  const prefersReduced = useReducedMotion();
  const sessionKey = 'retro-phase-chart';
  const [animated, setAnimated] = useState(() => sessionChartAnimated.has(sessionKey));

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<BarChart2 />}
        title="No phase data yet"
        description="Phase time will appear here after the event."
        dashed
      />
    );
  }

  const highlightedPhase = findHighlightedPhase(data);
  const total = data.reduce((sum, d) => sum + d.actualHours, 0);

  // Accessible summary sentence
  const highlightedEntry = data.find((d) => d.phase === highlightedPhase);
  const summary = highlightedEntry
    ? `${highlightedEntry.label} took ${highlightedEntry.actualHours} of the ${total} hours tracked and ran the most over plan.`
    : `${total} hours tracked across ${data.length} phases.`;

  useEffect(() => {
    if (!animated && !prefersReduced) {
      const t = setTimeout(() => {
        setAnimated(true);
        sessionChartAnimated.add(sessionKey);
        onDrawComplete?.();
      }, 500);
      return () => clearTimeout(t);
    }
    if (!animated) {
      setAnimated(true);
      sessionChartAnimated.add(sessionKey);
    }
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-h3 text-ink">Time per phase</h3>
          <p className="text-caption text-ink-muted">Hours</p>
        </div>
        <DataTableModal data={data} />
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 8, left: -16, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--ink-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--ink-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip
            content={<CustomTooltip total={total} />}
            cursor={{ fill: 'var(--surface-sunken)' }}
          />
          <Bar dataKey="actualHours" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((entry) => {
              const isHighlighted = entry.phase === highlightedPhase;
              return (
                <Cell
                  key={entry.phase}
                  fill={isHighlighted ? HIGHLIGHT_FILL : BAR_FILL}
                />
              );
            })}
            {/* Direct value labels on bars */}
            <LabelList
              dataKey="actualHours"
              position="top"
              style={{ fontSize: 11, fontWeight: 700, fill: 'var(--ink-muted)' }}
            />
            {/* Highlighted bar marker — color is never the only encoding [D §10] */}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Most-overrun label below chart [D §10] */}
      {highlightedEntry && (
        <div className="flex items-center gap-2 text-caption text-ink-muted">
          <span
            className="inline-block size-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: HIGHLIGHT_FILL }}
            aria-hidden="true"
          />
          {/* Provisional copy (OQ-23): */}
          <span>
            <strong>{highlightedEntry.label}</strong> ran most over plan
            ({highlightedEntry.actualHours - highlightedEntry.plannedHours}h extra)
          </span>
        </div>
      )}

      {/* Accessible summary [D §10] */}
      <p className="text-caption text-ink-muted sr-only" aria-live="polite">
        {summary}
      </p>
      <p className="text-caption text-ink-muted" role="note">
        {summary}
      </p>
    </div>
  );
}

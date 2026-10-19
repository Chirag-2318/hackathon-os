import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { formatClock } from '../lib/clock';

export type HudTone = 'idle' | 'running' | 'urgent' | 'brand' | 'done';
export type HudState = { text: string; tone: HudTone; pulseKey?: number };

// Later sections get higher numbers, so the section furthest down the page that has started always wins.
export const HUD_ORDER = { rail: 1, pivot: 2, how: 3, stage: 4, submitted: 5 } as const;

const DEFAULT_STATE: HudState = { text: formatClock(36 * 3600), tone: 'idle' };

type Entries = Record<number, HudState>;
type Action = { order: number; state: HudState | null };

function reducer(entries: Entries, action: Action): Entries {
  const current = entries[action.order];
  if (action.state === null) {
    if (current === undefined) return entries;
    const next = { ...entries };
    delete next[action.order];
    return next;
  }
  if (
    current &&
    current.text === action.state.text &&
    current.tone === action.state.tone &&
    current.pulseKey === action.state.pulseKey
  ) {
    return entries;
  }
  return { ...entries, [action.order]: action.state };
}

type Report = (order: number, state: HudState | null) => void;

const HudStateContext = createContext<HudState>(DEFAULT_STATE);
const HudActionsContext = createContext<Report>(() => undefined);

export function HudProvider({ children }: { children: ReactNode }) {
  const [entries, dispatch] = useReducer(reducer, {});
  const report = useCallback<Report>((order, state) => dispatch({ order, state }), []);
  const state = useMemo<HudState>(() => {
    const orders = Object.keys(entries).map(Number);
    if (orders.length === 0) return DEFAULT_STATE;
    return entries[Math.max(...orders)];
  }, [entries]);
  return (
    <HudActionsContext.Provider value={report}>
      <HudStateContext.Provider value={state}>{children}</HudStateContext.Provider>
    </HudActionsContext.Provider>
  );
}

// What the clock currently shows. Only the clock components should call this.
export function useHudState(): HudState {
  return useContext(HudStateContext);
}

// A section calls this once and gets back a stable function: report(state) to take part, report(null) to step out.
export function useHudSource(order: number): (state: HudState | null) => void {
  const report = useContext(HudActionsContext);
  const send = useCallback((state: HudState | null) => report(order, state), [report, order]);
  useEffect(() => () => report(order, null), [report, order]);
  return send;
}

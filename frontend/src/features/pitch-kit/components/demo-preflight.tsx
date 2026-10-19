import React, { useState } from 'react';
import type { DemoPreflightItem } from '../api/pitch-kit-api';
import { toast } from 'sonner';

interface DemoPreflightProps {
  items: DemoPreflightItem[];
  isLeader: boolean;
  onToggleItem: (itemId: string, checked: boolean) => Promise<void>;
  onAddItem: (label: string) => Promise<void>;
  onResetItems: () => Promise<void>;
}

function formatCheckedTime(checkedAt: string | null, userName: string | null): string {
  if (!checkedAt) return '';
  const who = userName || '@teammate';
  try {
    const diffSec = Math.floor((Date.now() - new Date(checkedAt).getTime()) / 1000);
    if (diffSec < 60) return `by ${who} · just now`;
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `by ${who} · ${min}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return `by ${who} · ${h}h ago`;
    return `by ${who}`;
  } catch {
    return `by ${who}`;
  }
}

export function DemoPreflight({
  items,
  isLeader,
  onToggleItem,
  onAddItem,
  onResetItems,
}: DemoPreflightProps) {
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState(false);

  const checkedCount = items.filter((it) => it.checked).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newLabel.trim();
    if (!clean) return;
    setAdding(true);
    try {
      await onAddItem(clean);
      setNewLabel('');
      toast.success('Checklist item added');
    } catch (err: any) {
      toast.error('Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all checklist items for the event?')) return;
    setResetting(true);
    try {
      await onResetItems();
      toast.success('Checklist reset for the event');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reset checklist');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-3.5 pt-4 border-t border-border/60">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
            Before you go on
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {checkedCount} of {items.length} verified by team
          </p>
        </div>

        {isLeader && items.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="text-xs font-mono text-muted-foreground hover:text-foreground focus-visible:outline-none disabled:opacity-50"
          >
            {resetting ? 'Resetting...' : 'Reset for the event'}
          </button>
        )}
      </div>

      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
        {items.map((it) => (
          <label
            key={it.id}
            className="flex items-start gap-2.5 p-2 rounded-md hover:bg-muted/40 cursor-pointer transition-colors text-left group"
          >
            <input
              type="checkbox"
              checked={it.checked}
              onChange={(e) => onToggleItem(it.id, e.target.checked)}
              className="mt-0.5 rounded border-border text-foreground focus:ring-0 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <span
                className={`text-xs block leading-snug transition-colors ${
                  it.checked ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}
              >
                {it.label}
              </span>
              {it.checked && it.checkedAt && (
                <span className="text-[10px] font-mono text-muted-foreground/80 block mt-0.5 tabular-nums">
                  {formatCheckedTime(it.checkedAt, it.checkedByName)}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 pt-1">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="+ Add checklist item..."
          className="flex-1 text-xs px-2.5 py-1.5 border border-border/80 rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/50 font-mono"
        />
        <button
          type="submit"
          disabled={adding || !newLabel.trim()}
          className="text-xs font-mono px-3 py-1.5 rounded-md bg-muted text-foreground hover:bg-muted/80 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}

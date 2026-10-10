import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, MoreHorizontal, Trash2, Link2, X } from 'lucide-react';
import type { RealityLedgerItem, RoomMember, Task } from '@/services/types';
import { IssueKey } from '@/features/build/ui';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export interface MvpRealityLedgerProps {
  ledger: RealityLedgerItem[];
  members: RoomMember[];
  allTasks: Task[];
  onUpdateLedger: (newLedger: RealityLedgerItem[]) => void;
  onOpenTaskByKey?: (key: string) => void;
}

const STATUS_LOZENGES: Record<RealityLedgerItem['status'], { label: string; bg: string; text: string; barColor: string }> = {
  built: { label: 'BUILT THIS WEEKEND', bg: '#E4F7E9', text: '#2E9E55', barColor: '#2E9E55' },
  existing: { label: 'EXISTING API OR LIB', bg: '#E3F1FF', text: '#1D7FD1', barColor: '#1D7FD1' },
  mocked: { label: 'MOCKED', bg: '#FEF3C7', text: '#D97706', barColor: '#D97706' },
  planned: { label: 'PLANNED', bg: '#E9E9EB', text: '#5C5C61', barColor: '#9CA3AF' },
};

export function MvpRealityLedger({
  ledger,
  members,
  allTasks,
  onUpdateLedger,
  onOpenTaskByKey,
}: MvpRealityLedgerProps) {
  // Counts for stacked bar
  const builtCount = ledger.filter(i => i.status === 'built').length;
  const existingCount = ledger.filter(i => i.status === 'existing').length;
  const mockedCount = ledger.filter(i => i.status === 'mocked').length;
  const plannedCount = ledger.filter(i => i.status === 'planned').length;
  const total = ledger.length || 1;

  const updateItem = (id: string, updates: Partial<RealityLedgerItem>) => {
    onUpdateLedger(ledger.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (id: string) => {
    onUpdateLedger(ledger.filter(item => item.id !== id));
  };

  const addRow = () => {
    const newItem: RealityLedgerItem = {
      id: `rl-${Date.now()}`,
      part: 'New feature part',
      status: 'planned',
    };
    onUpdateLedger([...ledger, newItem]);
  };

  return (
    <div className="bg-card rounded-[24px] border border-border p-5 shadow-xs flex flex-col gap-4">
      {/* Header + Stacked Bar */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Reality ledger
          </h3>
          <span className="text-xs text-muted-foreground">
            What did you build this weekend?
          </span>
        </div>

        {/* 8px Stacked Bar */}
        <div className="h-2 w-full rounded-full overflow-hidden flex bg-muted/60">
          {builtCount > 0 && (
            <div style={{ width: `${(builtCount / total) * 100}%` }} className="h-full bg-emerald-500" />
          )}
          {existingCount > 0 && (
            <div style={{ width: `${(existingCount / total) * 100}%` }} className="h-full bg-blue-500" />
          )}
          {mockedCount > 0 && (
            <div style={{ width: `${(mockedCount / total) * 100}%` }} className="h-full bg-amber-500" />
          )}
          {plannedCount > 0 && (
            <div style={{ width: `${(plannedCount / total) * 100}%` }} className="h-full bg-neutral-400" />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            {builtCount} built
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-blue-500" />
            {existingCount} existing
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500" />
            {mockedCount} mocked
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-neutral-400" />
            {plannedCount} planned
          </span>
        </div>
      </div>

      {/* Table (40px rows, hairlines) */}
      <div className="flex flex-col border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40 text-xs">
        {/* Table Header */}
        <div className="flex items-center px-3 h-8 bg-muted/30 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider select-none">
          <div className="flex-1 min-w-[120px]">Part</div>
          <div className="w-44 shrink-0">Status</div>
          <div className="w-16 shrink-0 text-center">Owner</div>
          <div className="w-20 shrink-0">Task</div>
          <div className="w-8 shrink-0" />
        </div>

        {/* Table Rows */}
        {ledger.map(item => {
          const owner = members.find(m => m.id === item.ownerId);
          const meta = STATUS_LOZENGES[item.status] || STATUS_LOZENGES.planned;

          return (
            <div key={item.id} className="flex items-center px-3 h-10 hover:bg-muted/20 transition-colors">
              {/* Part (inline editable) */}
              <input
                type="text"
                value={item.part}
                onChange={(e) => updateItem(item.id, { part: e.target.value })}
                className="flex-1 min-w-[120px] bg-transparent text-xs font-medium focus:outline-none focus:bg-muted/40 px-1 py-0.5 rounded"
              />

              {/* Status Lozenge Dropdown */}
              <div className="w-44 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      style={{ backgroundColor: meta.bg, color: meta.text }}
                      className="h-5 px-2 rounded-[6px] text-[10px] font-bold tracking-[0.03em] uppercase inline-flex items-center truncate max-w-[170px]"
                    >
                      {meta.label}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 text-xs">
                    {(['built', 'existing', 'mocked', 'planned'] as const).map(st => (
                      <DropdownMenuItem key={st} onClick={() => updateItem(item.id, { status: st })}>
                        {STATUS_LOZENGES[st].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Owner Avatar Picker */}
              <div className="w-16 shrink-0 flex items-center justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="size-6 rounded-full overflow-hidden border border-border/40 hover:scale-105 transition-transform flex items-center justify-center text-[10px]">
                      {owner ? (
                        <div className="size-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center" title={owner.name}>
                          {owner.name.slice(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60">?</span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-36 text-xs">
                    <DropdownMenuItem onClick={() => updateItem(item.id, { ownerId: undefined })}>
                      Unassigned
                    </DropdownMenuItem>
                    {members.map(m => (
                      <DropdownMenuItem key={m.id} onClick={() => updateItem(item.id, { ownerId: m.id })}>
                        {m.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Task Link */}
              <div className="w-20 shrink-0 font-mono text-[11px]">
                {item.taskKey ? (
                  <div className="flex items-center gap-1">
                    <IssueKey issueKey={item.taskKey} onClick={() => onOpenTaskByKey?.(item.taskKey!)} />
                    <button onClick={() => updateItem(item.id, { taskKey: undefined })} className="text-muted-foreground hover:text-foreground">
                      <X className="size-2.5" />
                    </button>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Link2 className="size-2.5" />
                        <span>Link</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 max-h-48 overflow-y-auto text-xs">
                      {allTasks.slice(0, 10).map(t => (
                        <DropdownMenuItem key={t.id} onClick={() => updateItem(item.id, { taskKey: t.key })}>
                          <span className="font-mono mr-1.5 text-muted-foreground">{t.key}</span>
                          <span className="truncate">{t.summary}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Row Actions Menu */}
              <div className="w-8 shrink-0 flex items-center justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-28 text-xs">
                    <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-rose-600">
                      <Trash2 className="size-3 mr-1.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Row Button */}
      <button
        onClick={addRow}
        className="self-start text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
      >
        <Plus className="size-3.5" />
        <span>Add row</span>
      </button>
    </div>
  );
}

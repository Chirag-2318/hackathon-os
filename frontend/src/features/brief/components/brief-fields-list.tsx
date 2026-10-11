import React from 'react';
import type { Brief, BriefFields } from '@/services/types';
import { Checkbox } from '@/features/home/components/HomeDesignSystem';
import { cn } from '@/lib/utils';

export const RULE_KEYS = [
  'problemStatement',
  'targetAudience',
  'rubric',
  'deadlines',
  'eligibility',
  'techRules',
  'aiPolicy',
  'deliverables',
  'judgingFormat',
] as const;

interface BriefFieldsListProps {
  brief: Brief;
  canEdit: boolean;
  confirmedChecks: Record<string, boolean>;
  onToggleCheck: (key: string) => void;
  onFieldsChange: (fields: BriefFields) => void;
}

export function BriefFieldsList({
  brief,
  canEdit,
  confirmedChecks,
  onToggleCheck,
  onFieldsChange,
}: BriefFieldsListProps) {
  const fields = brief.fields;

  const handleRubricWeightChange = (idx: number, newWeight: number) => {
    if (!canEdit) return;
    const updatedRubric = [...fields.rubric];
    updatedRubric[idx] = { ...updatedRubric[idx], weight: newWeight };
    onFieldsChange({ ...fields, rubric: updatedRubric });
  };

  const rubricSum = fields.rubric?.reduce((acc, r) => acc + (Number(r.weight) || 0), 0) ?? 0;
  const confirmedCount = RULE_KEYS.filter((k) => confirmedChecks[k]).length;

  return (
    <div className="rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60">
        <h3 className="text-sm font-semibold text-foreground">Extracted Rules & Fields</h3>
        <span className="text-xs text-muted-foreground font-mono">
          {confirmedCount} of 9 confirmed
        </span>
      </div>

      <div className="divide-y divide-border/50">
        {/* 1. Problem Statement */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Problem Statement
            </span>
            <p className="text-xs text-foreground mt-1 leading-relaxed">
              {fields.problemStatement || 'Not specified'}
            </p>
          </div>
          <div className="pt-1">
            <Checkbox
              checked={!!confirmedChecks.problemStatement}
              onChange={() => onToggleCheck('problemStatement')}
            />
          </div>
        </div>

        {/* 2. Target Audience */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Target Audience
            </span>
            <p className="text-xs text-foreground mt-1">
              {fields.targetAudience || 'Not specified'}
            </p>
          </div>
          <div className="pt-1">
            <Checkbox
              checked={!!confirmedChecks.targetAudience}
              onChange={() => onToggleCheck('targetAudience')}
            />
          </div>
        </div>

        {/* 3. Judging Rubric */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Judging Rubric
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold font-mono',
                  rubricSum === 100
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-red-500/10 text-red-600'
                )}
              >
                Total {rubricSum}%
              </span>
            </div>
            <Checkbox
              checked={!!confirmedChecks.rubric}
              onChange={() => onToggleCheck('rubric')}
            />
          </div>

          <div className="flex flex-col gap-2">
            {fields.rubric.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-foreground flex-1 truncate">{r.criterion}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={r.weight}
                    onChange={(e) => handleRubricWeightChange(idx, Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-14 h-7 text-center rounded-lg bg-muted border border-border text-xs font-mono"
                  />
                  <span className="text-muted-foreground text-xs">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Deadlines */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Key Deadlines
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="px-2.5 py-1 rounded-xl bg-muted text-foreground">
                <strong>Start:</strong> {fields.deadlines.start ? new Date(fields.deadlines.start).toLocaleString() : 'Not set'}
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-muted text-foreground">
                <strong>Submission:</strong> {fields.deadlines.submission ? new Date(fields.deadlines.submission).toLocaleString() : 'Not set'}
              </div>
            </div>
          </div>
          <div className="pt-1">
            <Checkbox
              checked={!!confirmedChecks.deadlines}
              onChange={() => onToggleCheck('deadlines')}
            />
          </div>
        </div>

        {/* 5. Eligibility */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Eligibility
            </span>
            <p className="text-xs text-foreground mt-1">{fields.eligibility || 'Not specified'}</p>
          </div>
          <div className="pt-1">
            <Checkbox
              checked={!!confirmedChecks.eligibility}
              onChange={() => onToggleCheck('eligibility')}
            />
          </div>
        </div>

        {/* 6. Tech Rules */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Tech Rules
            </span>
            <p className="text-xs text-foreground mt-1">{fields.techRules || 'Not specified'}</p>
          </div>
          <div className="pt-1">
            <Checkbox
              checked={!!confirmedChecks.techRules}
              onChange={() => onToggleCheck('techRules')}
            />
          </div>
        </div>

        {/* 7. AI Policy */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              AI Policy
            </span>
            <p className="text-xs text-foreground mt-1">{fields.aiPolicy || 'Not specified'}</p>
          </div>
          <div className="pt-1">
            <Checkbox
              checked={!!confirmedChecks.aiPolicy}
              onChange={() => onToggleCheck('aiPolicy')}
            />
          </div>
        </div>

        {/* 8. Deliverables */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Required Deliverables
            </span>
            <ul className="text-xs text-foreground list-disc list-inside space-y-0.5">
              {(fields.deliverables || []).map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
          <div className="pt-1">
            <Checkbox
              checked={!!confirmedChecks.deliverables}
              onChange={() => onToggleCheck('deliverables')}
            />
          </div>
        </div>

        {/* 9. Judging Format */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Judging Format
            </span>
            <p className="text-xs text-foreground mt-1">{fields.judgingFormat || 'Not specified'}</p>
          </div>
          <div className="pt-1">
            <Checkbox
              checked={!!confirmedChecks.judgingFormat}
              onChange={() => onToggleCheck('judgingFormat')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

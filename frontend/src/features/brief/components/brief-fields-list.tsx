import React from 'react';
import type { Brief, BriefFields, RubricCriterion } from '@/services/types';
import { Checkbox } from '@/features/home/components/HomeDesignSystem';
import { Plus, Trash2 } from 'lucide-react';
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
  const fields: BriefFields = {
    problemStatement: brief?.fields?.problemStatement ?? '',
    targetAudience: brief?.fields?.targetAudience ?? '',
    rubric: Array.isArray(brief?.fields?.rubric) ? brief.fields.rubric : [],
    deadlines: {
      start: brief?.fields?.deadlines?.start ?? null,
      freeze: brief?.fields?.deadlines?.freeze ?? null,
      submission: brief?.fields?.deadlines?.submission ?? null,
    },
    eligibility: brief?.fields?.eligibility ?? '',
    techRules: brief?.fields?.techRules ?? '',
    aiPolicy: brief?.fields?.aiPolicy ?? '',
    deliverables: Array.isArray(brief?.fields?.deliverables) ? brief.fields.deliverables : [],
    tracksAndPrizes: Array.isArray(brief?.fields?.tracksAndPrizes) ? brief.fields.tracksAndPrizes : [],
    judgingFormat: brief?.fields?.judgingFormat ?? '',
  };

  const handleRubricWeightChange = (idx: number, newWeight: number) => {
    if (!canEdit) return;
    const updated = [...(fields.rubric || [])];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], weight: newWeight };
      onFieldsChange({ ...fields, rubric: updated });
    }
  };

  const handleRubricCriterionChange = (idx: number, criterion: string) => {
    if (!canEdit) return;
    const updated = [...(fields.rubric || [])];
    if (updated[idx]) {
      updated[idx] = { ...updated[idx], criterion };
      onFieldsChange({ ...fields, rubric: updated });
    }
  };

  const handleAddRubricItem = () => {
    if (!canEdit) return;
    const updated = [...(fields.rubric || []), { criterion: 'New Criterion', weight: 0 }];
    onFieldsChange({ ...fields, rubric: updated });
  };

  const handleRemoveRubricItem = (idx: number) => {
    if (!canEdit) return;
    const updated = (fields.rubric || []).filter((_, i) => i !== idx);
    onFieldsChange({ ...fields, rubric: updated });
  };

  const handleDeliverableChange = (idx: number, value: string) => {
    if (!canEdit) return;
    const updated = [...(fields.deliverables || [])];
    updated[idx] = value;
    onFieldsChange({ ...fields, deliverables: updated });
  };

  const handleAddDeliverable = () => {
    if (!canEdit) return;
    const updated = [...(fields.deliverables || []), ''];
    onFieldsChange({ ...fields, deliverables: updated });
  };

  const handleRemoveDeliverable = (idx: number) => {
    if (!canEdit) return;
    const updated = (fields.deliverables || []).filter((_, i) => i !== idx);
    onFieldsChange({ ...fields, deliverables: updated });
  };

  const rubricSum = fields.rubric?.reduce((acc, r) => acc + (Number(r?.weight) || 0), 0) ?? 0;
  const confirmedCount = RULE_KEYS.filter((k) => confirmedChecks?.[k]).length;

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
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Problem Statement <span className="text-danger">*</span>
            </span>
            {canEdit ? (
              <textarea
                value={fields.problemStatement}
                onChange={(e) => onFieldsChange({ ...fields, problemStatement: e.target.value })}
                placeholder="Describe the problem to solve or project challenge..."
                className="w-full text-xs p-2.5 rounded-xl bg-muted/30 border border-border focus:border-blue-500 focus:bg-background outline-none transition-colors min-h-[70px] leading-relaxed resize-y"
              />
            ) : (
              <p className="text-xs text-foreground mt-1 leading-relaxed">
                {fields.problemStatement || 'Not specified'}
              </p>
            )}
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
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Target Audience
            </span>
            {canEdit ? (
              <input
                type="text"
                value={fields.targetAudience}
                onChange={(e) => onFieldsChange({ ...fields, targetAudience: e.target.value })}
                placeholder="Target users or audience..."
                className="w-full text-xs p-2 rounded-xl bg-muted/30 border border-border focus:border-blue-500 focus:bg-background outline-none"
              />
            ) : (
              <p className="text-xs text-foreground mt-1">{fields.targetAudience || 'Not specified'}</p>
            )}
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
                  rubricSum === 100 || (fields.rubric?.length === 0)
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-red-500/10 text-red-600'
                )}
              >
                Total {rubricSum}% {rubricSum !== 100 && fields.rubric?.length !== 0 && '(must sum to 100%)'}
              </span>
            </div>
            <Checkbox
              checked={!!confirmedChecks.rubric}
              onChange={() => onToggleCheck('rubric')}
            />
          </div>

          <div className="flex flex-col gap-2">
            {(fields.rubric || []).map((r, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                {canEdit ? (
                  <input
                    type="text"
                    value={r?.criterion ?? ''}
                    onChange={(e) => handleRubricCriterionChange(idx, e.target.value)}
                    placeholder="Criterion name"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border focus:bg-background outline-none"
                  />
                ) : (
                  <span className="text-foreground flex-1 truncate">{r?.criterion}</span>
                )}
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={r?.weight ?? 0}
                    onChange={(e) => handleRubricWeightChange(idx, Number(e.target.value))}
                    disabled={!canEdit}
                    className="w-14 h-7 text-center rounded-lg bg-muted border border-border text-xs font-mono"
                  />
                  <span className="text-muted-foreground text-xs">%</span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRubricItem(idx)}
                      className="text-muted-foreground hover:text-danger p-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {canEdit && (
              <button
                type="button"
                onClick={handleAddRubricItem}
                className="self-start text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1 pt-1"
              >
                <Plus className="size-3.5" /> Add criterion
              </button>
            )}
          </div>
        </div>

        {/* 4. Deadlines */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Key Deadlines
            </span>
            {canEdit ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    value={fields.deadlines?.start ? fields.deadlines.start.slice(0, 16) : ''}
                    onChange={(e) => onFieldsChange({
                      ...fields,
                      deadlines: { ...fields.deadlines, start: e.target.value ? new Date(e.target.value).toISOString() : null },
                    })}
                    className="w-full text-xs p-1.5 rounded-lg bg-muted/30 border border-border"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold block mb-1">Submission Deadline</label>
                  <input
                    type="datetime-local"
                    value={fields.deadlines?.submission ? fields.deadlines.submission.slice(0, 16) : ''}
                    onChange={(e) => onFieldsChange({
                      ...fields,
                      deadlines: { ...fields.deadlines, submission: e.target.value ? new Date(e.target.value).toISOString() : null },
                    })}
                    className="w-full text-xs p-1.5 rounded-lg bg-muted/30 border border-border"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="px-2.5 py-1 rounded-xl bg-muted text-foreground">
                  <strong>Start:</strong> {fields.deadlines?.start ? new Date(fields.deadlines.start).toLocaleString() : 'Not set'}
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-muted text-foreground">
                  <strong>Submission:</strong> {fields.deadlines?.submission ? new Date(fields.deadlines.submission).toLocaleString() : 'Not set'}
                </div>
              </div>
            )}
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
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Eligibility
            </span>
            {canEdit ? (
              <input
                type="text"
                value={fields.eligibility}
                onChange={(e) => onFieldsChange({ ...fields, eligibility: e.target.value })}
                placeholder="Team size, student/pro requirements..."
                className="w-full text-xs p-2 rounded-xl bg-muted/30 border border-border focus:bg-background outline-none"
              />
            ) : (
              <p className="text-xs text-foreground mt-1">{fields.eligibility || 'Not specified'}</p>
            )}
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
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Tech Rules
            </span>
            {canEdit ? (
              <textarea
                value={fields.techRules}
                onChange={(e) => onFieldsChange({ ...fields, techRules: e.target.value })}
                placeholder="Allowed frameworks, libraries, APIs..."
                className="w-full text-xs p-2.5 rounded-xl bg-muted/30 border border-border focus:bg-background outline-none min-h-[50px] resize-y"
              />
            ) : (
              <p className="text-xs text-foreground mt-1">{fields.techRules || 'Not specified'}</p>
            )}
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
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              AI Policy
            </span>
            {canEdit ? (
              <input
                type="text"
                value={fields.aiPolicy}
                onChange={(e) => onFieldsChange({ ...fields, aiPolicy: e.target.value })}
                placeholder="Permitted/prohibited AI tools..."
                className="w-full text-xs p-2 rounded-xl bg-muted/30 border border-border focus:bg-background outline-none"
              />
            ) : (
              <p className="text-xs text-foreground mt-1">{fields.aiPolicy || 'Not specified'}</p>
            )}
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
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Required Deliverables
            </span>
            {canEdit ? (
              <div className="flex flex-col gap-2">
                {(fields.deliverables || []).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={d}
                      onChange={(e) => handleDeliverableChange(i, e.target.value)}
                      placeholder="e.g. GitHub repo link, 2-minute video demo..."
                      className="flex-1 text-xs p-1.5 rounded-lg bg-muted/30 border border-border focus:bg-background outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(i)}
                      className="text-muted-foreground hover:text-danger p-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="self-start text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-1"
                >
                  <Plus className="size-3.5" /> Add deliverable
                </button>
              </div>
            ) : (
              <ul className="text-xs text-foreground list-disc list-inside space-y-0.5">
                {(fields.deliverables || []).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
                {(!fields.deliverables || fields.deliverables.length === 0) && (
                  <span className="text-xs text-muted-foreground">None specified</span>
                )}
              </ul>
            )}
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
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Judging Format
            </span>
            {canEdit ? (
              <input
                type="text"
                value={fields.judgingFormat}
                onChange={(e) => onFieldsChange({ ...fields, judgingFormat: e.target.value })}
                placeholder="Pitch deck, live demo, asynchronous video..."
                className="w-full text-xs p-2 rounded-xl bg-muted/30 border border-border focus:bg-background outline-none"
              />
            ) : (
              <p className="text-xs text-foreground mt-1">{fields.judgingFormat || 'Not specified'}</p>
            )}
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

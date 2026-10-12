import * as React from 'react';
import { type SubmissionDraft } from '@/api/client';
import { Card } from '@/components/ui/card';

const COPY_TODO_CHAR_COUNT = 'characters';

const FIELDS: { key: keyof SubmissionDraft; label: string }[] = [
  { key: 'whatItDoes',   label: 'What it does' },
  { key: 'whyItMatters', label: 'Why it matters' },
  { key: 'howWeBuiltIt', label: 'How we built it' },
  { key: 'challenges',   label: 'Challenges' },
  { key: 'whatsNext',    label: "What's next" },
];

interface SubmissionDraftFormProps {
  draft: SubmissionDraft;
  onChange: (field: keyof SubmissionDraft, value: string) => void;
  disabled?: boolean;
}

export function SubmissionDraftForm({ draft, onChange, disabled }: SubmissionDraftFormProps) {
  const safeDraft = draft || ({} as SubmissionDraft);

  return (
    <Card className="p-5 space-y-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submission draft</h3>
      {FIELDS.map(({ key, label }) => {
        const val = (safeDraft[key] ?? (key === 'howWeBuiltIt' ? (safeDraft as any).howBuilt : '')) || '';
        return (
          <div key={String(key)}>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              {label}
            </label>
            <textarea
              value={val}
              onChange={(e) => onChange(key, e.target.value)}
              disabled={disabled}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-[#1C1C1E] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-lav-600 resize-y"
            />
            <p className="text-xs text-slate-400 mt-1">
              {val.length} {COPY_TODO_CHAR_COUNT}
            </p>
          </div>
        );
      })}
    </Card>
  );
}

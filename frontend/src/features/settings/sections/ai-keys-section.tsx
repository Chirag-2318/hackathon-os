/**
 * S28-5 AI and Keys sub-section
 * PRD 6a §3, S28-5
 *
 * Mode selector: Prompt Bridge | Your API key | Managed (Pro)
 * "Stored only in this browser session." verbatim note below each key input.
 * [T §7.1] Keys MUST NOT be stored in localStorage or sessionStorage.
 * In this UI, they are held only in component state (in-memory, not persisted).
 *
 * TODO [OQ-5]: Provider list to be supplied by product team.
 *               Mock fixture uses empty providers array.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '@/features/prep/api/settings-api';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import type { AiMode } from '@/features/prep/api/types';

const MODES: { value: AiMode; label: string }[] = [
  { value: 'promptBridge', label: 'Prompt Bridge' },
  { value: 'yourApiKey',   label: 'Your API key'  },
  { value: 'managed',      label: 'Managed (Pro)' },
];

// TODO [OQ-5]: Replace with real provider list when available.
const PLACEHOLDER_PROVIDERS = [
  { name: 'Provider A' },
  { name: 'Provider B' },
];

export function AiKeysSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const [mode, setMode] = useState<AiMode>('promptBridge');

  // Keys in component state ONLY — not persisted to localStorage [T §7.1]
  const [keys, setKeys] = useState<Record<string, string>>({});

  if (isLoading || !data) return null;

  // Initialize mode from server data once
  if (mode !== data.aiAndKeys.mode && keys && Object.keys(keys).length === 0) {
    setMode(data.aiAndKeys.mode);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-ink">AI and keys</h1>

      {/* Mode selector */}
      <SegmentedControl aria-label="AI mode">
        {MODES.map(m => (
          <SegmentedControlItem
            key={m.value}
            active={mode === m.value}
            onClick={() => setMode(m.value)}
            aria-pressed={mode === m.value}
          >
            {m.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>

      {/* Mode content */}
      {mode === 'promptBridge' && (
        <div className="rounded-card bg-surface border border-border p-5">
          <p className="text-body text-ink">
            Prompts are generated locally. No AI calls are made.
          </p>
        </div>
      )}

      {mode === 'yourApiKey' && (
        <div className="flex flex-col gap-4">
          {PLACEHOLDER_PROVIDERS.map(provider => (
            <div
              key={provider.name}
              className="rounded-card bg-surface-raised border border-border p-5 flex flex-col gap-3"
            >
              <Label htmlFor={`key-${provider.name}`}>{provider.name}</Label>
              <Input
                id={`key-${provider.name}`}
                type="password"
                value={keys[provider.name] ?? ''}
                onChange={e => setKeys(prev => ({ ...prev, [provider.name]: e.target.value }))}
                placeholder="Paste your API key"
                autoComplete="off"
                aria-describedby={`key-note-${provider.name}`}
              />
              {/* Privacy note — verbatim from PRD, visible in UI [PRD §3 S28-5] */}
              <p
                id={`key-note-${provider.name}`}
                className="text-caption text-ink-muted"
              >
                Stored only in this browser session.
              </p>
              {keys[provider.name] && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-start text-[#A82D2D] hover:bg-[#FBD9D7]"
                  onClick={() => setKeys(prev => { const n = { ...prev }; delete n[provider.name]; return n; })}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {mode === 'managed' && (
        <div className="rounded-card bg-surface-raised border border-border p-5 flex flex-col gap-3">
          <p className="text-body text-ink">Upgrade to Pro for managed AI.</p>
          <Button asChild variant="outline" size="sm" className="self-start">
            <Link to="/app/settings/billing">See plans</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

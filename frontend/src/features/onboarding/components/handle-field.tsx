import React, { useState, useEffect, useRef, useCallback } from 'react';
import { onboardingApi } from '../api';
import { Check, X, Loader2, Dices } from 'lucide-react';

const ADJECTIVES = [
  'swift', 'neon', 'cyber', 'solar', 'lunar', 'cosmic', 'pixel', 'quiet',
  'brave', 'nimble', 'clever', 'sharp', 'lucid', 'hyper', 'frosty', 'silent',
  'golden', 'iron', 'stormy', 'wild', 'calm', 'eager', 'kinetic', 'bold',
  'sonic', 'atomic', 'shadow', 'vibrant', 'stellar', 'rapid', 'turbo', 'radiant',
  'amber', 'astral', 'blaze', 'cobalt', 'echo', 'flux', 'matrix', 'quantum'
];

const NOUNS = [
  'otter', 'falcon', 'badger', 'panda', 'fox', 'raven', 'lynx', 'tiger',
  'hawk', 'wolf', 'viper', 'eagle', 'gecko', 'bear', 'cobra', 'owl',
  'heron', 'shark', 'puma', 'moose', 'whale', 'beetle', 'robin', 'bison',
  'zebra', 'moth', 'stag', 'crane', 'dolphin', 'cheetah', 'sparrow', 'hound',
  'mantis', 'ferret', 'koala', 'jaguar', 'rhino', 'orbit', 'spark', 'vector'
];

export interface HandleFieldProps {
  value: string;
  onChange: (val: string) => void;
  onValidChange?: (isValid: boolean) => void;
  firstName?: string;
  autoFocus?: boolean;
}

export function HandleField({
  value,
  onChange,
  onValidChange,
  firstName = '',
  autoFocus = true,
}: HandleFieldProps) {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 4 rules:
  const lenValid = value.length >= 3 && value.length <= 20;
  const charsValid = /^[a-z0-9_.]+$/.test(value);
  const startValid = /^[a-z]/.test(value);
  const noDoubleValid = !value.includes('..') && !value.includes('__') && !value.includes('._') && !value.includes('_.');
  const allRulesPass = lenValid && charsValid && startValid && noDoubleValid;

  const checkAvailability = useCallback(async (handleToCheck: string) => {
    if (!handleToCheck || !allRulesPass) {
      setStatus('invalid');
      setErrorMessage(
        !startValid
          ? 'Handle must start with a letter'
          : !lenValid
          ? 'Must be 3-20 characters'
          : !noDoubleValid
          ? 'No double separators permitted'
          : 'Letters, numbers, underscores and dots only'
      );
      onValidChange?.(false);
      return;
    }

    setChecking(true);
    try {
      const res = await onboardingApi.checkUsernameAvailable(handleToCheck);
      if (res.available) {
        setStatus('available');
        setErrorMessage('');
        setSuggestions([]);
        onValidChange?.(true);
      } else {
        setStatus('taken');
        setErrorMessage(res.reason || "Someone's already using that");
        onValidChange?.(false);

        // Fetch verified suggestions
        generateSuggestions(handleToCheck, firstName);
      }
    } catch {
      setStatus('invalid');
      setErrorMessage('Could not verify handle. Please try again.');
      onValidChange?.(false);
    } finally {
      setChecking(false);
    }
  }, [allRulesPass, lenValid, noDoubleValid, startValid, firstName, onValidChange]);

  // Debounced check on value changes
  useEffect(() => {
    if (!value) {
      setStatus('idle');
      setErrorMessage('');
      setSuggestions([]);
      onValidChange?.(false);
      return;
    }

    const timer = setTimeout(() => {
      checkAvailability(value);
    }, 350);

    return () => clearTimeout(timer);
  }, [value, checkAvailability, onValidChange]);

  // Generate verified suggestions
  const generateSuggestions = async (base: string, name: string) => {
    const cleanName = (name || 'hacker').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanBase = base.toLowerCase().replace(/[^a-z0-9]/g, '');
    const candidates = [
      `${cleanName}_${Math.floor(Math.random() * 89 + 10)}`,
      `${cleanBase}_dev`,
      `go_${cleanBase}`,
    ];

    const verified: string[] = [];
    for (const cand of candidates) {
      if (cand.length >= 3 && cand.length <= 20) {
        try {
          const res = await onboardingApi.checkUsernameAvailable(cand);
          if (res.available) verified.push(cand);
        } catch {
          // ignore
        }
      }
    }
    setSuggestions(verified.slice(0, 3));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/\s+/g, '');
    onChange(val);
  };

  const handleShuffle = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const randomHandle = `${adj}_${noun}`;
    onChange(randomHandle);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ── Big Underline Input ── */}
      <div className="relative flex items-center border-b-2 border-neutral-300 focus-within:border-neutral-900 transition-colors pb-1">
        <span
          className="text-2xl sm:text-[28px] font-mono text-neutral-400 font-semibold select-none mr-1"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          @
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="your_handle"
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          maxLength={20}
          className="w-full text-2xl sm:text-[28px] font-mono font-medium text-neutral-900 placeholder:text-neutral-300 bg-transparent outline-none tracking-tight"
          style={{ fontFamily: 'var(--font-mono)' }}
          aria-label="Pick a handle"
        />

        {/* Action icons on right: Spinner / Status icon / Dice Shuffle */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {checking && <Loader2 className="size-5 text-neutral-400 animate-spin" />}
          {!checking && status === 'available' && (
            <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check className="size-3.5 stroke-[3]" />
            </div>
          )}
          {!checking && (status === 'taken' || (value && status === 'invalid')) && (
            <div className="size-5 rounded-full bg-red-500 text-white flex items-center justify-center">
              <X className="size-3.5 stroke-[3]" />
            </div>
          )}

          <button
            type="button"
            onClick={handleShuffle}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Shuffle a random handle"
            aria-label="Generate random handle"
          >
            <Dices className="size-5" />
          </button>
        </div>
      </div>

      {/* ── Live Validation Status Message ── */}
      <div className="min-h-[20px] text-xs font-medium" aria-live="polite">
        {!checking && status === 'available' && (
          <p className="text-emerald-600 flex items-center gap-1.5 font-medium">
            <Check className="size-3.5" /> yours if you want it
          </p>
        )}
        {!checking && status === 'taken' && (
          <p className="text-red-600 flex items-center gap-1.5 font-medium">
            <X className="size-3.5" /> {errorMessage || "someone's already using that"}
          </p>
        )}
        {!checking && status === 'invalid' && value && (
          <p className="text-amber-600 font-medium">
            {errorMessage}
          </p>
        )}
      </div>

      {/* ── 4 Rule Verification Chips ── */}
      <div className="flex flex-wrap gap-1.5 select-none pt-1">
        {[
          { label: '3-20 characters', satisfied: lenValid },
          { label: 'starts with letter', satisfied: startValid },
          { label: 'letters, numbers, _, .', satisfied: charsValid },
          { label: 'no double separators', satisfied: noDoubleValid },
        ].map((rule) => (
          <span
            key={rule.label}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              rule.satisfied
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
            }`}
          >
            {rule.satisfied && <Check className="size-3 text-emerald-600 stroke-[3]" />}
            {rule.label}
          </span>
        ))}
      </div>

      {/* ── Suggestion Chips if Taken or Invalid ── */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-100">
          <span className="text-xs text-neutral-500 font-medium">Available suggestions:</span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => onChange(sug)}
                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-mono transition-colors cursor-pointer"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                @{sug}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

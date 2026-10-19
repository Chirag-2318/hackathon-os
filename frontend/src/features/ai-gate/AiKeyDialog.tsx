import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Clipboard, ExternalLink, Loader2, Check, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAiKeyDialogStore } from './use-ai-key-dialog-store';
import { saveUserAiKey } from '@/features/prep/api/settings-api';
import { apiFetch } from '@/api/client';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { getVisualViewport, computeCanvasScale } from '@/tour/guided/viewport-scale';
import { useIsMotionReduced } from '@/shared/motion/use-motion-mode';

export function AiKeyDialog() {
  const { isOpen, mode, message, closeDialog } = useAiKeyDialogStore();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewport, setViewport] = useState(() => getVisualViewport());
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const prefersReduced = useIsMotionReduced();

  useEffect(() => {
    if (!isOpen) {
      setKey('');
      setShowKey(false);
      setIsLoading(false);
      setIsSuccess(false);
      setError(null);
      return;
    }

    const handleUpdate = () => setViewport(getVisualViewport());
    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('orientationchange', handleUpdate, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleUpdate);
      vv.addEventListener('scroll', handleUpdate);
    }

    // Focus input on mount
    const timer = setTimeout(() => inputRef.current?.focus(), 100);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('orientationchange', handleUpdate);
      if (vv) {
        vv.removeEventListener('resize', handleUpdate);
        vv.removeEventListener('scroll', handleUpdate);
      }
      clearTimeout(timer);
    };
  }, [isOpen]);

  const recordSkipOrDone = () => {
    if (user?.id) {
      try {
        localStorage.setItem(`ai_key_prompt_done_${user.id}`, 'true');
      } catch {}
      apiFetch('/api/v1/users/me/hotspots', {
        method: 'POST',
        body: JSON.stringify({ key: 'ai_key_prompt_v1' }),
      }).catch(() => null);
    }
  };

  const handleSkip = () => {
    recordSkipOrDone();
    closeDialog();
  };

  // Keyboard navigation & Focus trap & Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, user]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setKey(text.trim());
        setError(null);
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith('gsk_') || trimmed.length < 20 || trimmed.length > 200) {
      setError("That doesn't look like a Groq key. Groq keys start with gsk_.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await saveUserAiKey(trimmed);
      recordSkipOrDone();
      setIsSuccess(true);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-status'] });

      setTimeout(() => {
        closeDialog();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Couldn't reach Groq to check the key. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const cardScale = computeCanvasScale(viewport.width, viewport.height, 560, 520, 0.6, 1.0, 32);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.2 }}
          onClick={handleSkip}
          className="fixed inset-0 bg-[var(--backdrop-fallback,#0a0a0b80)] backdrop-blur-[3px] supports-[backdrop-filter]:bg-[var(--backdrop)]"
          style={{
            backdropFilter: 'var(--backdrop-blur, blur(3px))',
            WebkitBackdropFilter: 'var(--backdrop-blur, blur(3px))',
          }}
          aria-hidden="true"
        />

        {/* Card */}
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-key-dialog-title"
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          animate={
            prefersReduced
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: viewport.width < 640 ? 1 : cardScale }
          }
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full sm:w-[min(560px,calc(100vw-32px))] bg-[#070708] text-zinc-100 rounded-t-[20px] sm:rounded-[20px] border border-[rgba(255,255,255,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_60px_rgba(0,0,0,0.6),0_2px_8px_rgba(0,0,0,0.4)] p-6 sm:p-7 z-10 select-none overflow-y-auto max-h-[92vh] sm:max-h-[88vh]"
        >
          {isSuccess ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Check className="size-6 stroke-[2.5]" />
              </div>
              <h3 className="font-display text-2xl font-normal text-white">
                Key verified. AI features are on.
              </h3>
              <p className="text-[14px] text-zinc-400">
                Your key is stored securely and ready for use.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-left">
              {/* Eyebrow */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                  AI FEATURES
                </span>
                <span className="text-[12px] font-mono text-zinc-500">groq.com</span>
              </div>

              {/* Headline */}
              <h2
                id="ai-key-dialog-title"
                className="font-display text-[26px] sm:text-[34px] font-normal text-white leading-[1.1] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Bring your own AI key.
              </h2>

              {/* Needed Mode Context Warning */}
              {mode === 'needed' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{message || "You haven't added your API key yet."}</span>
                </div>
              )}

              {/* Body */}
              <p className="text-[15px] text-zinc-300 leading-relaxed">
                AI features run on your own Groq key, so the usage and the limits are yours. Groq's
                free plan doesn't need a credit card.
              </p>

              {/* 3 Numbered Steps with Hairlines */}
              <div className="border-t border-white/10 mt-1">
                <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-[14px]">
                  <span className="text-zinc-200">
                    <strong className="text-white font-mono mr-2">1.</strong> Open the Groq console
                  </span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
                  >
                    Open Console <ExternalLink className="size-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-[14px]">
                  <span className="text-zinc-200">
                    <strong className="text-white font-mono mr-2">2.</strong> Create an API key
                  </span>
                  <span className="text-xs text-zinc-500">Free, instant</span>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-white/10 text-[14px]">
                  <span className="text-zinc-200">
                    <strong className="text-white font-mono mr-2">3.</strong> Paste it here
                  </span>
                  <span className="text-xs font-mono text-zinc-500">gsk_...</span>
                </div>
              </div>

              {/* Groq distinction note */}
              <p className="text-[12px] text-zinc-400">
                This is Groq (groq.com), not xAI's Grok.
              </p>

              {/* Key Form */}
              <form onSubmit={handleSaveAndTest} className="flex flex-col gap-3 mt-1">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type={showKey ? 'text' : 'password'}
                    placeholder="gsk_••••••••••••••••••••••••••••••••"
                    value={key}
                    onChange={(e) => {
                      setKey(e.target.value);
                      setError(null);
                    }}
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full h-11 px-3 pr-24 rounded-xl bg-zinc-900 border border-white/15 text-white placeholder:text-zinc-500 text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-colors"
                  />
                  <div className="absolute right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      aria-label={showKey ? 'Hide key' : 'Show key'}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                    >
                      <Clipboard className="size-3.5" />
                      Paste
                    </button>
                  </div>
                </div>

                {/* Inline error */}
                {error && (
                  <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={isLoading}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl text-[14px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Skip for now
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !key.trim()}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl text-[14px] font-semibold text-black bg-white hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Verifying with Groq...</span>
                      </>
                    ) : (
                      <span>Save and test</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Footers */}
              <div className="flex flex-col gap-1.5 pt-3 border-t border-white/10 text-[12px] text-zinc-400 leading-normal">
                <p>
                  You can add it later in Settings, under AI. Everything except the AI features works
                  without it.
                </p>
                <p>
                  Your key is encrypted on our server and only used for your own requests. When you
                  use an AI feature, the room text involved is sent to Groq.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { OnboardingBadge } from '@/features/onboarding/components/onboarding-badge';
import { getPresetAvatarUrl } from '@/features/onboarding/preset-avatars';
import type { CurrentUserDto } from '@/features/auth/api';
import type { TourPath } from '../types';

import { getVisualViewport, computeCanvasScale } from './viewport-scale';

interface FinaleCardProps {
  user: CurrentUserDto | null;
  tourPath: TourPath;
  isReducedMotion?: boolean;
  onFinishTour: () => void;
}

export function FinaleCard({
  user,
  tourPath,
  isReducedMotion = false,
  onFinishTour,
}: FinaleCardProps) {
  const [stampLanded, setStampLanded] = useState(false);
  const [stampThud, setStampThud] = useState(false);
  const [showConfetti, setShowConfetti] = useState(!isReducedMotion);
  const [viewport, setViewport] = useState(() => getVisualViewport());

  useEffect(() => {
    const handleUpdate = () => setViewport(getVisualViewport());
    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('orientationchange', handleUpdate, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleUpdate);
      vv.addEventListener('scroll', handleUpdate);
    }
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('orientationchange', handleUpdate);
      if (vv) {
        vv.removeEventListener('resize', handleUpdate);
        vv.removeEventListener('scroll', handleUpdate);
      }
    };
  }, []);

  const finaleScale = computeCanvasScale(viewport.width, viewport.height, 560, 380, 0.5, 1.0, 32);

  const avatarSrc =
    user?.avatarType === 'PRESET' && user?.avatarPreset
      ? getPresetAvatarUrl(user.avatarPreset)
      : user?.avatarUrl ?? null;

  useEffect(() => {
    const t = setTimeout(() => {
      setStampLanded(true);
      if (!isReducedMotion) {
        setStampThud(true);
        setTimeout(() => setStampThud(false), 200);
      }
    }, isReducedMotion ? 200 : 700);

    return () => clearTimeout(t);
  }, [isReducedMotion]);

  // Keyboard shortcut: Enter finishes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onFinishTour();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFinishTour]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="finale-title"
      initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: finaleScale }}
      exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        transformOrigin: 'center center',
      }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(560px,calc(100vw-32px))] bg-[var(--tour-bg)] text-[var(--tour-text)] rounded-[20px] border border-[var(--tour-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_60px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.3)] z-50 p-5 sm:p-7 select-none overflow-hidden"
    >
      {/* Tiny confetti puff on arrival */}
      {showConfetti && !isReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => {
            const angle = (i / 18) * 360;
            const dist = 80 + (i % 4) * 35;
            const tx = dist * Math.cos((angle * Math.PI) / 180);
            const ty = dist * Math.sin((angle * Math.PI) / 180);
            const colors = ['#EAB308', '#F59E0B', '#F7F4EB', '#EC4899', '#3B82F6'];
            const color = colors[i % colors.length];
            return (
              <motion.div
                key={i}
                initial={{ x: '50%', y: '50%', opacity: 1, scale: 1 }}
                animate={{
                  x: `calc(50% + ${tx}px)`,
                  y: `calc(50% + ${ty}px)`,
                  opacity: 0,
                  scale: 0.5,
                  rotate: i * 35,
                }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  backgroundColor: color,
                  borderRadius: i % 2 === 0 ? '50%' : '1px',
                }}
              />
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
        {/* Left: Headline & Checklist & Action Button */}
        <div className="md:col-span-7 flex flex-col gap-4 text-left">
          <span
            className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-semibold"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Final Clearance
          </span>

          <h2
            id="finale-title"
            tabIndex={-1}
            className="text-2xl sm:text-3xl font-normal text-[var(--tour-text)] leading-[1.08] tracking-tight outline-none"
            style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
          >
            That's the tour. Now it's your turn.
          </h2>

          {/* Three small draw-on ticks */}
          <div className="flex flex-col gap-2 my-0.5">
            {[
              { id: 't1', label: 'Badge printed', delay: 0.15 },
              { id: 't2', label: 'Room tour done', delay: 0.35 },
              { id: 't3', label: 'Your turn', delay: 0.55 },
            ].map((tick) => (
              <motion.div
                key={tick.id}
                initial={isReducedMotion ? undefined : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: isReducedMotion ? 0 : tick.delay }}
                className="flex items-center gap-2 text-xs sm:text-[13px] text-[var(--tour-text-muted)]"
              >
                <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Check className="size-2.5 stroke-[3]" />
                </div>
                <span className="font-medium tracking-wide">{tick.label}</span>
              </motion.div>
            ))}
          </div>

          <div className="pt-1">
            <button
              type="button"
              autoFocus
              onClick={onFinishTour}
              className="px-6 py-2.5 rounded-xl bg-[var(--tour-text)] hover:bg-white text-neutral-950 font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(244,241,234,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2"
            >
              Go to Home <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Right: User's real OnboardingBadge swinging in on lanyard + CLEARED Stamp */}
        <div className="md:col-span-5 flex justify-center items-center relative py-2">
          <div className={`relative transition-transform ${stampThud ? 'scale-95' : 'scale-100'} scale-[0.68] sm:scale-[0.72] origin-center`}>
            <OnboardingBadge
              displayName={user?.displayName || user?.name || 'Builder'}
              handle={user?.username || 'builder'}
              avatarSrc={avatarSrc}
              roleTags={user?.roleTags || ['Full Stack']}
              experienceLevel={user?.experienceLevel || 'MID'}
              goal={user?.goal || 'ALL'}
              className="scale-95 sm:scale-100"
            />

            {/* Red-orange "CLEARED FOR TAKEOFF" Stamp Slam */}
            {stampLanded && (
              <motion.div
                initial={isReducedMotion ? undefined : { scale: 3, opacity: 0, rotate: -24 }}
                animate={{ scale: 1, opacity: 1, rotate: -12 }}
                transition={{ duration: 0.28, ease: [0.2, 0.9, 0.3, 1] }}
                className="absolute inset-x-2 bottom-12 p-2 border-4 border-red-600 bg-red-600/90 text-white font-mono font-black text-center text-xs sm:text-sm tracking-widest uppercase shadow-2xl rounded-sm select-none pointer-events-none"
              >
                CLEARED FOR TAKEOFF
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

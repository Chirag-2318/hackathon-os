import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Rocket, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OnboardingBadge } from '@/features/onboarding/components/onboarding-badge';
import { getPresetAvatarUrl } from '@/features/onboarding/preset-avatars';
import type { CurrentUserDto } from '@/features/auth/api';
import { persistTourStatus, CURRENT_TOUR_VERSION } from '../api';
import type { TourPath } from '../types';

interface FinaleSceneProps {
  user: CurrentUserDto | null;
  tourPath: TourPath;
  isReplay?: boolean;
  onReplay: () => void;
  isReducedMotion?: boolean;
}

export function FinaleScene({
  user,
  tourPath,
  isReplay = false,
  onReplay,
  isReducedMotion = false,
}: FinaleSceneProps) {
  const navigate = useNavigate();
  const [stampLanded, setStampLanded] = useState(false);
  const [stampThud, setStampThud] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [doorsOpening, setDoorsOpening] = useState(false);

  // Resolved user avatar
  const avatarSrc =
    user?.avatarType === 'PRESET' && user?.avatarPreset
      ? getPresetAvatarUrl(user.avatarPreset)
      : user?.avatarUrl ?? null;

  // Stamp slams onto badge with thud after badge swings in
  useEffect(() => {
    const t = setTimeout(() => {
      setStampLanded(true);
      if (!isReducedMotion) {
        setStampThud(true);
        setTimeout(() => setStampThud(false), 200);
      }
    }, isReducedMotion ? 200 : 900);

    return () => clearTimeout(t);
  }, [isReducedMotion]);

  // Handle Launch
  const handleLaunch = () => {
    if (countdown !== null || doorsOpening) return;

    // Persist tour completed if not replay
    if (!isReplay) {
      persistTourStatus('COMPLETED', tourPath, CURRENT_TOUR_VERSION);
    }

    if (isReducedMotion) {
      navigate('/app/home', { replace: true });
      return;
    }

    // 3-2-1 countdown sequence (500ms each)
    setCountdown(3);
    setTimeout(() => setCountdown(2), 500);
    setTimeout(() => setCountdown(1), 1000);
    setTimeout(() => {
      setCountdown(null);
      // Navigate when countdown ends so Home renders underneath the opening doors
      navigate('/app/home', { replace: true });
      setDoorsOpening(true);
    }, 1500);
  };

  // Keyboard shortcut: Enter launches
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D12] overflow-hidden select-none">
      {/* ── Top & Bottom Hangar Doors for Lift-off split ── */}
      <AnimatePresence>
        {doorsOpening && (
          <>
            {/* Top Hangar Door */}
            <motion.div
              initial={{ translateY: '0%' }}
              animate={{ translateY: '-100%' }}
              transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
              className="fixed inset-x-0 top-0 h-1/2 bg-[#0B0D12] z-50 border-b border-[#F7F4EB]/30 shadow-2xl pointer-events-none"
            />
            {/* Seam Light Bar */}
            <motion.div
              initial={{ opacity: 1, scaleY: 1 }}
              animate={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-x-0 top-1/2 h-1 bg-[#F7F4EB] shadow-[0_0_24px_#F7F4EB] z-50 pointer-events-none -translate-y-1/2"
            />
            {/* Bottom Hangar Door */}
            <motion.div
              initial={{ translateY: '0%' }}
              animate={{ translateY: '100%' }}
              transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
              className="fixed inset-x-0 bottom-0 h-1/2 bg-[#0B0D12] z-50 border-t border-[#F7F4EB]/30 shadow-2xl pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Countdown Overlay (3, 2, 1 in huge mono digits) ── */}
      <AnimatePresence mode="wait">
        {countdown !== null && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
            <motion.div
              key={countdown}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.8, 1.3], opacity: [1, 0] }}
              transition={{ duration: 0.48, ease: 'easeOut' }}
              className="text-8xl sm:text-9xl md:text-[14rem] font-mono font-black text-[#F7F4EB] tracking-tighter"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {countdown}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Main Stage Content ── */}
      <div className="w-full max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left: Headline & Checklist & Action buttons */}
        <div className="lg:col-span-6 flex flex-col gap-6 text-left">
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-2"
          >
            <span
              className="text-xs font-mono tracking-widest text-[#EAB308] uppercase"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Final Clearance
            </span>
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#F7F4EB] leading-[1.02] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Start your journey.
            </h1>
          </motion.div>

          {/* Three tiny lines with draw-on ticks */}
          <div className="flex flex-col gap-3 my-2">
            {[
              { id: 'c1', label: 'Badge printed', delay: 0.3 },
              { id: 'c2', label: 'Flight reviewed', delay: 0.6 },
              { id: 'c3', label: 'Room awaiting you', delay: 0.9 },
            ].map((item) => (
              <motion.div
                key={item.id}
                initial={isReducedMotion ? undefined : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: isReducedMotion ? 0 : item.delay }}
                className="flex items-center gap-3 text-sm text-[#D1D5DB]"
              >
                <div className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <Check className="size-3.5 stroke-[3]" />
                </div>
                <span className="font-medium tracking-wide">{item.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleLaunch}
              className="px-9 py-4 rounded-2xl bg-[#F7F4EB] text-neutral-950 text-base font-semibold hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_28px_rgba(247,244,235,0.3)] cursor-pointer inline-flex items-center gap-2"
            >
              Launch <Rocket className="size-4" />
            </button>

            <button
              type="button"
              onClick={onReplay}
              className="px-4 py-3 rounded-xl text-xs font-medium text-[#9CA3AF] hover:text-[#F7F4EB] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw className="size-3.5" /> Replay the flight
            </button>
          </div>
        </div>

        {/* Centre-Right: Real User OnboardingBadge swinging on lanyard + CLEARED Stamp */}
        <div className="lg:col-span-6 flex justify-center items-center relative py-6">
          <div className={`relative transition-transform ${stampThud ? 'scale-95' : 'scale-100'}`}>
            <OnboardingBadge
              displayName={user?.displayName || user?.name || 'Builder'}
              handle={user?.username || 'builder'}
              avatarSrc={avatarSrc}
              roleTags={user?.roleTags || ['Full Stack']}
              experienceLevel={user?.experienceLevel || 'MID'}
              goal={user?.goal || 'ALL'}
              className="scale-95 sm:scale-105"
            />

            {/* Red-orange "CLEARED FOR TAKEOFF" Stamp Slam */}
            {stampLanded && (
              <motion.div
                initial={isReducedMotion ? undefined : { scale: 3, opacity: 0, rotate: -24 }}
                animate={{ scale: 1, opacity: 1, rotate: -12 }}
                transition={{ duration: 0.32, ease: [0.2, 0.9, 0.3, 1] }}
                className="absolute inset-x-2 bottom-12 p-2 border-4 border-red-600 bg-red-600/90 text-white font-mono font-black text-center text-xs sm:text-sm tracking-widest uppercase shadow-2xl rounded-sm backdrop-blur-xs select-none pointer-events-none"
              >
                CLEARED FOR TAKEOFF
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

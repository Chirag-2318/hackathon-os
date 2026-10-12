import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Barcode } from './barcode';
import { Sparkles, Trophy, Compass, Star } from 'lucide-react';

export interface OnboardingBadgeProps {
  displayName: string;
  handle: string;
  avatarSrc?: string | null;
  roleTags?: string[];
  experienceLevel?: 'FIRST' | 'LOW' | 'MID' | 'HIGH';
  goal?: 'WIN' | 'LEARN' | 'PORTFOLIO' | 'ALL';
  isFlipped?: boolean;
  isPrinting?: boolean;
  joinedDate?: string;
  className?: string;
}

const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  FIRST: { label: 'ROOKIE', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  LOW:   { label: 'REGULAR', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  MID:   { label: 'VETERAN', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  HIGH:  { label: 'LEGEND', color: 'bg-amber-100 text-amber-800 border-amber-300' },
};

const GOAL_MAP: Record<string, { label: string; icon: any }> = {
  WIN: { label: 'Win it', icon: Trophy },
  LEARN: { label: 'Learn a lot', icon: Compass },
  PORTFOLIO: { label: 'Build my portfolio', icon: Star },
  ALL: { label: 'All three', icon: Sparkles },
};

export function OnboardingBadge({
  displayName,
  handle,
  avatarSrc,
  roleTags = [],
  experienceLevel,
  goal,
  isFlipped = false,
  isPrinting = false,
  joinedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  className = '',
}: OnboardingBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // max 6 deg tilt
    const tiltX = -(y / (rect.height / 2)) * 6;
    const tiltY = (x / (rect.width / 2)) * 6;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const levelInfo = experienceLevel ? LEVEL_MAP[experienceLevel] : null;
  const goalInfo = goal ? GOAL_MAP[goal] : null;

  return (
    <div
      className={`relative flex flex-col items-center select-none ${className}`}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Lanyard Strap & Metal Clip ── */}
      <div className="flex flex-col items-center z-20 pointer-events-none">
        {/* Woven Strap */}
        <div className="w-9 h-14 bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 rounded-t-sm shadow-inner flex items-center justify-center">
          <div className="w-0.5 h-full bg-neutral-700/60" />
        </div>
        {/* Metal Swivel Clasp */}
        <div className="w-5 h-3.5 bg-gradient-to-b from-neutral-300 via-neutral-200 to-neutral-400 rounded-t-sm border border-neutral-400 shadow-sm" />
        <div className="w-3.5 h-2.5 -mt-0.5 bg-gradient-to-b from-neutral-400 to-neutral-500 rounded-b-md border border-neutral-500 shadow-sm" />
        {/* Badge Hole Punch */}
        <div className="w-6 h-1.5 -mt-1 bg-neutral-900/80 rounded-full border border-neutral-700 z-10" />
      </div>

      {/* ── 3D Swinging & Flipping Badge Body ── */}
      <motion.div
        ref={cardRef}
        animate={{
          rotateZ: prefersReducedMotion ? 0 : [0, 1.2, -1.2, 0],
          rotateX: tilt.x,
          rotateY: isFlipped ? 180 + tilt.y : tilt.y,
        }}
        transition={{
          rotateZ: {
            repeat: Infinity,
            duration: 6,
            ease: 'easeInOut',
          },
          rotateX: { type: 'spring', stiffness: 300, damping: 20 },
          rotateY: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        }}
        style={{
          transformStyle: 'preserve-3d',
          width: '300px',
          height: '440px',
        }}
        className="relative -mt-1.5"
      >
        {/* ── FRONT FACE ── */}
        <div
          className="absolute inset-0 w-full h-full rounded-[20px] bg-white border border-neutral-200/90 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-between p-5"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Printing Shimmer Animation */}
          {isPrinting && (
            <motion.div
              initial={{ top: '-100%' }}
              animate={{ top: '150%' }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-lav-500/20 to-transparent pointer-events-none z-30"
            />
          )}

          {/* Top: Participant Label */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-800 uppercase font-mono">
                HACKATHON OS
              </span>
            </div>
            <span className="text-[9px] font-bold tracking-[0.16em] uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
              PARTICIPANT
            </span>
          </div>

          {/* Center: Avatar Slot & Name */}
          <div className="flex flex-col items-center text-center my-auto">
            {/* Avatar Circle */}
            <div className="relative size-24 rounded-full p-1 border border-neutral-200 bg-neutral-50 shadow-sm mb-3">
              {avatarSrc ? (
                <motion.img
                  key={avatarSrc}
                  initial={{ scale: 1.15, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  src={avatarSrc}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 text-xs font-mono">
                  No face
                </div>
              )}
            </div>

            {/* Display Name */}
            <h3
              className="text-[26px] leading-[30px] font-normal text-neutral-900 tracking-tight truncate max-w-[260px]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {displayName || 'Anonymous'}
            </h3>

            {/* Handle in Monospace */}
            <p
              className="text-[13px] font-mono text-neutral-500 mt-0.5 tracking-tight"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {handle ? `@${handle}` : '@your_handle'}
            </p>

            {/* Role Stickers Row */}
            <div className="flex items-center justify-center gap-1.5 mt-3 min-h-[24px] flex-wrap max-w-[260px]">
              {roleTags.length > 0 ? (
                roleTags.map((tag) => (
                  <motion.span
                    key={tag}
                    initial={{ scale: 1.25, rotate: -4, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-medium tracking-tight shadow-sm"
                  >
                    {tag}
                  </motion.span>
                ))
              ) : (
                <span className="text-[10px] text-neutral-400 border border-dashed border-neutral-200 rounded px-2 py-0.5">
                  + Add roles
                </span>
              )}
            </div>
          </div>

          {/* Bottom Area: Level Ribbon + Barcode */}
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-neutral-100">
            {/* Level Ribbon */}
            {levelInfo ? (
              <motion.div
                initial={{ scale: 1.15, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-full py-1 text-center rounded-md border text-[11px] font-bold tracking-[0.16em] uppercase shadow-xs ${levelInfo.color}`}
              >
                ★ {levelInfo.label} ★
              </motion.div>
            ) : (
              <div className="w-full py-1 text-center rounded-md border border-dashed border-neutral-200 text-neutral-400 text-[10px] font-medium">
                Miles not claimed
              </div>
            )}

            {/* Barcode */}
            <Barcode value={handle || 'hackathon-os'} width={190} height={28} showText />
          </div>
        </div>

        {/* ── BACK FACE ── */}
        <div
          className="absolute inset-0 w-full h-full rounded-[20px] bg-white border border-neutral-200/90 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-between p-6"
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Top */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-800 uppercase font-mono">
              HACKATHON OS
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              VERIFIED
            </span>
          </div>

          {/* Center Info */}
          <div className="flex flex-col items-center text-center my-auto gap-4">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex flex-col items-center w-full">
              <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                MISSION GOAL
              </span>
              <p
                className="text-[20px] font-normal text-neutral-900 mt-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {goalInfo ? goalInfo.label : 'Build great things'}
              </p>
            </div>

            <div className="text-center">
              <span className="text-[11px] text-neutral-400 uppercase tracking-widest font-mono">
                MEMBER SINCE
              </span>
              <p className="text-[14px] font-semibold text-neutral-800 font-mono mt-0.5">
                {joinedDate}
              </p>
            </div>
          </div>

          {/* Large Back Barcode */}
          <div className="flex flex-col items-center pt-3 border-t border-neutral-100">
            <Barcode value={`HACK-${handle || 'OS'}`} width={230} height={48} showText />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

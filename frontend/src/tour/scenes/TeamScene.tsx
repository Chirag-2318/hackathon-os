import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Users, ArrowRight } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { SAMPLE_ROOM, SAMPLE_TEAMMATES } from '../fixtures';
import type { SceneProps } from '../types';

export function TeamScene({
  active,
  tourPath,
  onTryItComplete,
  isReducedMotion = false,
}: SceneProps) {
  const [typedCode, setTypedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [dockedCount, setDockedCount] = useState(1);
  const [memberJoined, setMemberJoined] = useState(false);

  useEffect(() => {
    if (!active) {
      setTypedCode('');
      setCopied(false);
      setDockedCount(1);
      setMemberJoined(false);
      return;
    }

    if (isReducedMotion) {
      setTypedCode(SAMPLE_ROOM.code);
      setDockedCount(SAMPLE_TEAMMATES.length);
      setMemberJoined(true);
      return;
    }

    // Typing effect
    const full = SAMPLE_ROOM.code;
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setTypedCode(full.slice(0, idx));
      if (idx >= full.length) {
        clearInterval(interval);
        // After typing, flip copy / join button & dock teammates
        setTimeout(() => setCopied(true), 600);
        setTimeout(() => setMemberJoined(true), 800);
        setTimeout(() => setDockedCount(2), 1200);
        setTimeout(() => setDockedCount(3), 1800);
        setTimeout(() => setDockedCount(4), 2400);
        setTimeout(() => setDockedCount(5), 3000);
      }
    }, 90);

    return () => clearInterval(interval);
  }, [active, isReducedMotion]);

  const handleCopyClick = () => {
    setCopied(true);
    if (onTryItComplete) onTryItComplete();
  };

  return (
    <div className="flex flex-col gap-5 w-full text-xs">
      {tourPath === 'LEADER' ? (
        /* ── LEADER PATH SCENE ── */
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
            <div>
              <span className="text-[11px] font-mono text-neutral-500 font-semibold block uppercase">
                Room Invite Code
              </span>
              <span className="text-xs text-neutral-600">Give this to your 5 teammates</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="px-4 py-2 rounded-xl bg-[#FAF6E9] border border-[#E8DFC5] text-base font-mono font-bold tracking-wider text-neutral-900 shadow-inner"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {typedCode || '········'}
              </span>

              {/* Try It: Real clickable button */}
              <button
                type="button"
                onClick={handleCopyClick}
                className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}
                title="Click to copy code"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Docking Avatars & Roles */}
          <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between text-neutral-700">
              <span className="font-semibold flex items-center gap-1.5">
                <Users className="size-3.5 text-blue-600" /> Team Orbit Roster ({dockedCount}/6)
              </span>
              <span className="text-[11px] font-mono text-emerald-600 font-medium">Ready for brief</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {SAMPLE_TEAMMATES.map((tm, idx) => {
                const isDocked = idx < dockedCount;
                if (!isDocked) return null;

                return (
                  <motion.div
                    key={tm.userId}
                    initial={isReducedMotion ? undefined : { x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200/80"
                  >
                    <UserAvatar user={tm} size={28} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-semibold text-neutral-900 truncate">
                        {tm.name}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-500 truncate">
                        {tm.roleTag}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── MEMBER PATH SCENE ── */
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-3">
            <span className="text-[11px] font-mono text-neutral-500 font-semibold uppercase">
              Join Existing Room
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={typedCode}
                placeholder="Enter 8-char code"
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 font-mono text-sm tracking-widest text-neutral-900 font-bold outline-none"
              />
              <motion.button
                type="button"
                animate={memberJoined ? { scale: [1, 1.05, 1] } : {}}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-medium flex items-center gap-1.5 shadow-sm"
              >
                Join <ArrowRight className="size-3.5" />
              </motion.button>
            </div>
          </div>

          {/* Room Card with Leader details */}
          {memberJoined && (
            <motion.div
              initial={isReducedMotion ? undefined : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <UserAvatar user={SAMPLE_TEAMMATES[0]} size={36} />
                <div className="flex flex-col">
                  <span className="font-semibold text-neutral-900 text-xs">
                    {SAMPLE_ROOM.name} · Led by Priya Sharma
                  </span>
                  <span className="text-[10px] text-neutral-500">{SAMPLE_ROOM.event}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                Joined Room
              </span>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

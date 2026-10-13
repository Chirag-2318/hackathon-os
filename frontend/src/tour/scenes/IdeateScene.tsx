import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Send } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { SAMPLE_IDEAS, SAMPLE_TEAMMATES } from '../fixtures';
import type { SceneProps } from '../types';

export function IdeateScene({
  active,
  tourPath,
  onTryItComplete,
  isReducedMotion = false,
}: SceneProps) {
  const [ideas, setIdeas] = useState(SAMPLE_IDEAS);
  const [approvedId, setApprovedId] = useState<string | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [memberIdeaText, setMemberIdeaText] = useState('');
  const [customIdeaAdded, setCustomIdeaAdded] = useState(false);

  useEffect(() => {
    if (!active) {
      setIdeas(SAMPLE_IDEAS);
      setApprovedId(null);
      setRejectedId(null);
      setScreenShake(false);
      setCustomIdeaAdded(false);
      return;
    }

    if (isReducedMotion) {
      setApprovedId('idea-1');
      setRejectedId('idea-2');
      return;
    }

    // Ghost cursor automated actions for demo
    const tApprove = setTimeout(() => {
      setApprovedId('idea-1');
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 200);
    }, 1800);

    const tReject = setTimeout(() => {
      setRejectedId('idea-2');
    }, 3200);

    return () => {
      clearTimeout(tApprove);
      clearTimeout(tReject);
    };
  }, [active, isReducedMotion]);

  const handleManualAction = (id: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      setApprovedId(id);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 200);
    } else {
      setRejectedId(id);
    }
    if (onTryItComplete) onTryItComplete();
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberIdeaText.trim()) return;
    setCustomIdeaAdded(true);
    setMemberIdeaText('');
    if (onTryItComplete) onTryItComplete();
  };

  return (
    <div
      className={`flex flex-col gap-3.5 w-full text-xs transition-transform ${
        screenShake ? 'translate-x-[4px]' : 'translate-x-0'
      }`}
    >
      {/* Ghost Leader Cursor Simulation */}
      {!isReducedMotion && active && (
        <motion.div
          initial={{ opacity: 0, x: 200, y: 150 }}
          animate={{
            opacity: [0, 1, 1, 1, 0],
            x: [200, 140, 140, 240, 300],
            y: [150, 45, 45, 110, 180],
          }}
          transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2 }}
          className="absolute z-40 pointer-events-none flex items-center gap-1"
        >
          <div className="size-3.5 bg-neutral-900 border-2 border-white rounded-full shadow-md" />
          <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white text-[9px] font-mono font-medium shadow-sm">
            Leader
          </span>
        </motion.div>
      )}

      {/* Idea Blocks */}
      <div className="flex flex-col gap-2.5">
        <AnimatePresence>
          {ideas.map((item, idx) => {
            const isApproved = approvedId === item.id;
            const isRejected = rejectedId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={isReducedMotion ? undefined : { opacity: 0, y: -20 }}
                animate={
                  isRejected
                    ? { opacity: 0.35, rotate: -4, x: 20, scale: 0.96 }
                    : { opacity: 1, y: 0, rotate: 0, scale: 1 }
                }
                transition={{ duration: 0.35, delay: isReducedMotion ? 0 : idx * 0.1 }}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 relative overflow-hidden transition-colors ${
                  isApproved
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : isRejected
                    ? 'bg-neutral-100 border-neutral-200'
                    : 'bg-white border-neutral-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={item.author} size={30} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-neutral-500 font-medium">
                      {item.author.name}
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-900 truncate">
                      {item.title}
                    </span>
                  </div>
                </div>

                {/* Status Stamp or Interactive Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isApproved ? (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-bold tracking-wider shadow-sm uppercase animate-in zoom-in-75 duration-150">
                      APPROVED
                    </span>
                  ) : isRejected ? (
                    <span className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-600 font-mono text-[10px] uppercase">
                      REJECTED
                    </span>
                  ) : tourPath === 'LEADER' ? (
                    /* Try It for Leader */
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleManualAction(item.id, 'approve')}
                        className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                        title="Approve Idea"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManualAction(item.id, 'reject')}
                        className="p-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 cursor-pointer"
                        title="Reject Idea"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Custom Idea dropped in for Member Try-It */}
        {customIdeaAdded && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <UserAvatar user={SAMPLE_TEAMMATES[1]} size={30} />
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-700 font-medium">Your Pitched Idea</span>
                <span className="text-[11px] font-semibold text-neutral-900">
                  Adaptive bus stop displays with battery backup & SMS fallback
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[9px] font-bold">
              PENDING
            </span>
          </motion.div>
        )}
      </div>

      {/* Try It for Member path: Type short idea */}
      {tourPath === 'MEMBER' && !customIdeaAdded && (
        <form onSubmit={handleMemberSubmit} className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-200">
          <input
            type="text"
            value={memberIdeaText}
            onChange={(e) => setMemberIdeaText(e.target.value)}
            placeholder="Type your idea (e.g. Adaptive bus stop displays)..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white font-medium flex items-center gap-1 cursor-pointer hover:bg-neutral-800"
          >
            Pitch <Send className="size-3" />
          </button>
        </form>
      )}
    </div>
  );
}

import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PLAN_FILES = [
  'PRD.md',
  'PROBLEM.md',
  'TECH_STACK.md',
  'PHASES.md',
  'MVP.md',
  'CUT_LIST.md',
  'RISKS.md',
  'DEMO_SCRIPT.md',
  'DECISIONS.md'
];

export function PlanLockedView({ roomId }: { roomId: string }) {
  const [locked, setLocked] = useState(false);
  const navigate = useNavigate();

  // M06 Lock Animation
  // "The nine plan-file rows appear one by one (60 ms stagger, max 8 shown then the ninth with the rest)"
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 max-w-2xl mx-auto w-full">
      <h2 className="text-h2 text-ink mb-2">Review your plan</h2>
      <p className="text-body text-ink-muted mb-8 text-center">
        The following files have been generated and are ready to be saved to your docs vault.
      </p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full bg-surface-raised border border-border rounded-xl p-6 shadow-sm mb-8"
      >
        <div className="grid grid-cols-2 gap-4">
          {PLAN_FILES.map((file, i) => (
            <motion.div
              key={file}
              variants={itemVariants}
              className="flex items-center gap-3 bg-surface p-3 rounded-lg border border-border"
            >
              <div className="flex size-6 items-center justify-center rounded-full bg-success-fill/20 text-success-text">
                {/* Check draws in */}
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
                >
                  <Check className="size-3" strokeWidth={3} />
                </motion.div>
              </div>
              <FileText className="size-4 text-ink-muted" />
              <span className="text-sm font-medium text-ink">{file}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!locked ? (
          <motion.div
            key="lock-button"
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="default"
              size="lg"
              className="w-48 justify-center"
              onClick={() => setLocked(true)}
            >
              Lock plan
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="success-seal"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-3 text-success-text font-bold text-2xl bg-success-fill/10 px-6 py-3 rounded-full border border-success-fill/30">
              <Lock className="size-6" />
              Plan Locked
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/room/${roomId}/docs`)}
              className="flex items-center gap-2"
            >
              Go to Docs Vault <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

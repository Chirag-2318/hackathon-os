import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaveModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmLeave: () => void;
}

export function LeaveModal({ isOpen, onCancel, onConfirmLeave }: LeaveModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop-fallback,#0a0a0b80)] supports-[backdrop-filter]:bg-[var(--backdrop)] backdrop-blur-[3px]"
          style={{
            backdropFilter: 'var(--backdrop-blur, blur(3px))',
            WebkitBackdropFilter: 'var(--backdrop-blur, blur(3px))',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-sm rounded-2xl bg-[#141822] border border-[#2B3245] p-6 text-left shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="leave-title"
          >
            <h3 id="leave-title" className="text-lg font-semibold text-[#F7F4EB]">
              Leave the tour?
            </h3>
            <p className="text-sm text-[#9CA3AF] mt-2 leading-relaxed">
              You can replay the 36-hour flight at any time. Your tour status will be marked as skipped.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#D1D5DB] hover:bg-[#202636] transition-colors cursor-pointer"
              >
                Keep watching
              </button>
              <button
                type="button"
                onClick={onConfirmLeave}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors cursor-pointer shadow-md"
              >
                Leave to Home
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

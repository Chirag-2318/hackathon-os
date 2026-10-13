import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const lastKeyGRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (isEditableElement(activeEl)) return;

      const now = Date.now();

      // Check 'g' chord
      if (e.key === 'g' || e.key === 'G') {
        lastKeyGRef.current = now;
        return;
      }

      // Check chord second keys (window 1s)
      if (lastKeyGRef.current && now - lastKeyGRef.current < 1000) {
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          lastKeyGRef.current = null;
          navigate('/app/home');
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          lastKeyGRef.current = null;
          navigate('/app/rooms');
          return;
        }
      }

      // '?' shortcut (Shift + / or ?)
      if (e.key === '?') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Esc closes
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigate]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-sheet-title"
      onClick={() => setIsOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[14px] bg-[#FAF8F3] p-5 text-zinc-900 border border-[#E8E2D4] shadow-2xl dark:bg-[#1A1916] dark:text-zinc-100 dark:border-zinc-800"
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200/60 dark:border-zinc-800">
          <h3 id="shortcuts-sheet-title" className="font-serif text-[20px] font-normal text-zinc-950 dark:text-zinc-50">
            Keyboard shortcuts
          </h3>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close shortcuts"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Esc
          </button>
        </div>

        <div className="space-y-3 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Quick search</span>
            <kbd className="rounded bg-black/5 px-2 py-0.5 font-mono text-xs dark:bg-white/10">
              Ctrl K
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Keyboard shortcuts</span>
            <kbd className="rounded bg-black/5 px-2 py-0.5 font-mono text-xs dark:bg-white/10">
              ?
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Go to Home</span>
            <div className="flex items-center gap-1 font-mono text-xs">
              <kbd className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">G</kbd>
              <span className="text-zinc-400">then</span>
              <kbd className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">H</kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Go to My rooms</span>
            <div className="flex items-center gap-1 font-mono text-xs">
              <kbd className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">G</kbd>
              <span className="text-zinc-400">then</span>
              <kbd className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">R</kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Close modal / card</span>
            <kbd className="rounded bg-black/5 px-2 py-0.5 font-mono text-xs dark:bg-white/10">
              Esc
            </kbd>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

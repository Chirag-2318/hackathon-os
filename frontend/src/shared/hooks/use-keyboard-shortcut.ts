/**
 * useKeyboardShortcut — global keyboard shortcut hook
 * Used by overlay triggers (Ctrl+K, R, F, B) and other shortcuts.
 */
import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  /** The key to listen for (e.g., 'k', 'r', 'f', 'b', 'Escape') */
  key: string;
  /** Whether Ctrl/Cmd is required */
  ctrlOrMeta?: boolean;
  /** Callback when the shortcut fires */
  handler: () => void;
  /** Disable the shortcut */
  disabled?: boolean;
}

/**
 * Registers a global keyboard shortcut.
 * Skips when focus is inside an input/textarea/contenteditable.
 */
export function useKeyboardShortcut(config: ShortcutConfig): void {
  const { key, ctrlOrMeta = false, handler, disabled = false } = config;

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      // Don't fire shortcuts when typing in inputs (unless ctrlOrMeta)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput && !ctrlOrMeta) return;

      const keyMatch = e.key.toLowerCase() === key.toLowerCase();
      const modMatch = ctrlOrMeta ? e.ctrlKey || e.metaKey : true;
      const noUnwantedMods = ctrlOrMeta
        ? !e.altKey && !e.shiftKey
        : !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;

      if (keyMatch && modMatch && noUnwantedMods) {
        e.preventDefault();
        handler();
      }
    },
    [key, ctrlOrMeta, handler, disabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);
}

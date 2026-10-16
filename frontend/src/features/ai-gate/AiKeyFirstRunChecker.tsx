import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useAiKeyDialogStore } from './use-ai-key-dialog-store';

/**
 * Checks if the first-run AI key dialog should be shown:
 * - Once per user, right after the product tour is finished OR skipped
 *   (also for existing users without a key the first time they open Home after this release)
 * - Hotspot key ai_key_prompt_v1 via POST /users/me/hotspots plus localStorage guard ai_key_prompt_done_<userId>
 * - Never while a tour or the welcome pop-up is open
 * - Not shown when the user already has a key
 */
export function AiKeyFirstRunChecker() {
  const { data: user } = useCurrentUser();
  const location = useLocation();
  const openDialog = useAiKeyDialogStore((s) => s.openDialog);
  const isOpen = useAiKeyDialogStore((s) => s.isOpen);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (isOpen || hasTriggeredRef.current) return;
    if (!user || !user.id) return;

    // Not shown when the user already has a key
    if (user.aiKey?.hasKey) return;

    // Never while a tour is active or welcome pop-up is open
    if (typeof window !== 'undefined' && sessionStorage.getItem('tour_active') === '1') {
      return;
    }
    // If tour is NOT_STARTED, the welcome pop-up or tour is active/waiting on home
    if (user.tourStatus === 'NOT_STARTED') {
      return;
    }

    // Check hotspot seen
    if (user.hotspotsSeen?.includes('ai_key_prompt_v1')) {
      return;
    }

    // Check localStorage guard
    if (typeof window !== 'undefined') {
      const guardKey = `ai_key_prompt_done_${user.id}`;
      if (localStorage.getItem(guardKey)) {
        return;
      }
    }

    // Only prompt on /app/home
    if (location.pathname !== '/app/home') {
      return;
    }

    // Delay slightly to let page settle after tour finishes or home renders
    const timer = setTimeout(() => {
      // Re-verify guards
      if (sessionStorage.getItem('tour_active') === '1') return;
      hasTriggeredRef.current = true;
      openDialog('first-run');
    }, 750);

    return () => clearTimeout(timer);
  }, [user, location.pathname, isOpen, openDialog]);

  return null;
}

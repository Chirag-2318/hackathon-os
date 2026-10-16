import { useQuery } from '@tanstack/react-query';
import { authApi } from './api';
import { useAuthStore } from './useAuthStore';
import { useEffect } from 'react';

import { useMotionModeStore } from '@/shared/motion/use-motion-mode';
import { useSidebarStore } from '@/app/layout/use-sidebar-store';
import { useTimePreferencesStore } from '@/shared/lib/clock';

export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
      const pref = query.data.preferences;
      if (pref) {
        if (pref.textSize) {
          document.documentElement.setAttribute('data-text-size', pref.textSize);
          try { localStorage.setItem('text_size', pref.textSize); } catch {}
        }
        if (pref.motion && (pref.motion === 'system' || pref.motion === 'on' || pref.motion === 'off')) {
          useMotionModeStore.getState().setPreference(pref.motion as any);
        }
        if (pref.sidebarDefault && (pref.sidebarDefault === 'expanded' || pref.sidebarDefault === 'collapsed')) {
          useSidebarStore.getState().setSidebarDefault(pref.sidebarDefault as any);
        }
        if (pref.timeFormat) {
          useTimePreferencesStore.getState().setPreferences(
            pref.timeFormat as any,
            pref.timezone ?? null
          );
        }
      }
    }
    if (query.isError) setUser(null);
  }, [query.data, query.isError, setUser]);

  return query;
}

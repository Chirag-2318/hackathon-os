import { useEffect } from 'react';
import { BRAND_NAME } from '@/shared/constants/copy';

/**
 * Syncs the document title with the unread notifications count:
 * e.g. "(3) [brackit]" when unread > 0, otherwise "[brackit]".
 */
export function useSyncTabTitleUnread(unreadCount: number) {
  useEffect(() => {
    const baseTitle = BRAND_NAME;
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [unreadCount]);
}

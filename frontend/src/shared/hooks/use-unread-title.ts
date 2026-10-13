import { useEffect } from 'react';

/**
 * Syncs the document title with the unread notifications count:
 * e.g. "(3) Hackathon OS" when unread > 0, otherwise "Hackathon OS".
 */
export function useSyncTabTitleUnread(unreadCount: number) {
  useEffect(() => {
    const baseTitle = 'Hackathon OS';
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [unreadCount]);
}

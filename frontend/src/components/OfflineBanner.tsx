import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { toast } from '@/design';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('You’re back online. Reconnected to live server.', { duration: 3000 });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-medium shadow-xs transition-all animate-in slide-in-from-top"
    >
      <WifiOff className="size-3.5 shrink-0" />
      <span>You're offline. Showing last saved data.</span>
    </div>
  );
}

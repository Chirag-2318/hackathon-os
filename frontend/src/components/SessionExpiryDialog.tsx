import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, AlertCircle } from 'lucide-react';

export function SessionExpiryDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      setIsOpen(true);
    };

    window.addEventListener('auth:session-expired', handleExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleExpired);
    };
  }, []);

  const handleReLogin = () => {
    window.location.href = '/login';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <AlertCircle className="size-6" />
          </div>
          <DialogTitle className="text-lg font-bold">Session Expired</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Your authenticated session has expired. You can review and copy any unsaved drafts before re-authenticating.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex sm:justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            Review Current Page
          </Button>
          <Button size="sm" onClick={handleReLogin} className="gap-2">
            <LogIn className="size-4" />
            <span>Sign In Again</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

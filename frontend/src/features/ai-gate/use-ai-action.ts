import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { useAiKeyDialogStore } from './use-ai-key-dialog-store';

export function useAiAction(roomOrOptions?: { aiAllowed?: boolean } | boolean) {
  const user = useAuthStore((s) => s.user);
  const openDialog = useAiKeyDialogStore((s) => s.openDialog);
  const navigate = useNavigate();

  const aiAllowed =
    typeof roomOrOptions === 'boolean'
      ? roomOrOptions
      : (roomOrOptions?.aiAllowed ?? true);

  const hasKey = Boolean(user?.aiKey?.hasKey);
  const isAvailable = hasKey && aiAllowed;

  const handleAiError = useCallback(
    (err: any) => {
      const code = err?.code;
      const message = err?.message;

      if (code === 'AI_KEY_MISSING') {
        openDialog('needed', "You haven't added your API key yet.");
        toast.error("You haven't added your API key yet.");
      } else if (code === 'AI_KEY_INVALID') {
        toast.error('Groq rejected your API key. Check it in Settings.', {
          action: {
            label: 'Open settings',
            onClick: () => navigate('/app/settings/ai'),
          },
        });
      } else if (code === 'AI_KEY_RATE_LIMITED') {
        const retryAfter = err?.details?.retryAfterSeconds;
        const mins = retryAfter ? Math.max(1, Math.ceil(retryAfter / 60)) : 1;
        toast.error(
          `You've reached your Groq limit. Try again in ${mins} minute${mins > 1 ? 's' : ''}.`
        );
      } else if (code === 'AI_RESTRICTED_BY_EVENT') {
        toast.error(message || "AI use is restricted by this room's event brief policy.");
      } else if (code === 'AI_UNAVAILABLE') {
        toast.error(message || "Couldn't reach Groq to process AI request. Try again.");
      } else {
        toast.error(message || 'AI operation failed');
      }
    },
    [openDialog, navigate]
  );

  const guard = useCallback(
    <T,>(action: () => T | Promise<T>): (() => void) => {
      return () => {
        if (!aiAllowed) {
          toast.error("AI use is restricted by this room's event brief policy.");
          return;
        }
        if (!hasKey) {
          openDialog('needed', "You haven't added your API key yet.");
          return;
        }
        try {
          const res = action();
          if (res instanceof Promise) {
            res.catch(handleAiError);
          }
        } catch (err) {
          handleAiError(err);
        }
      };
    },
    [aiAllowed, hasKey, openDialog, handleAiError]
  );

  return {
    hasKey,
    aiAllowed,
    isAvailable,
    guard,
    handleAiError,
    tooltip: !aiAllowed
      ? 'AI is restricted by this room policy'
      : !hasKey
      ? 'Add your Groq API key to use this'
      : undefined,
  };
}


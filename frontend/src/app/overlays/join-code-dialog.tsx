import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useOverlay } from '@/app/providers/overlay-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeyRound, Loader2, Check } from 'lucide-react';

import { apiClient } from '@/lib/apiClient';

async function submitJoinCode(code: string): Promise<{ success: boolean; roomId?: string; error?: string }> {
  const data = await apiClient<{ roomId: string }>('/api/v1/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return { success: true, roomId: data.roomId };
}

export function JoinCodeDialogOverlay() {
  const { isOpen, close } = useOverlay('join-code-dialog');
  const navigate = useNavigate();

  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '']);
      setError(null);
      setSuccess(false);
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  }, [isOpen]);

  const joinMutation = useMutation({
    mutationFn: submitJoinCode,
    onSuccess: (result) => {
      if (result.success && result.roomId) {
        setSuccess(true);
        setTimeout(() => {
          close();
          navigate(`/app/room/${result.roomId}/overview`);
        }, 800);
      } else {
        setError(result.error ?? 'Invalid room code');
      }
    },
    onError: (err: any) => {
      setError(err?.message ?? 'Invalid room code. Please check and try again.');
    },
  });

  const handleChange = (index: number, value: string) => {
    const char = value.slice(-1).toUpperCase();
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError(null);

    // Auto-advance
    if (char && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit if all 4 are filled
    if (char && index === 3 && next.every((d) => d.length === 1)) {
      joinMutation.mutate(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!pasted) return;

    const newDigits = ['', '', '', ''];
    for (let i = 0; i < 4; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    setError(null);

    const nextIndex = Math.min(pasted.length, 3);
    inputsRef.current[nextIndex]?.focus();

    if (pasted.length >= 4) {
      joinMutation.mutate(newDigits.join(''));
    }
  };

  const codeString = digits.join('');

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { if (!openState) close(); }}>
      <DialogContent className="sm:max-w-[400px] rounded-[var(--r-card)] bg-surface border border-border p-6 text-center">
        <DialogHeader className="flex flex-col items-center mb-4">
          <div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <KeyRound className="size-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-ink">Join with code</DialogTitle>
          <DialogDescription className="text-sm text-ink-2">
            Enter the 4-character room access code shared by your team leader.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-2">
          {/* 4-box code input */}
          <div className="flex items-center justify-center gap-3" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={joinMutation.isPending || success}
                className={`size-14 text-center text-2xl font-bold uppercase rounded-[var(--r-control)] border-2 bg-card text-ink transition-all outline-none ${
                  error
                    ? 'border-danger focus:border-danger ring-danger/20'
                    : success
                    ? 'border-success-fg bg-success-bg/20'
                    : 'border-border focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                }`}
                aria-label={`Code digit ${i + 1}`}
              />
            ))}
          </div>

          {error && <p className="text-xs text-danger font-medium">{error}</p>}
          {success && (
            <p className="text-xs text-success-fg font-medium flex items-center gap-1">
              <Check className="size-3.5" /> Room found! Entering room…
            </p>
          )}

          <div className="flex w-full items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={close} disabled={joinMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => joinMutation.mutate(codeString)}
              disabled={joinMutation.isPending || codeString.length < 4 || success}
              className="bg-ink text-white hover:bg-ink/90 font-medium"
            >
              {joinMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Joining…
                </>
              ) : (
                'Join Room'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

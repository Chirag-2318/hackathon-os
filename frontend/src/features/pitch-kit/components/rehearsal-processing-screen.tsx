import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RehearsalProcessingScreenProps {
  mode: 'TIMED' | 'VOICE';
  totalBeats: number;
  uploadedCount: number;
  onSkip: () => void;
}

export function RehearsalProcessingScreen({
  mode,
  totalBeats,
  uploadedCount,
  onSkip,
}: RehearsalProcessingScreenProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev >= 20) {
          clearInterval(timer);
          onSkip();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onSkip]);

  const isTranscribing = mode === 'VOICE' && uploadedCount < totalBeats;
  const statusLine = isTranscribing
    ? `Transcribing ${Math.min(totalBeats, uploadedCount + 1)} of ${totalBeats}`
    : 'Working out your numbers';

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#070708] text-[#F4F1EA] flex flex-col items-center justify-center p-6 select-none font-sans space-y-6">
      <Loader2 className="w-12 h-12 animate-spin text-[#F4F1EA]/80" />

      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl text-[#F4F1EA]">{statusLine}</h2>
        <p className="font-mono text-xs text-white/50">
          Computing WPM, filler word density and script coverage... ({20 - seconds}s)
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onSkip}
        className="border-white/20 text-white hover:bg-white/10 font-mono text-xs"
      >
        Skip to result <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
      </Button>
    </div>,
    document.body
  );
}

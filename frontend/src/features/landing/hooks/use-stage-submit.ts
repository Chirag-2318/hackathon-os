import { useCallback, useEffect, useState } from 'react';
import { LAUNCH } from '../data/stage-act';
import { formatClock, parseClock } from '../lib/clock';
import { HUD_ORDER, useHudSource } from './use-hud';

// Whether the room has been "submitted" (the stamp landed). The nav clock pill freezes on the launch time, then reads SUBMITTED.
export function useStageSubmit() {
  const [submitted, setSubmitted] = useState(false);
  const reportSubmitted = useHudSource(HUD_ORDER.submitted);

  useEffect(() => {
    if (!submitted) {
      reportSubmitted(null);
      return;
    }
    reportSubmitted({ text: formatClock(parseClock(LAUNCH.time)), tone: 'done' });
    const id = window.setTimeout(() => reportSubmitted({ text: LAUNCH.stamp, tone: 'done' }), 1600);
    return () => window.clearTimeout(id);
  }, [submitted, reportSubmitted]);

  const submit = useCallback(() => setSubmitted(true), []);
  const reset = useCallback(() => setSubmitted(false), []);
  return { submitted, submit, reset };
}

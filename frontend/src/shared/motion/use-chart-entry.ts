import { useState, useEffect } from 'react';
import { useIsMotionReduced } from './use-motion-mode';

export function useChartEntry(chartId: string) {
  const isReduced = useIsMotionReduced();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isReduced) return;
    const sessionKey = `chart_seen_${chartId}`;
    if (!sessionStorage.getItem(sessionKey)) {
      setShouldAnimate(true);
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [chartId, isReduced]);

  const onAnimationComplete = () => {
    setShouldAnimate(false);
  };

  return { shouldAnimate, onAnimationComplete };
}

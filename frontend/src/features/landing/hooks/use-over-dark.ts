import { useEffect, useState } from 'react';

const NAV_Y = 44; // the vertical middle of the floating nav

export function useOverDark(ids: string[]): boolean {
  const [over, setOver] = useState(false);
  const key = ids.join('|');

  useEffect(() => {
    let frame = 0;

    const update = () => {
      let next = false;
      for (const id of key.split('|')) {
        const element = document.getElementById(id);
        if (!element) continue;
        const box = element.getBoundingClientRect();
        if (box.top <= NAV_Y && box.bottom > NAV_Y) {
          next = true;
          break;
        }
      }
      setOver(next);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [key]);

  return over;
}

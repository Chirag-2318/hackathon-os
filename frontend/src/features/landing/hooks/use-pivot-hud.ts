import { useEffect, useRef } from 'react';
import { HUD_ORDER, useHudSource } from './use-hud';
import type { HudTone } from './use-hud';
import { formatClock } from '../lib/clock';

function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function usePivotHud() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const clockRef = useRef<HTMLSpanElement | null>(null);
  const cueRef = useRef<HTMLParagraphElement | null>(null);
  const report = useHudSource(HUD_ORDER.pivot);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) {
      if (clockRef.current) clockRef.current.textContent = formatClock(36 * 3600);
      section.dataset.tone = 'ink';
      section.style.setProperty('--l-pv-h', '1');
      section.style.setProperty('--l-pv-b', '1');
      section.style.setProperty('--l-pv-s', '1');
      if (cueRef.current) cueRef.current.style.display = 'none';

      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          report({ text: formatClock(36 * 3600), tone: 'running' });
        } else {
          report(null);
        }
      });
      io.observe(section);
      return () => {
        io.disconnect();
        report(null);
      };
    }

    let frame = 0;
    let prevText = '';
    let prevH = -1;
    let prevB = -1;
    let prevS = -1;
    let prevTone = '';
    let prevP = 0;
    let pulseCount = 0;

    // HUD throttle state
    let lastReportTime = 0;
    let reportTimer: number | null = null;
    let pendingReport: { seconds: number; tone: HudTone; pulseKey?: number } | null = null;

    const flushHud = () => {
      if (!pendingReport) return;
      const { seconds, tone, pulseKey } = pendingReport;
      report({ text: formatClock(seconds), tone, pulseKey });
      lastReportTime = Date.now();
      pendingReport = null;
      if (reportTimer !== null) {
        window.clearTimeout(reportTimer);
        reportTimer = null;
      }
    };

    const sendHud = (seconds: number, tone: HudTone, pulseKey?: number) => {
      pendingReport = { seconds, tone, pulseKey };
      const now = Date.now();
      if (now - lastReportTime >= 80) {
        flushHud();
      } else if (reportTimer === null) {
        reportTimer = window.setTimeout(flushHud, 80 - (now - lastReportTime));
      }
    };

    const update = () => {
      const node = sectionRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight);
      const p = clamp(-rect.top / total, 0, 1);

      // 1. Clock rewind
      let seconds = 0;
      if (p < 0.12) {
        seconds = 0;
      } else if (p >= 0.72) {
        seconds = 36 * 3600;
      } else {
        const t = (p - 0.12) / 0.60;
        seconds = Math.round(36 * 3600 * easeInOutCubic(t));
      }

      const clockText = formatClock(seconds);
      if (clockRef.current && clockText !== prevText) {
        clockRef.current.textContent = clockText;
        prevText = clockText;
      }

      // 2. Tone
      const tone = p < 0.30 ? 'red' : 'ink';
      if (tone !== prevTone) {
        node.dataset.tone = tone;
        prevTone = tone;
      }

      // 3. Heading fade and rise (--l-pv-h)
      let h = 0;
      if (p >= 0.60) h = 1;
      else if (p > 0.30) h = (p - 0.30) / 0.30;
      if (Math.abs(h - prevH) > 0.002) {
        node.style.setProperty('--l-pv-h', h.toFixed(3));
        prevH = h;
      }

      // 4. Brackets slide in (--l-pv-b)
      let b = 0;
      if (p >= 0.85) b = 1;
      else if (p > 0.50) b = easeInOutCubic((p - 0.50) / 0.35);
      if (Math.abs(b - prevB) > 0.002) {
        node.style.setProperty('--l-pv-b', b.toFixed(3));
        prevB = b;
      }

      // 5. Violet pulse crossing 0.85
      if (prevP < 0.85 && p >= 0.85) {
        pulseCount += 1;
      }
      prevP = p;

      // 6. Sub line fade (--l-pv-s)
      let s = 0;
      if (p >= 0.97) s = 1;
      else if (p > 0.85) s = clamp((p - 0.85) / 0.12, 0, 1);
      if (Math.abs(s - prevS) > 0.002) {
        node.style.setProperty('--l-pv-s', s.toFixed(3));
        prevS = s;
      }

      // 7. Scroll cue opacity
      if (cueRef.current) {
        const cueOpacity = clamp(1 - p / 0.1, 0, 1);
        cueRef.current.style.opacity = cueOpacity.toFixed(2);
      }

      // 8. HUD report
      if (rect.top <= window.innerHeight && rect.bottom >= 0) {
        const hudTone: HudTone = p < 0.30 ? 'urgent' : (pulseCount > 0 ? 'brand' : 'running');
        sendHud(seconds, hudTone, pulseCount > 0 ? pulseCount : undefined);
      } else if (rect.top > window.innerHeight) {
        if (reportTimer !== null) {
          window.clearTimeout(reportTimer);
          reportTimer = null;
        }
        pendingReport = null;
        report(null);
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    // Trigger update once initially
    update();

    const onScroll = () => schedule();
    const onResize = () => schedule();

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener('scroll', onScroll, { passive: true });
          window.addEventListener('resize', onResize);
          schedule();
        } else {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onResize);
          if (frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
          }
          flushHud();
          const node = sectionRef.current;
          if (node && node.getBoundingClientRect().top > window.innerHeight) {
            report(null);
          }
        }
      },
      { rootMargin: '100% 0px' }
    );

    io.observe(section);

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (frame) window.cancelAnimationFrame(frame);
      if (reportTimer !== null) window.clearTimeout(reportTimer);
      report(null);
    };
  }, [report]);

  return { sectionRef, clockRef, cueRef };
}

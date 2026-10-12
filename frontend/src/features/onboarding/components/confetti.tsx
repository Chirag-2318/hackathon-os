import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export function ConfettiCanvas({ durationMs = 1200 }: { durationMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    const start = performance.now();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Small, restrained set of 38 confetti particles
    const colors = ['#6D5EF5', '#9B8CFF', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];
    const particles = Array.from({ length: 38 }).map(() => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 160,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 8,
      vy: -Math.random() * 7 - 3,
      size: Math.random() * 4 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.15,
      opacity: 1,
    }));

    const render = (now: number) => {
      const elapsed = now - start;
      if (elapsed > durationMs) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const progress = elapsed / durationMs;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.rotation += p.vRot;
        p.opacity = Math.max(0, 1 - progress);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animFrame);
  }, [durationMs, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}

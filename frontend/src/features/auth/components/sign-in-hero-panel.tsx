import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SignInFallbackScene } from './sign-in-fallback-scene';

export interface FrameManifestItem {
  id: string;
  caption: string;
  figure?: string;
  alt: string;
  dominant?: string;
  focalX?: number;
  focalY?: number;
  sources?: {
    avif?: Record<string, string>;
    webp?: Record<string, string>;
    jpg?: Record<string, string>;
  };
}

const DEFAULT_FRAMES: FrameManifestItem[] = [
  {
    id: 'signin-01-first-light',
    caption: 'First light',
    figure: 'FIG. 01',
    alt: 'Two tall black stone brackets facing each other in a quiet hall, with warm light spilling through the gap between them.',
    dominant: '#564639',
    focalX: 50,
    focalY: 20,
    sources: {
      avif: {
        '960': '/signin/signin-01-first-light-960.avif',
        '1440': '/signin/signin-01-first-light-1440.avif',
        '2000': '/signin/signin-01-first-light-2000.avif',
      },
      webp: {
        '960': '/signin/signin-01-first-light-960.webp',
        '1440': '/signin/signin-01-first-light-1440.webp',
        '2000': '/signin/signin-01-first-light-2000.webp',
      },
      jpg: {
        '960': '/signin/signin-01-first-light-960.jpg',
        '1440': '/signin/signin-01-first-light-1440.jpg',
        '2000': '/signin/signin-01-first-light-2000.jpg',
      },
    },
  },
  {
    id: 'signin-02-long-middle',
    caption: 'The long middle',
    figure: 'FIG. 02',
    alt: 'Two monumental stone brackets under midnight ambient illumination, solitary and steadfast with deep blue-violet shadows.',
    dominant: '#080708',
    focalX: 50,
    focalY: 20,
    sources: {
      avif: {
        '960': '/signin/signin-02-long-middle-960.avif',
        '1440': '/signin/signin-02-long-middle-1440.avif',
        '2000': '/signin/signin-02-long-middle-2000.avif',
      },
      webp: {
        '960': '/signin/signin-02-long-middle-960.webp',
        '1440': '/signin/signin-02-long-middle-1440.webp',
        '2000': '/signin/signin-02-long-middle-2000.webp',
      },
      jpg: {
        '960': '/signin/signin-02-long-middle-960.jpg',
        '1440': '/signin/signin-02-long-middle-1440.jpg',
        '2000': '/signin/signin-02-long-middle-2000.jpg',
      },
    },
  },
  {
    id: 'signin-03-last-hour',
    caption: 'The last hour',
    figure: 'FIG. 03',
    alt: 'Two dramatic monolithic brackets silhouetted against an intense golden-hour sunset, rays piercing through the central opening.',
    dominant: '#271A13',
    focalX: 50,
    focalY: 20,
    sources: {
      avif: {
        '960': '/signin/signin-03-last-hour-960.avif',
        '1440': '/signin/signin-03-last-hour-1440.avif',
        '2000': '/signin/signin-03-last-hour-2000.avif',
      },
      webp: {
        '960': '/signin/signin-03-last-hour-960.webp',
        '1440': '/signin/signin-03-last-hour-1440.webp',
        '2000': '/signin/signin-03-last-hour-2000.webp',
      },
      jpg: {
        '960': '/signin/signin-03-last-hour-960.jpg',
        '1440': '/signin/signin-03-last-hour-1440.jpg',
        '2000': '/signin/signin-03-last-hour-2000.jpg',
      },
    },
  },
];

function getHourFrameIndex(): number {
  const hour = new Date().getHours();
  // 05:00 to 16:59 -> Frame 1 (index 0)
  // 17:00 to 20:59 -> Frame 3 (index 2)
  // 21:00 to 04:59 -> Frame 2 (index 1)
  if (hour >= 5 && hour < 17) return 0;
  if (hour >= 17 && hour < 21) return 2;
  return 1;
}

function buildSrcSet(sources?: Record<string, string>): string {
  if (!sources) return '';
  return Object.entries(sources)
    .map(([w, url]) => `${url} ${w}w`)
    .join(', ');
}

export function SignInHeroPanel() {
  const [frames, setFrames] = useState<FrameManifestItem[]>(DEFAULT_FRAMES);
  const [activeIdx, setActiveIdx] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('signin_frame');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 2) return parsed;
      }
    } catch {}
    return getHourFrameIndex();
  });

  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  // Parallax offsets
  const [parallax, setParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const rAFRef = useRef<number | null>(null);

  // Load manifest asynchronously with fallback to DEFAULT_FRAMES
  useEffect(() => {
    fetch('/signin/manifest.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFrames(data);
        }
      })
      .catch(() => {
        // Keeps DEFAULT_FRAMES on error
      });
  }, []);

  const currentFrame = frames[activeIdx] || frames[0] || DEFAULT_FRAMES[0];

  const handleSelectFrame = (idx: number) => {
    if (idx === activeIdx) return;
    setImageLoaded(false);
    setImageFailed(false);
    setActiveIdx(idx);
    try {
      sessionStorage.setItem('signin_frame', String(idx));
    } catch {}
  };

  // Pointer parallax (desktop fine pointer only)
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    rAFRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setParallax({
        x: Math.max(-1, Math.min(1, normX)),
        y: Math.max(-1, Math.min(1, normY)),
      });
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setParallax({ x: 0, y: 0 });
  }, []);

  const sources = currentFrame.sources;
  const avifSrcSet = useMemo(() => buildSrcSet(sources?.avif), [sources?.avif]);
  const webpSrcSet = useMemo(() => buildSrcSet(sources?.webp), [sources?.webp]);
  const jpgSrcSet = useMemo(() => buildSrcSet(sources?.jpg), [sources?.jpg]);
  const fallbackSrc = sources?.jpg?.['1440'] || sources?.jpg?.['960'] || '/signin/signin-01-first-light.png';

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="signin-hero-entrance relative w-full h-[30dvh] md:h-[calc(100dvh-32px)] rounded-[20px] md:rounded-[24px] overflow-hidden select-none shrink-0"
      style={{
        backgroundColor: currentFrame.dominant || '#0C0B0A',
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
      }}
      data-slot="hero-panel"
    >
      {/* 1. Underlying Fallback Monolith Scene (always ready & bulletproof) */}
      <SignInFallbackScene />

      {/* 2. Real High-Res Picture (Fades in over 600ms on load) */}
      {!imageFailed && (
        <picture
          className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-[600ms] ease-out"
          style={{
            opacity: imageLoaded ? 1 : 0,
            transform: `translate3d(${-parallax.x * 6}px, ${-parallax.y * 6}px, 0) scale(1.03)`,
            transition: 'transform 120ms ease-out, opacity 600ms ease-out',
          }}
        >
          {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes="(max-width: 768px) 100vw, 56vw" />}
          {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes="(max-width: 768px) 100vw, 56vw" />}
          {jpgSrcSet && <source type="image/jpeg" srcSet={jpgSrcSet} sizes="(max-width: 768px) 100vw, 56vw" />}
          <img
            src={fallbackSrc}
            alt={currentFrame.alt}
            fetchPriority={activeIdx === 0 ? 'high' : 'auto'}
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover"
            style={{
              objectPosition: `${currentFrame.focalX ?? 50}% ${currentFrame.focalY ?? 20}%`,
            }}
          />
        </picture>
      )}

      {/* 3. Breathing Warm Amber Glow at (50% x, 55% y) with parallax */}
      <div
        className="signin-breathing-glow"
        style={{
          transform: `translate(calc(-50% + ${-parallax.x * 10}px), calc(-50% + ${-parallax.y * 10}px))`,
          transition: 'transform 160ms ease-out',
        }}
        aria-hidden="true"
      />

      {/* 4. Fine Grain Layer (5% Overlay) */}
      <div className="signin-hero-grain" aria-hidden="true" />

      {/* 5. Vignette (Edge Falloff) */}
      <div className="signin-hero-vignette" aria-hidden="true" />

      {/* 6. Caption Shade Gradient (120px height) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[120px] pointer-events-none z-[8]"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* 7. Bottom Left Caption */}
      <div
        className="absolute bottom-4 left-4 md:bottom-7 md:left-7 z-[9] flex flex-col gap-0.5 text-left pointer-events-none transition-opacity duration-500 ease-out"
        key={currentFrame.id}
      >
        <span
          className="font-mono text-[11px] tracking-[0.08em] uppercase text-[#F4F1EA]/70"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
        >
          {currentFrame.figure || `FIG. 0${activeIdx + 1}`}
        </span>
        <span
          className="italic text-[20px] md:text-[22px] leading-tight text-[#F4F1EA]"
          style={{
            fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)',
            textShadow: '0 1px 3px rgba(0,0,0,0.7)',
          }}
        >
          {currentFrame.caption}
        </span>
      </div>

      {/* 8. Bottom Right Frame Switcher Ticks (hidden on mobile) */}
      <div
        className="hidden md:flex absolute bottom-5 right-7 z-[10] items-center gap-2"
        role="group"
        aria-label="Hero panel frames"
      >
        {frames.slice(0, 3).map((f, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={f.id || i}
              type="button"
              onClick={() => handleSelectFrame(i)}
              className="group relative flex items-center justify-center w-11 h-11 cursor-pointer focus:outline-none"
              aria-label={`Show frame ${i + 1}, ${f.caption}`}
              aria-pressed={isActive}
            >
              {/* 16px by 1px tick */}
              <span
                className="w-4 h-[1px] bg-[#ECE9E2] transition-opacity duration-200 ease-out"
                style={{
                  opacity: isActive ? 1 : 0.3,
                }}
              />
              {/* Keyboard focus indicator */}
              <span className="sr-only">{`Show frame ${i + 1}, ${f.caption}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

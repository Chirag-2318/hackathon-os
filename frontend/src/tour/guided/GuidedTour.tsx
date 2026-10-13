import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReducedMotion, AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useHome } from '@/features/home/hooks/use-home';
import { persistTourStatus, CURRENT_TOUR_VERSION } from '../api';
import type { TourPath } from '../types';
import { GUIDED_STOPS } from './guided-stops';
import { GuidedOverlay } from './GuidedOverlay';
import { GuidedCard } from './GuidedCard';
import { FinaleCard } from './FinaleCard';
import { TourWelcomeModal } from './TourWelcomeModal';
import { LeaveModal } from '../components/LeaveModal';
import { useCardPlacement } from './use-card-placement';

const TOUR_ACTIVE_KEY = 'tour_active';
const TOUR_STEP_KEY = 'tour_current_step';
const TOUR_PATH_KEY = 'tour_path';

function getTourDoneGuard(userId?: string): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.search.includes('reset-tour')) {
    if (userId) localStorage.removeItem(`tour_done_${userId}`);
    localStorage.removeItem('tour_done_general');
    return false;
  }
  if (userId) {
    return localStorage.getItem(`tour_done_${userId}`) === '1';
  }
  return localStorage.getItem('tour_done_general') === '1';
}

function setTourDoneGuard(userId?: string) {
  if (typeof window === 'undefined') return;
  if (userId) {
    localStorage.setItem(`tour_done_${userId}`, '1');
  } else {
    localStorage.setItem('tour_done_general', '1');
  }
}

export function GuidedTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: homeData, isLoading: homeLoading } = useHome();
  const prefersReduced = useReducedMotion();
  const isReducedMotion = Boolean(prefersReduced);

  // Tour active state in sessionStorage
  const [isActive, setIsActive] = useState(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem(TOUR_ACTIVE_KEY) === '1';
  });

  const [tourPath, setTourPath] = useState<TourPath>(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(TOUR_PATH_KEY) : null;
    return (saved as TourPath) || (user?.tourPath as TourPath) || 'LEADER';
  });

  const [stopIndex, setStopIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(TOUR_STEP_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < GUIDED_STOPS.length) {
          return parsed;
        }
      }
    }
    return 0;
  });

  const [showWelcome, setShowWelcome] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showFinale, setShowFinale] = useState(false);
  const [lightSweep, setLightSweep] = useState(false);

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const currentStop = GUIDED_STOPS[stopIndex] || GUIDED_STOPS[0];

  // Deterministic card placement & canvas scaling hook
  const placement = useCardPlacement({
    targetRect: showFinale ? null : targetRect,
    isSeatChoice: Boolean(currentStop.isSeatChoice),
    targetKey: currentStop.target,
  });

  // Background sync: If client has tour_done guard but server still says NOT_STARTED, re-persist
  useEffect(() => {
    if (getTourDoneGuard(user?.id) && user?.tourStatus === 'NOT_STARTED') {
      persistTourStatus('COMPLETED', tourPath, CURRENT_TOUR_VERSION).then((res) => {
        if (res) {
          queryClient.setQueryData(['currentUser'], res);
        }
      });
    }
  }, [user?.id, user?.tourStatus, tourPath, queryClient]);

  // 1. Welcome pop-up trigger: on /app/home, tourStatus NOT_STARTED, no active tour session, guard absent
  useEffect(() => {
    if (isActive || showFinale) return;
    if (location.pathname !== '/app/home') return;
    if (user?.tourStatus !== 'NOT_STARTED') return;
    if (getTourDoneGuard(user?.id)) return;
    if (homeLoading || !homeData) return;

    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [location.pathname, user?.id, user?.tourStatus, homeLoading, homeData, isActive, showFinale]);

  // Persist current step
  useEffect(() => {
    if (isActive) {
      sessionStorage.setItem(TOUR_STEP_KEY, String(stopIndex));
      sessionStorage.setItem(TOUR_PATH_KEY, tourPath);
    }
  }, [isActive, stopIndex, tourPath]);

  // Start tour from Welcome Pop-up
  const handleTakeTour = useCallback(() => {
    sessionStorage.setItem(TOUR_ACTIVE_KEY, '1');
    sessionStorage.setItem(TOUR_STEP_KEY, '0');
    sessionStorage.setItem(TOUR_PATH_KEY, tourPath);
    setShowWelcome(false);
    setIsActive(true);
    setStopIndex(0);
    setShowFinale(false);
  }, [tourPath]);

  // Skip tour: await POST /users/me/tour with retries, update query cache, write local guard, then navigate
  const handleSkipTour = useCallback(async () => {
    setShowWelcome(false);
    setShowLeaveConfirm(false);
    setIsActive(false);
    sessionStorage.removeItem(TOUR_ACTIVE_KEY);
    sessionStorage.removeItem(TOUR_STEP_KEY);
    sessionStorage.removeItem(TOUR_PATH_KEY);
    setTourDoneGuard(user?.id);

    // Update query cache immediately so UI reflects SKIPPED without waiting for refetch
    queryClient.setQueryData(['currentUser'], (prev: any) => {
      if (!prev) return prev;
      return { ...prev, tourStatus: 'SKIPPED' };
    });

    // Await server persistence with up to 3 retries
    const updated = await persistTourStatus('SKIPPED', tourPath, CURRENT_TOUR_VERSION);
    if (updated) {
      queryClient.setQueryData(['currentUser'], updated);
    }

    navigate('/app/home', { replace: true });
  }, [tourPath, user?.id, queryClient, navigate]);

  // Complete tour (Finale): await POST /users/me/tour with retries, update cache, write local guard, then navigate
  const handleFinishTour = useCallback(async () => {
    setShowFinale(false);
    setIsActive(false);
    sessionStorage.removeItem(TOUR_ACTIVE_KEY);
    sessionStorage.removeItem(TOUR_STEP_KEY);
    sessionStorage.removeItem(TOUR_PATH_KEY);
    setTourDoneGuard(user?.id);

    // Update query cache immediately
    queryClient.setQueryData(['currentUser'], (prev: any) => {
      if (!prev) return prev;
      return { ...prev, tourStatus: 'COMPLETED' };
    });

    // 300ms cream light sweep
    setLightSweep(true);

    // Await server persistence with up to 3 retries
    const updated = await persistTourStatus('COMPLETED', tourPath, CURRENT_TOUR_VERSION);
    if (updated) {
      queryClient.setQueryData(['currentUser'], updated);
    }

    setTimeout(() => {
      setLightSweep(false);
      navigate('/app/home', { replace: true });
    }, 300);
  }, [tourPath, user?.id, queryClient, navigate]);

  // Navigate to stop's route when stop changes
  useEffect(() => {
    if (!isActive || showFinale) return;
    if (currentStop.route && location.pathname !== currentStop.route) {
      navigate(currentStop.route);
    }
  }, [isActive, showFinale, currentStop.route, location.pathname, navigate]);

  // Find target element and measure bounding rect
  const updateTargetRect = useCallback(() => {
    if (!isActive || showFinale || !currentStop.target) {
      setTargetRect(null);
      return;
    }

    let el: HTMLElement | null = null;
    if (currentStop.target) {
      el = document.querySelector<HTMLElement>(`[data-tour="${currentStop.target}"]`);
    }
    if (!el && currentStop.fallbackTarget) {
      el = document.querySelector<HTMLElement>(`[data-tour="${currentStop.fallbackTarget}"]`);
    }

    if (!el) {
      setTargetRect(null);
      return;
    }

    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) {
      setTargetRect(null);
      return;
    }

    // 8px padding
    const padding = 8;
    const domRect = new DOMRect(
      r.left - padding,
      r.top - padding,
      r.width + padding * 2,
      r.height + padding * 2
    );
    setTargetRect(domRect);
  }, [isActive, showFinale, currentStop.target, currentStop.fallbackTarget]);

  // Poll for target existence after stop/route change
  useEffect(() => {
    if (!isActive || showFinale) {
      setTargetRect(null);
      return;
    }

    updateTargetRect();

    const t1 = setTimeout(updateTargetRect, 200);
    const t2 = setTimeout(updateTargetRect, 500);
    const t3 = setTimeout(updateTargetRect, 1000);
    const t4 = setTimeout(updateTargetRect, 1500);

    const onScroll = () => updateTargetRect();
    const onResize = () => updateTargetRect();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [isActive, showFinale, stopIndex, location.pathname, updateTargetRect]);

  // Next stop
  const handleNext = useCallback(() => {
    if (stopIndex < GUIDED_STOPS.length - 1) {
      setStopIndex((prev) => prev + 1);
    } else {
      setShowFinale(true);
    }
  }, [stopIndex]);

  // Prev stop
  const handlePrev = useCallback(() => {
    if (showFinale) {
      setShowFinale(false);
      return;
    }
    if (stopIndex > 0) {
      setStopIndex((prev) => prev - 1);
    }
  }, [showFinale, stopIndex]);

  // Keyboard navigation & Shortcut blocking during tour
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (showLeaveConfirm) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowLeaveConfirm(true);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!showFinale) {
          e.preventDefault();
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (!showFinale) {
          e.preventDefault();
          handlePrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, showLeaveConfirm, showFinale, handleNext, handlePrev]);

  // Browser Back acts as Tour Back button
  useEffect(() => {
    if (!isActive) return;
    const handlePopState = () => {
      handlePrev();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isActive, handlePrev]);

  // Touch swipe support for mobile
  const touchStartXRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isActive || !placement.isMobile) return;
    const onTouchStart = (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartXRef.current;
      touchStartXRef.current = null;
      if (Math.abs(dx) > 50) {
        if (dx < 0) handleNext();
        else handlePrev();
      }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isActive, placement.isMobile, handleNext, handlePrev]);

  return (
    <>
      {/* 1. Welcome Modal on Home */}
      <TourWelcomeModal
        isOpen={showWelcome}
        onTakeTour={handleTakeTour}
        onSkipTour={handleSkipTour}
        isReducedMotion={isReducedMotion}
      />

      {/* 2. Guided Tour active overlay on real app */}
      {isActive && (
        <>
          {/* Dimmed background overlay with cutout mask (blocks clicks behind) */}
          <GuidedOverlay
            targetRect={showFinale ? null : targetRect}
            isReducedMotion={isReducedMotion}
          />

          {/* Floating Stage Card with callout tail */}
          <AnimatePresence mode="wait">
            {!showFinale ? (
              <GuidedCard
                key={currentStop.id}
                cardRef={cardRef}
                stop={currentStop}
                stopIndex={stopIndex}
                totalStops={GUIDED_STOPS.length}
                tourPath={tourPath}
                cardStyle={placement.cardStyle}
                tailSide={placement.tailSide}
                tailPos={placement.tailPos}
                isReducedMotion={isReducedMotion}
                isMobile={placement.isMobile}
                onNext={handleNext}
                onPrev={handlePrev}
                onSkip={() => setShowLeaveConfirm(true)}
                onSelectPath={(path) => {
                  setTourPath(path);
                  sessionStorage.setItem(TOUR_PATH_KEY, path);
                  handleNext();
                }}
              />
            ) : (
              <FinaleCard
                key="finale"
                user={user || null}
                tourPath={tourPath}
                isReducedMotion={isReducedMotion}
                onFinishTour={handleFinishTour}
              />
            )}
          </AnimatePresence>

          {/* Leave confirm modal */}
          <LeaveModal
            isOpen={showLeaveConfirm}
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={handleSkipTour}
          />
        </>
      )}

      {/* 300ms cream light sweep on finish */}
      <AnimatePresence>
        {lightSweep && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 pointer-events-none z-[100] bg-gradient-to-r from-transparent via-[#F7F4EB]/35 to-transparent"
          />
        )}
      </AnimatePresence>
    </>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { OnboardingBadge } from './components/onboarding-badge';
import { HandleField } from './components/handle-field';
import { AvatarPicker, type AvatarSelection } from './components/avatar-picker';
import { StepRoleCards } from './components/step-role-cards';
import { StepMilesTrack, type ExperienceLevel } from './components/step-miles-track';
import { StepGoalCards, type UserGoal } from './components/step-goal-cards';
import { StepTechStack } from './components/step-tech-stack';
import { ConfettiCanvas } from './components/confetti';
import { getPresetAvatarUrl } from './preset-avatars';
import { onboardingApi } from './api';

const DRAFT_KEY = 'hackathon_os_onboarding_draft_v1';

export function OnboardingView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const prefersReducedMotion = useReducedMotion();

  // Load draft or default state
  const [step, setStep] = useState<number>(0);
  const [handle, setHandle] = useState<string>('');
  const [handleValid, setHandleValid] = useState<boolean>(false);
  const [avatar, setAvatar] = useState<AvatarSelection>({
    type: 'PRESET',
    presetIndex: Math.floor(Math.random() * 10) + 1,
  });
  const [roles, setRoles] = useState<string[]>([]);
  const [miles, setMiles] = useState<ExperienceLevel>('FIRST');
  const [goal, setGoal] = useState<UserGoal>('ALL');
  const [stack, setStack] = useState<string[]>([]);

  // Reveal state
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (typeof d.step === 'number') setStep(d.step);
        if (d.handle) setHandle(d.handle);
        if (d.avatar) setAvatar(d.avatar);
        if (Array.isArray(d.roles)) setRoles(d.roles);
        if (d.miles) setMiles(d.miles);
        if (d.goal) setGoal(d.goal);
        if (Array.isArray(d.stack)) setStack(d.stack);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save draft whenever answers change
  useEffect(() => {
    if (step > 0 && step <= 6) {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ step, handle, avatar, roles, miles, goal, stack })
        );
      } catch {
        // ignore
      }
    }
  }, [step, handle, avatar, roles, miles, goal, stack]);

  // If user already completed onboarding, redirect to /app/home
  useEffect(() => {
    if (!userLoading && user?.onboardingCompleted) {
      navigate('/app/home', { replace: true });
    }
  }, [user, userLoading, navigate]);

  // Trigger reveal animations when entering step 7
  useEffect(() => {
    if (step === 7) {
      setIsPrinting(true);
      setShowConfetti(true);
      const flipTimer1 = setTimeout(() => setIsFlipped(true), 900);
      const flipTimer2 = setTimeout(() => setIsFlipped(false), 2400);
      const printTimer = setTimeout(() => setIsPrinting(false), 1400);
      return () => {
        clearTimeout(flipTimer1);
        clearTimeout(flipTimer2);
        clearTimeout(printTimer);
      };
    }
  }, [step]);

  const firstName = useMemo(() => {
    const raw = user?.firstName || user?.name || user?.displayName || '';
    return raw.trim().split(/\s+/)[0] || 'there';
  }, [user]);

  const resolvedAvatarSrc = useMemo(() => {
    if (avatar.type === 'CUSTOM' && avatar.customUrl) return avatar.customUrl;
    if (avatar.presetIndex) return getPresetAvatarUrl(avatar.presetIndex);
    return null;
  }, [avatar]);

  const handleNext = () => {
    if (step === 1 && !handleValid) return;
    setStep((prev) => Math.min(prev + 1, 7));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleFinishOnboarding = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const updatedUser = await onboardingApi.submitOnboarding({
        username: handle,
        avatarType: avatar.type,
        avatarPreset: avatar.presetIndex,
        avatarUrl: avatar.type === 'CUSTOM' ? avatar.customUrl : undefined,
        roleTags: roles,
        experienceLevel: miles,
        goal,
        techStack: stack,
      });

      localStorage.removeItem(DRAFT_KEY);
      queryClient.setQueryData(['currentUser'], updatedUser);
      navigate('/app/home', { replace: true });
    } catch (err: any) {
      setSubmitError(err?.message || 'Could not complete onboarding. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard navigation: Enter continues on valid state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && step < 7) {
        if (step === 1 && !handleValid) return;
        // Don't auto-advance if user is inside a form textarea or custom add input
        const target = e.target as HTMLElement;
        if (target && target.tagName === 'INPUT' && target.getAttribute('placeholder') === 'Add custom...') {
          return;
        }
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-between relative overflow-x-hidden bg-[#FAF9F6]"
      style={{
        fontFamily: 'var(--font-ui)',
        backgroundImage: `radial-gradient(at 0% 0%, rgba(109, 94, 245, 0.03) 0px, transparent 50%),
                          radial-gradient(at 100% 100%, rgba(245, 158, 11, 0.03) 0px, transparent 50%)`,
      }}
    >
      {showConfetti && <ConfettiCanvas />}

      {/* ── Top Bar: Back arrow + 6 Dash segments + Skip button ── */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between shrink-0 select-none z-20">
        <div className="flex items-center gap-4">
          {step > 0 && step < 7 && (
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 -ml-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors cursor-pointer"
              aria-label="Previous step"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}

          {/* 6 Step Dash Indicators */}
          {step > 0 && step <= 6 && (
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === step
                      ? 'w-7 bg-neutral-900'
                      : idx < step
                      ? 'w-4 bg-neutral-700'
                      : 'w-4 bg-neutral-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Skip button for optional steps */}
        {step >= 3 && step <= 6 && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer px-2 py-1"
          >
            Skip
          </button>
        )}
      </header>

      {/* ── Main Layout: Two Columns (Left Step ~55%, Right Badge ~45%) ── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-12 py-4 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        {/* Mobile Badge Preview */}
        <div className="lg:hidden w-full flex justify-center shrink-0">
          <OnboardingBadge
            displayName={user?.displayName || user?.name || firstName}
            handle={handle}
            avatarSrc={resolvedAvatarSrc}
            roleTags={roles}
            experienceLevel={miles}
            goal={goal}
            isFlipped={isFlipped}
            isPrinting={isPrinting}
            className="scale-90"
          />
        </div>

        {/* ── Left Column: Current Step ── */}
        <div className="w-full lg:w-[54%] flex flex-col justify-center min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -16 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex flex-col gap-6"
            >
              {/* STEP 0: WELCOME */}
              {step === 0 && (
                <div className="flex flex-col gap-5">
                  <h1
                    className="text-4xl sm:text-5xl font-normal text-neutral-900 tracking-tight leading-[1.08]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Hey {firstName}. Let's make your badge.
                  </h1>
                  <p className="text-base text-neutral-600 font-normal leading-relaxed">
                    Six quick taps. Only one is required.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                    >
                      Start <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1: CLAIM HANDLE */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2
                      className="text-4xl sm:text-5xl font-normal text-neutral-900 tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Pick a handle.
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Required. Unique across all Hackathon OS rooms.
                    </p>
                  </div>
                  <HandleField
                    value={handle}
                    onChange={setHandle}
                    onValidChange={setHandleValid}
                    firstName={firstName}
                  />
                  <div className="pt-3">
                    <button
                      type="button"
                      disabled={!handleValid}
                      onClick={handleNext}
                      className="px-6 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      Continue <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CHOOSE FACE */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2
                      className="text-4xl sm:text-5xl font-normal text-neutral-900 tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Pick a face.
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Choose from our presets or upload and crop your own photo.
                    </p>
                  </div>
                  <AvatarPicker selection={avatar} onChange={setAvatar} />
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                    >
                      Continue <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: WHAT DO YOU BRING? */}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2
                      className="text-4xl sm:text-5xl font-normal text-neutral-900 tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      What do you bring to a team?
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">Pick up to 3.</p>
                  </div>
                  <StepRoleCards selected={roles} onChange={setRoles} />
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                    >
                      Continue <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: HACKATHON MILES */}
              {step === 4 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2
                      className="text-4xl sm:text-5xl font-normal text-neutral-900 tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      How many hackathons have you survived?
                    </h2>
                  </div>
                  <StepMilesTrack value={miles} onChange={setMiles} />
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                    >
                      Continue <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: GOAL */}
              {step === 5 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2
                      className="text-4xl sm:text-5xl font-normal text-neutral-900 tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      What does winning look like for you?
                    </h2>
                  </div>
                  <StepGoalCards value={goal} onChange={setGoal} />
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                    >
                      Continue <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: YOUR STACK */}
              {step === 6 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2
                      className="text-4xl sm:text-5xl font-normal text-neutral-900 tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      What do you actually know?
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Be honest. It helps your team plan.
                    </p>
                  </div>
                  <StepTechStack selected={stack} onChange={setStack} />
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-3 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                    >
                      Finish badge <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* REVEAL */}
              {step === 7 && (
                <div className="flex flex-col gap-5">
                  <h2
                    className="text-4xl sm:text-5xl font-normal text-neutral-900 tracking-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Badge printed.
                  </h2>
                  <p className="text-sm text-neutral-600">
                    Welcome aboard, @{handle || 'builder'}. Your credentials and preferences are locked in.
                  </p>

                  {submitError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                      {submitError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleFinishOnboarding}
                      className="px-8 py-3.5 rounded-2xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all shadow-md cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Entering...
                        </>
                      ) : submitError ? (
                        <>
                          <RefreshCw className="size-4" /> Retry
                        </>
                      ) : (
                        <>
                          Enter Hackathon OS <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Right Column: Live Conference Badge (Desktop) ── */}
        <div className="hidden lg:flex w-[42%] justify-center items-center">
          <OnboardingBadge
            displayName={user?.displayName || user?.name || firstName}
            handle={handle}
            avatarSrc={resolvedAvatarSrc}
            roleTags={roles}
            experienceLevel={miles}
            goal={goal}
            isFlipped={isFlipped}
            isPrinting={isPrinting}
          />
        </div>
      </main>

      <footer className="h-10 text-center text-[11px] text-neutral-400 font-mono select-none">
        Hackathon OS · Participant Identity Service
      </footer>
    </div>
  );
}

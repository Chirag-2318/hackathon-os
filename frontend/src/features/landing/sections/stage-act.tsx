import { useEffect, useRef, useState } from 'react';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { JudgeScene } from '../components/scenes/judge-scene';
import { LaunchScene } from '../components/scenes/launch-scene';
import { ReadinessScene } from '../components/scenes/readiness-scene';
import { RehearsalScene } from '../components/scenes/rehearsal-scene';
import { Section } from '../components/section';
import { StageShell } from '../components/stage-shell';
import { JUDGE, LAUNCH, READINESS, REHEARSAL, STAGE_HEAD } from '../data/stage-act';
import { HUD_ORDER, useHudSource } from '../hooks/use-hud';
import { useInViewOnce } from '../hooks/use-in-view-once';
import { useStageProgress } from '../hooks/use-stage-progress';
import { formatClock, parseClock } from '../lib/clock';
import { noOrphan } from '../lib/no-orphan';

type LaunchPhase = 'idle' | 'pressed' | 'stamped';

// One tree serves both layouts. On desktop (and without reduced motion) the scenes sit on top of each other inside a
// pinned frame and the scroll position picks the active one. Everywhere else they are stacked, one under another.
// All four scenes are always in the page, in reading order, so nothing is hidden from screen readers.
export function StageAct() {
  const { trackRef, stickyRef, pinned, scene, line, level } = useStageProgress();
  const [phase, setPhase] = useState<LaunchPhase>('idle');
  const pressTimeoutRef = useRef<number | null>(null);
  const { ref: launchRef, inView: launchInView } = useInViewOnce<HTMLDivElement>(0.5);
  const reportSubmitted = useHudSource(HUD_ORDER.submitted);
  const stateOf = (index: number) => (scene === index ? 'active' : index < scene ? 'past' : 'future');

  const triggerSubmit = () => {
    setPhase((current) => {
      if (current !== 'idle') return current;
      if (pressTimeoutRef.current) {
        window.clearTimeout(pressTimeoutRef.current);
      }
      pressTimeoutRef.current = window.setTimeout(() => {
        setPhase('stamped');
      }, 140);
      return 'pressed';
    });
  };

  // Not pinned (phones, tablets, reduced motion): the stamp lands once, when the launch card is mostly in view.
  useEffect(() => {
    if (!pinned && launchInView && phase === 'idle') triggerSubmit();
  }, [pinned, launchInView, phase]);

  // Pinned: about a second after the launch scene appears the demo cursor presses the button (the visitor can press first).
  useEffect(() => {
    if (!pinned || scene !== 3 || phase !== 'idle') return;
    const id = window.setTimeout(() => triggerSubmit(), 1000);
    return () => window.clearTimeout(id);
  }, [pinned, scene, phase]);

  // Pinned: scrolling back above the launch scene resets it, so the stamp can land again.
  useEffect(() => {
    if (pinned && scene < 3 && phase !== 'idle') {
      if (pressTimeoutRef.current) {
        window.clearTimeout(pressTimeoutRef.current);
        pressTimeoutRef.current = null;
      }
      setPhase('idle');
    }
  }, [pinned, scene, phase]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        window.clearTimeout(pressTimeoutRef.current);
      }
    };
  }, []);

  // The clock pill freezes on the launch time, then reads SUBMITTED for the rest of the page.
  useEffect(() => {
    if (phase === 'idle') {
      reportSubmitted(null);
      return;
    }
    reportSubmitted({ text: formatClock(parseClock(LAUNCH.time)), tone: 'done' });
    const id = window.setTimeout(() => reportSubmitted({ text: LAUNCH.stamp, tone: 'done' }), 1600);
    return () => window.clearTimeout(id);
  }, [phase, reportSubmitted]);

  return (
    <Section id="stage-act" tone="dark" grain className="l-stage-act" ariaLabelledBy="stage-heading">
      <div ref={trackRef} className="l-stage-track">
        <div ref={stickyRef} className="l-stage-sticky">
          <div className="l-grid-bg" aria-hidden="true" />
          <Container>
            <div className="l-stage-head" data-phase={scene < 0 ? 'curtain' : 'scenes'}>
              <Eyebrow index={4}>{STAGE_HEAD.eyebrow}</Eyebrow>
              <ItalicHeading
                as="h2"
                id="stage-heading"
                size="display-xl"
                align="center"
                lead={STAGE_HEAD.headingLead}
                em={STAGE_HEAD.headingEm}
              />
              <p className="l-lead">{noOrphan(STAGE_HEAD.line)}</p>
            </div>

            <div className="l-stage-scenes">
              <div className="l-stage-scene" data-state={stateOf(0)}>
                <StageShell label={REHEARSAL.barLabel}>
                  <RehearsalScene
                    current={pinned ? line : undefined}
                    segment={pinned ? line : undefined}
                    level={pinned ? level : undefined}
                    animate={pinned && scene === 0}
                  />
                </StageShell>
                <p className="l-stage-note">{REHEARSAL.caption}</p>
              </div>

              <div className="l-stage-scene" data-state={stateOf(1)}>
                <StageShell label={JUDGE.barLabel}>
                  <JudgeScene />
                </StageShell>
                <p className="l-stage-note">{JUDGE.caption}</p>
              </div>

              <div className="l-stage-scene" data-state={stateOf(2)}>
                <StageShell
                  label={READINESS.barLabel}
                  right={<span className="l-stage-chip" data-tone="plain">{READINESS.exampleChip}</span>}
                >
                  <ReadinessScene filled={pinned ? scene >= 2 : undefined} />
                </StageShell>
              </div>

              <div ref={launchRef} className="l-stage-scene" data-state={stateOf(3)}>
                <StageShell label={LAUNCH.barLabel}>
                  <LaunchScene
                    phase={phase}
                    submitted={phase === 'stamped'}
                    armed={pinned && scene === 3 && phase === 'idle'}
                    onMark={triggerSubmit}
                  />
                </StageShell>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </Section>
  );
}

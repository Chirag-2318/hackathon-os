import { useEffect, useRef } from 'react';
import { BracketFrame } from '../components/bracket-frame';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { LazyMount } from '../components/lazy-mount';
import { Section } from '../components/section';
import { CueRail } from '../components/stage-act/cue-rail';
import { StageBackdrop } from '../components/stage-act/stage-backdrop';
import { StageSatellites } from '../components/stage-act/stage-satellites';
import { StageWindow } from '../components/stage-act/stage-window';
import { LAUNCH, STAGE_HEAD } from '../data/stage-act';
import { STAGE_CUES } from '../data/stage-cues';
import { useInViewOnce } from '../hooks/use-in-view-once';
import { useMediaQuery } from '../hooks/use-media-query';
import { useStageAct } from '../hooks/use-stage-act';
import { useStageSubmit } from '../hooks/use-stage-submit';

// The pinned theatre only exists on large screens with room to spare and without reduced motion.
const PINNED_QUERY = '(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)';

function Heading() {
  return (
    <>
      <Eyebrow index={4}>{STAGE_HEAD.eyebrow}</Eyebrow>
      <ItalicHeading as="h2" id="stage-heading" size="display-xl" align="center" lead={STAGE_HEAD.headingLead} em={STAGE_HEAD.headingEm} />
      <p className="l-lead">{STAGE_HEAD.line}</p>
    </>
  );
}

// Screen-reader text: all four cues are described even though only one is on screen at a time.
function Described({ submitted }: { submitted: boolean }) {
  return (
    <>
      <ol className="l-sr-only">
        {STAGE_CUES.map((cue) => (
          <li key={cue.id}>{`${cue.label}. ${cue.line} ${cue.desc}`}</li>
        ))}
      </ol>
      <p className="l-sr-only" aria-live="polite">{submitted ? LAUNCH.result : ''}</p>
    </>
  );
}

function PinnedStage() {
  const stage = useStageAct();
  const { submitted, submit, reset } = useStageSubmit();
  const viewIndex = Math.max(stage.scene, 0);
  const previous = useRef(viewIndex);
  const direction = viewIndex >= previous.current ? 'forward' : 'backward';
  useEffect(() => {
    previous.current = viewIndex;
  }, [viewIndex]);

  // Scrolling back above the last cue resets it, so the stamp can land again.
  useEffect(() => {
    if (stage.scene < 3 && submitted) reset();
  }, [stage.scene, submitted, reset]);

  const cue = STAGE_CUES[viewIndex];

  return (
    <div ref={stage.trackRef} className="l-sg-track">
      <div ref={stage.stickyRef} className="l-sg-sticky" data-scene={stage.scene}>
        <StageBackdrop scene={stage.scene} submitted={submitted} />
        <Container wide>
          <div ref={stage.headRef} className="l-sg-head">
            <Heading />
          </div>

          <div ref={stage.wrapRef} className="l-sg-wrap">
            <div key={cue.id} className="l-sg-strip l-rise">
              <span className="l-sg-strip-left">
                <span className="l-sg-strip-index">{`[ ${cue.index} / 04 ]`}</span>
                <span className="l-sg-strip-label">{cue.label}</span>
              </span>
              <span className="l-sg-strip-line">{cue.line}</span>
            </div>
            <div className="l-sg-stage">
              <BracketFrame tone="dark" gap={34} arm={16} stroke={2} className="l-sg-frame">
                <StageWindow
                  viewIndex={viewIndex}
                  direction={direction}
                  line={stage.line}
                  levelRef={stage.levelRef}
                  animated
                  submitted={submitted}
                  armed={stage.scene === 3}
                  onPress={submit}
                />
              </BracketFrame>
              <StageSatellites index={viewIndex} submitted={submitted} />
            </div>
          </div>

          <div ref={stage.railRef} className="l-sg-rail">
            <CueRail active={viewIndex} fillRef={stage.fillRef} />
          </div>
        </Container>
        <Described submitted={submitted} />
      </div>
    </div>
  );
}

function StackedStage() {
  const { submitted, submit } = useStageSubmit();
  const { ref, inView } = useInViewOnce<HTMLLIElement>(0.5);
  const noop = useRef({ current: 0 }).current;

  // The stamp lands once, when the last card is mostly on screen.
  useEffect(() => {
    if (inView) submit();
  }, [inView, submit]);

  return (
    <Container>
      <div className="l-sgs-head">
        <Heading />
      </div>
      <ol className="l-sgs-list">
        {STAGE_CUES.map((cue, index) => (
          <li key={cue.id} ref={index === 3 ? ref : undefined} className="l-sgs-card">
            <div className="l-sgs-meta">
              <span>{`[ ${cue.index} / 04 ]`}</span>
              <span>{cue.label}</span>
            </div>
            <p className="l-body">{cue.line}</p>
            <p className="l-sr-only">{cue.desc}</p>
            <LazyMount minHeight={300}>
              <StageWindow
                viewIndex={index}
                direction="forward"
                line={1}
                levelRef={noop}
                animated={false}
                submitted={index === 3 && submitted}
                armed={false}
                onPress={submit}
              />
            </LazyMount>
            <div className="l-sgs-sats">
              <StageSatellites index={index} submitted={index === 3 && submitted} />
            </div>
          </li>
        ))}
      </ol>
      <p className="l-sr-only" aria-live="polite">{submitted ? LAUNCH.result : ''}</p>
    </Container>
  );
}

export function StageAct() {
  const pinned = useMediaQuery(PINNED_QUERY);
  return (
    <Section id="stage-act" tone="dark" grain className="l-stage-act" ariaLabelledBy="stage-heading">
      {pinned ? <PinnedStage /> : <StackedStage />}
    </Section>
  );
}

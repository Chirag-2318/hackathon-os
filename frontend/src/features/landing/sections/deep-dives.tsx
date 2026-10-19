import { Section } from '../components/section';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { IdeaStressDemo } from '../components/idea-stress-demo';
import { LedgerDemo } from '../components/ledger-demo';
import { DIVES_HEAD, DIVE_A_COPY, DIVE_B_COPY } from '../data/deep-dive-copy';
import { IDEA_TEXT } from '../data/idea-demo';
import { LEDGER_TEXT } from '../data/ledger-demo';
import { noOrphan } from '../lib/no-orphan';

export function DeepDives() {
  return (
    <Section tone="surface" className="l-dives" ariaLabelledBy="dives-heading">
      <Container>
        <div className="l-dives-head">
          <Eyebrow index={3}>{DIVES_HEAD.eyebrow}</Eyebrow>
          <ItalicHeading as="h2" id="dives-heading" lead={DIVES_HEAD.headingLead} em={DIVES_HEAD.headingEm} />
          <p className="l-lead">{noOrphan(DIVES_HEAD.lead)}</p>
        </div>

        <div className="l-dive">
          <div className="l-dive-text">
            <Eyebrow>{DIVE_A_COPY.eyebrow}</Eyebrow>
            <ItalicHeading as="h3" lead={DIVE_A_COPY.titleLead} em={DIVE_A_COPY.titleEm} />
            <p className="l-body">{noOrphan(DIVE_A_COPY.body)}</p>
            <p className="l-dive-benefit">{noOrphan(DIVE_A_COPY.benefit)}</p>
          </div>
          <div className="l-dive-demo">
            <IdeaStressDemo />
            <p className="l-caption l-dive-note">{IDEA_TEXT.caption}</p>
          </div>
        </div>

        <div className="l-dive l-dive--flip">
          <div className="l-dive-text">
            <Eyebrow>{DIVE_B_COPY.eyebrow}</Eyebrow>
            <ItalicHeading as="h3" lead={DIVE_B_COPY.titleLead} em={DIVE_B_COPY.titleEm} />
            <p className="l-body">{noOrphan(DIVE_B_COPY.body)}</p>
            <p className="l-dive-benefit">{noOrphan(DIVE_B_COPY.benefit)}</p>
          </div>
          <div className="l-dive-demo">
            <LedgerDemo />
            <p className="l-caption l-dive-note">{LEDGER_TEXT.caption}</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

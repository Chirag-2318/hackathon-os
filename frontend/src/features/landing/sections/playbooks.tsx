import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Section } from '../components/section';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { ItalicHeading } from '../components/italic-heading';
import { Reveal } from '../components/reveal';
import { PlaybookCard } from '../components/playbook-card';
import { PLAYBOOKS, PLAYBOOKS_COPY } from '../data/playbooks';
import { noOrphan } from '../lib/no-orphan';

export function Playbooks() {
  return (
    <Section tone="light" className="l-playbooks" ariaLabelledBy="playbooks-heading">
      <Container>
        <div className="l-sechead">
          <div className="l-sechead__intro">
            <Eyebrow index={5}>{PLAYBOOKS_COPY.eyebrow}</Eyebrow>
            <ItalicHeading
              as="h2"
              id="playbooks-heading"
              lead={PLAYBOOKS_COPY.headingLead}
              em={PLAYBOOKS_COPY.headingEm}
            />
            <p className="l-lead">{noOrphan(PLAYBOOKS_COPY.lead)}</p>
          </div>
          <div className="l-sechead__action">
            <Link to={PLAYBOOKS_COPY.browseAll.to} className="l-link">
              {PLAYBOOKS_COPY.browseAll.label}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <ul className="l-pb-grid">
          {PLAYBOOKS.map((playbook, index) => (
            <Reveal as="li" key={playbook.id} index={index % 3}>
              <PlaybookCard playbook={playbook} index={index} />
            </Reveal>
          ))}
        </ul>

        <div className="l-pb-tools">
          <p className="l-pb-tools-line">{noOrphan(PLAYBOOKS_COPY.toolsLine)}</p>
          <Link to={PLAYBOOKS_COPY.toolsLink.to} className="l-link">
            {PLAYBOOKS_COPY.toolsLink.label}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <p className="l-caption l-pb-foot">{noOrphan(PLAYBOOKS_COPY.footnote)}</p>
      </Container>
    </Section>
  );
}

import * as React from 'react';
import { Link } from 'react-router-dom';

interface Tip {
  title: string;
  text: string;
}

const PLAYBOOK_TIPS: Tip[] = [
  {
    title: 'Ship the vertical slice before polishing styling',
    text: 'Get an end-to-end request from client to DB returning real data in hour 4. Everything else builds on proof that it works.',
  },
  {
    title: 'Pitch script first, slides last',
    text: 'Draft your 3-minute spoken script on Friday night before writing a single slide. Let the spoken narrative dictate your visual flow.',
  },
  {
    title: 'Feature freeze at hour 24',
    text: 'Reserve the final quarter exclusively for deployment, edge-case hardening, and recording your demo video. Rushed merges lose finals.',
  },
  {
    title: 'Seed real demo data early',
    text: 'Empty states kill hackathon pitches. Populate realistic, domain-specific records so the judges instantly grasp user context.',
  },
  {
    title: "Demo what works, omit what doesn't",
    text: 'Judges rate what they see. If a secondary feature has bugs, cut the button from the navigation entirely. Zero shame in focus.',
  },
  {
    title: 'Practice transitions between speakers',
    text: 'Handoffs between presenters reveal team readiness. Agree on verbal cues and who clicks slides before the rehearsal.',
  },
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function PlaybookTipSection() {
  const defaultIndex = React.useMemo(() => {
    return getDayOfYear() % PLAYBOOK_TIPS.length;
  }, []);

  const [currentIndex, setCurrentIndex] = React.useState(defaultIndex);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % PLAYBOOK_TIPS.length);
  };

  const tip = PLAYBOOK_TIPS[currentIndex];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-muted-foreground">
          From the playbook
        </h2>
        <button
          type="button"
          onClick={handleNext}
          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
        >
          Next tip
        </button>
      </div>

      {/* Tip body: 2px accent rule on the left, no box */}
      <div className="border-l-2 border-[#E8A33D] pl-3 py-0.5 flex flex-col gap-1">
        <h3 className="text-[15px] font-medium text-foreground leading-snug">
          {tip.title}
        </h3>
        <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
          {tip.text}
        </p>
      </div>

      <div className="pt-1">
        <Link
          to="/app/playbooks"
          className="text-[13px] font-medium text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Read the playbook
        </Link>
      </div>
    </section>
  );
}

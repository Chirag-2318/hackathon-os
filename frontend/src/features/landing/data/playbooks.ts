export type Playbook = { id: string; name: string; meta: string; note: string; hours: number | null };

// Playbooks are templates built around these event formats; durations come from the product's own playbook list.
export const PLAYBOOKS: Playbook[] = [
  { id: 'sih', name: 'Smart India Hackathon', meta: '36 h · team of 6', note: 'PPT internal round', hours: 36 },
  { id: 'devpost', name: 'Devpost online event', meta: '48 h · teams of 1 to 4', note: 'Asynchronous video judging', hours: 48 },
  { id: 'mlh', name: 'MLH weekend sprint', meta: '36 h', note: 'Weekend format', hours: 36 },
  { id: 'ai4', name: '4-hour AI sprint', meta: '4 h', note: 'Generative AI sprint', hours: 4 },
  { id: 'corporate', name: 'Corporate innovation', meta: '24 h', note: 'Internal hackathon', hours: 24 },
  { id: 'solo', name: 'Solo sprint', meta: '24 h · solo', note: 'Same gates, same plan pipeline', hours: 24 },
];

export const PLAYBOOK_MAX_HOURS = 48; // a full ring means 48 hours

// Check the "zero affiliate links" line and the non-affiliation footnote before launch.
export const PLAYBOOKS_COPY = {
  eyebrow: 'playbooks',
  headingLead: 'Built for your',
  headingEm: 'format.',
  lead: 'Playbooks for the events teams actually enter. Pick one and the room starts with the right clock, team size and rules.',
  open: 'Open playbook',
  browseAll: { label: 'Browse all playbooks', to: '/playbooks' },
  toolsLine: 'Vetted tools for hackathon teams. Zero affiliate links, zero sponsored slots.',
  toolsLink: { label: 'Explore the tool directory', to: '/app/tools' },
  footnote: 'Playbooks are templates built around these formats. [brackit] is not affiliated with SIH, MLH or Devpost.',
} as const;

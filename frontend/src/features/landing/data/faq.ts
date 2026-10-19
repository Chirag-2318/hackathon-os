export const FAQ_COPY = {
  eyebrow: 'faq',
  headingLead: 'Honest answers to',
  headingEm: 'the usual questions.',
} as const;

export type FaqItem = { id: string; q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  { id: 'code', q: 'Does it write my code?', a: 'No. It plans, scopes, documents and prepares your pitch. You write and own the code.' },
  { id: 'chat', q: 'Why not just use our group chat?', a: 'Keep the chat. [brackit] replaces the scattered docs, unread PDFs and loose task lists with one clock-aware room.' },
  { id: 'key', q: 'Do I need an API key or a paid AI account?', a: 'No. AI runs through the backend. The free plan includes 3 rooms a month.' },
  { id: 'submit', q: 'Does it submit to Devpost, Devfolio or Unstop for me?', a: 'No. It prepares your deliverables and a pre-flight checklist. You submit on the event’s own platform, then mark it done here.' },
  { id: 'wifi', q: 'What if the wifi drops?', a: 'Your active room, tasks and docs are cached in the browser and the app reconnects automatically. You can also export a ZIP of the whole room.' },
  { id: 'github', q: 'Is my GitHub access safe?', a: 'Tokens are encrypted at rest with AES-256-GCM, and sessions use HttpOnly cookies.' },
  { id: 'free', q: 'Is it free?', a: 'Free to start. Pro and Max are on a waitlist and not yet purchasable.' },
  { id: 'affiliated', q: 'Is this affiliated with SIH, MLH or Devpost?', a: 'No. Playbooks are templates built around those formats.' },
];

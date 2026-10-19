export const COMPARE_COPY = {
  eyebrow: 'compared',
  headingLead: 'Keep the chat.',
  headingEm: 'Replace the scatter.',
  lead: 'These tools are good at what they are for. A 36-hour sprint is not that.',
  tablistLabel: 'Compare with',
  leftTitle: 'Where it breaks in a 36-hour sprint',
  rightTitle: 'In [brackit]',
} as const;

export type CompareTab = { id: string; label: string; left: string; right: string };

export const COMPARE_TABS: CompareTab[] = [
  { id: 'chat', label: 'WhatsApp / Discord', left: 'Links and decisions get buried. No clock. Blockers stay silent.', right: 'A structured room with live updates, one-tap blocked alerts and a shared deadline. Keep the chat for banter.' },
  { id: 'trackers', label: 'Jira / Linear / Trello', left: 'Setup eats hours. They know nothing about your brief, rubric or pitch.', right: 'Zero setup. Playbooks for common formats, a board seeded from the plan, pitch and demo tools included.' },
  { id: 'docs', label: 'Notion / Docs', left: 'A blank page, and docs that drift from the code.', right: 'Nine structured, versioned Markdown docs generated from the approved idea.' },
  { id: 'ai', label: 'AI chat in a tab', left: 'Output that is disconnected from your brief. Nobody can defend what was generated.', right: 'AI fed with your brief, rubric, approved idea, member skills and hours left, then the Judge’s Chair drills you on your own build.' },
];

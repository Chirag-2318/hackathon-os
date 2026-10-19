export type PlanId = 'free' | 'pro' | 'max';
export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  rooms: string;
  includes: string[];
  planned: string[];
  active: boolean;
};

export const PRICING_COPY = {
  eyebrow: 'pricing',
  headingLead: 'Free to start.',
  headingEm: 'Pro is on the waitlist.',
  sub: 'Three rooms a month, free.',
  activeChip: 'Active',
  plannedChip: 'planned',
  startLabel: 'Start a room',
  waitlistLabel: 'Join the waitlist',
  note: 'Pro and Max cannot be bought yet. Join the waitlist and tell us what you need.',
} as const;

// Prices and limits come from the product's plan list. Pro and Max are NOT purchasable: never add a buy button,
// a "most popular" badge, an annual toggle or a countdown. Check "Review, Retro and Project Summary" against the
// product's plan file before launch.
export const PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: '$0', period: '', rooms: '3 rooms a month', includes: ['Brief, Ideate, Plan and Board', 'MVP Studio and Docs vault', 'Tech studios', 'Pitch Kit and Submission', 'ZIP export', 'Playbooks and the tool directory'], planned: [], active: true },
  { id: 'pro', name: 'Pro', price: '$9', period: '/mo', rooms: '25 rooms a month', includes: ['Everything in Free', 'Higher AI rate limits', 'Priority support'], planned: ['Claude MCP access', 'Post-hackathon continuation'], active: false },
  { id: 'max', name: 'Max', price: '$19', period: '/mo', rooms: 'Unlimited rooms', includes: ['Everything in Pro', 'Review, Retro and Project Summary pages', 'GitHub visual branch map'], planned: [], active: false },
];

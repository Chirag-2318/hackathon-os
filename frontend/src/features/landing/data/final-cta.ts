export type FooterLink = { label: string; to?: string; href?: string };

export const FINAL_COPY = {
  headingLead: 'Your next hackathon starts with',
  headingEm: 'a room.',
  primary: { label: 'Start a room', to: '/signin' },
  secondary: { label: 'Browse playbooks', to: '/playbooks' },
  caption: 'Free to start. 3 rooms a month. No card.',
} as const;

export const FOOTER_COPY = {
  line: 'Built for 36 hours, not 36 sprints.',
  productTitle: 'Product',
  legalTitle: 'Legal',
  copyright: '© 2026 [brackit]',
  disclaimer: '[brackit] is not affiliated with SIH, MLH or Devpost.',
} as const;

export const PRODUCT_LINKS: FooterLink[] = [
  { label: 'Playbooks', to: '/playbooks' },
  { label: 'Tool directory', to: '/app/tools' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Sign in', to: '/signin' },
];

// Terms and Privacy pages must exist before launch. Empty means the Legal column is not shown.
export const LEGAL_LINKS: FooterLink[] = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
];

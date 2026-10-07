/**
 * Role tag → pastel fill color mapping.
 * Source: I§5 canonical seven role tags, D§2.1 pastel fills.
 * Used on S03 invite landing for role-needed chips.
 */

export const ROLE_COLORS: Record<string, string> = {
  Frontend: 'var(--pastel-sky)',
  Backend: 'var(--pastel-lavender)',
  'ML/AI': 'var(--pastel-violet)',
  Design: 'var(--pastel-pink)',
  Presenter: 'var(--pastel-sun)',
  'Domain expert': 'var(--pastel-cream)',
  'QA/Demo operator': 'var(--pastel-lime)',
};

/**
 * Look up the pastel color for a role tag.
 * Falls back to a neutral pastel if the role is unknown.
 */
export function getRoleColor(role: string): string {
  return ROLE_COLORS[role] ?? 'var(--pastel-lavender)';
}

import { toast } from './components/toast';

const WITTY_LINES = [
  'Ship it like it’s hot.',
  'One step closer to demo day greatness!',
  'Hackathon judges won’t know what hit them.',
  'That feature didn’t stand a chance.',
  'Code compiled, morale elevated.',
];

/**
 * Triggers a witty one-liner plain toast.
 */
export function celebrateAchievement(customMessage?: string) {
  const line = customMessage || WITTY_LINES[Math.floor(Math.random() * WITTY_LINES.length)];
  toast.success(line);
}

import type { LucideIcon } from 'lucide-react';
import {
  Landmark,
  Globe,
  CalendarDays,
  Timer,
  Building2,
  User,
  LayoutTemplate,
} from 'lucide-react';

export function getPlaybookIcon(nameOrType: string): LucideIcon {
  const s = nameOrType.toLowerCase();
  if (s.includes('sih')) return Landmark;
  if (s.includes('devpost') || s.includes('online')) return Globe;
  if (s.includes('mlh') || s.includes('weekend')) return CalendarDays;
  if (s.includes('sprint')) return Timer;
  if (s.includes('internal') || s.includes('corporate')) return Building2;
  if (s.includes('solo')) return User;
  return LayoutTemplate;
}

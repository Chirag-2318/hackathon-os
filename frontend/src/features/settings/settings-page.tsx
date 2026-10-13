/**
 * S28 SettingsPage — Seven-section settings area
 * PRD 6a §3, S28
 * Route: /app/settings  → redirects to /app/settings/profile
 * Sub-routes: profile, appearance, notifications, integrations, ai-keys, privacy, billing
 *
 * Layout: Left sub-nav (240px) + right content at ≥1024.
 * Phase Track (C03) NOT rendered here (workspace-level page).
 */
import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  User, Palette, Bell, Link2, Key, Shield, CreditCard, Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Sub-nav items ──────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Profile',       path: 'profile',        icon: <User className="size-4" />          },
  { label: 'Appearance',    path: 'appearance',     icon: <Palette className="size-4" />       },
  { label: 'Notifications', path: 'notifications',  icon: <Bell className="size-4" />          },
  { label: 'Integrations',  path: 'integrations',   icon: <Link2 className="size-4" />         },
  { label: 'AI Status',     path: 'ai-status',      icon: <Cpu className="size-4" />           },
  { label: 'Privacy',       path: 'privacy',        icon: <Shield className="size-4" />        },
  { label: 'Billing',       path: 'billing',        icon: <CreditCard className="size-4" />   },
] as const;

type NavPath = typeof NAV_ITEMS[number]['path'];

/** Left sub-nav (desktop) */
function SettingsSubNav({ activePath }: { activePath: string }) {
  return (
    <nav
      aria-label="Settings sections"
      className="w-[240px] shrink-0 rounded-card border border-border bg-surface p-1 self-start sticky top-6"
    >
      {NAV_ITEMS.map(item => {
        const isActive = activePath.endsWith(item.path);
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 h-10 px-3 rounded-control text-body transition-colors relative',
              isActive
                ? 'bg-lav-50 text-lav-700 font-semibold'
                : 'text-ink hover:bg-hover-row',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Left marker */}
            {isActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-lav-600"
                aria-hidden="true"
              />
            )}
            <span className={cn('text-ink-muted', isActive && 'text-lav-600')} aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

// ── SettingsPage (shell) ───────────────────────────────────────────

export function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const activePath = location.pathname;

  // Mobile: derive current section value
  const currentSection = NAV_ITEMS.find(n => activePath.endsWith(n.path))?.path ?? 'profile';

  return (
    <div className="flex flex-col gap-6 p-6 pb-12">
      {/* Mobile: dropdown or pill row (≤1023) */}
      <div className="lg:hidden">
        <Select
          value={currentSection}
          onValueChange={(v: NavPath) => navigate(v)}
        >
          <SelectTrigger className="w-full sm:w-[240px]" aria-label="Settings section">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NAV_ITEMS.map(item => (
              <SelectItem key={item.path} value={item.path}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: left nav + content */}
      <div className="flex gap-6 items-start">
        <div className="hidden lg:block">
          <SettingsSubNav activePath={activePath} />
        </div>

        {/* Right content area */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

/** Default redirect: /settings → /settings/profile */
export function SettingsIndexRedirect() {
  return <Navigate to="profile" replace />;
}

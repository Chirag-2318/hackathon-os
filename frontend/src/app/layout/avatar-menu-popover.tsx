import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/features/auth/api';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  SettingsIcon,
  PlaybooksIcon,
  ToolDirectoryIcon,
  PortfolioIcon,
  LogoutIcon,
} from '@/components/icons';
import { cn } from '@/lib/utils';

export function AvatarMenuPopover() {
  const [open, setOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const displayName = user?.displayName ?? user?.email ?? 'Builder';
  const email = user?.email ?? '';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0] ?? '')
    .join('')
    .toUpperCase() || 'H';

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    queryClient.setQueryData(['currentUser'], null);
    window.location.href = '/login';
  }

  const handleNav = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'group relative flex items-center justify-center size-8 rounded-full',
            'bg-active text-ink text-xs font-semibold cursor-pointer outline-none',
            'avatar-hover-ring transition-all duration-150',
            'focus-visible:ring-2 focus-visible:ring-ink'
          )}
          aria-label="User profile menu"
          data-testid="header-avatar"
        >
          {initials}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[240px] p-2 rounded-[20px] bg-card border border-border shadow-xl font-[var(--font-inter)] z-50"
      >
        {/* Top block */}
        <div className="flex items-center gap-3 p-2.5 pb-3 border-b border-border">
          <div className="size-9 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-ink truncate leading-tight">{displayName}</h4>
            {email && <p className="text-xs text-ink-2 truncate mt-0.5">{email}</p>}
          </div>
        </div>

        {/* Navigation rows (40px, icon + label with hover animations) */}
        <div className="flex flex-col py-1">
          <button
            onClick={() => handleNav('/app/settings')}
            className="group flex items-center h-10 px-3 rounded-[var(--r-control)] gap-2.5 text-sm font-medium text-ink hover:bg-hover transition-colors text-left cursor-pointer"
          >
            <SettingsIcon size={18} className="text-ink-2 group-hover:text-ink" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => handleNav('/app/playbooks')}
            className="group flex items-center h-10 px-3 rounded-[var(--r-control)] gap-2.5 text-sm font-medium text-ink hover:bg-hover transition-colors text-left cursor-pointer"
          >
            <PlaybooksIcon size={18} className="text-ink-2 group-hover:text-ink" />
            <span>Playbooks</span>
          </button>

          <button
            onClick={() => handleNav('/app/tools')}
            className="group flex items-center h-10 px-3 rounded-[var(--r-control)] gap-2.5 text-sm font-medium text-ink hover:bg-hover transition-colors text-left cursor-pointer"
          >
            <ToolDirectoryIcon size={18} className="text-ink-2 group-hover:text-ink" />
            <span>Tool directory</span>
          </button>

          <button
            onClick={() => handleNav('/app/portfolio')}
            className="group flex items-center h-10 px-3 rounded-[var(--r-control)] gap-2.5 text-sm font-medium text-ink hover:bg-hover transition-colors text-left cursor-pointer"
          >
            <PortfolioIcon size={18} className="text-ink-2 group-hover:text-ink" />
            <span>Portfolio</span>
          </button>

          {/* Hairline */}
          <div className="my-1 border-t border-border" />

          {/* Log out */}
          <button
            onClick={handleLogout}
            className="group flex items-center h-10 px-3 rounded-[var(--r-control)] gap-2.5 text-sm font-medium text-danger hover:bg-red-50 transition-colors text-left cursor-pointer"
          >
            <LogoutIcon size={18} className="text-danger" />
            <span>Log out</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import { useNavigate, useLocation } from 'react-router-dom';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { useOverlay } from '@/app/providers/overlay-store';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  HomeIcon,
  MyRoomsIcon,
  PlaybooksIcon,
  ToolDirectoryIcon,
  PortfolioIcon,
  SettingsIcon,
  OverviewIcon,
  TeamIcon,
  SpeedModeIcon,
  PrepIcon,
  BriefIcon,
  IdeateIcon,
  CrowdCheckIcon,
  PlanIcon,
  BoardIcon,
  ScheduleIcon,
  MvpStudioIcon,
  DocsIcon,
  GithubIcon,
  ApiHubIcon,
  DiagramsIcon,
  PitchDeckIcon,
  RehearseIcon,
  QaIcon,
  DemoIcon,
  SubmissionIcon,
  ReadinessIcon,
  RetroIcon,
  InviteIcon,
} from '@/components/icons';
import { Plus, KeyRound } from 'lucide-react';

export function CommandPaletteOverlay() {
  const { isOpen, open, close, toggle } = useOverlay('command-palette');
  const createRoomModal = useOverlay('create-room-dialog');
  const joinCodeModal = useOverlay('join-code-dialog');
  const inviteModal = useOverlay('invite-dialog');

  const navigate = useNavigate();
  const location = useLocation();

  // Extract roomId if inside a room route
  const roomMatch = location.pathname.match(/\/app\/room\/([^/]+)/);
  const roomId = roomMatch ? roomMatch[1] : null;

  // Ctrl+K to toggle
  useKeyboardShortcut({
    key: 'k',
    ctrlOrMeta: true,
    handler: toggle,
  });

  const handleSelect = (action: () => void) => {
    close();
    action();
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(isOpenState) => {
        if (!isOpenState) close();
        else open();
      }}
      title="Command palette"
      description="Search tasks, docs, rules, or jump to any page"
      className="sm:max-w-[640px] rounded-[24px] overflow-hidden p-0 bg-card border border-border shadow-2xl font-[var(--font-inter)] z-50"
    >
      <Command className="rounded-[24px]">
        <CommandInput placeholder="Search tasks, docs, rules, or type a page..." />
        <CommandList className="max-h-[380px] p-2">
          <CommandEmpty>No matching results found.</CommandEmpty>

          {/* 1. Actions Group */}
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => handleSelect(() => createRoomModal.open())}
              className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
            >
              <div className="size-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Plus className="size-4" />
              </div>
              <span>Create room</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect(() => joinCodeModal.open())}
              className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
            >
              <div className="size-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                <KeyRound className="size-4" />
              </div>
              <span>Join with code</span>
            </CommandItem>

            {roomId && (
              <>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/speed-mode/${roomId}`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <div className="size-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                    <SpeedModeIcon size={16} />
                  </div>
                  <span>Open speed mode</span>
                </CommandItem>

                <CommandItem
                  onSelect={() => handleSelect(() => inviteModal.open({ roomId }))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <div className="size-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <InviteIcon size={16} />
                  </div>
                  <span>Invite teammate</span>
                </CommandItem>
              </>
            )}
          </CommandGroup>

          <CommandSeparator className="my-1.5" />

          {/* 2. Room Sections (When inside a room) */}
          {roomId && (
            <>
              <CommandGroup heading="Current Room">
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/overview`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <OverviewIcon size={18} className="text-ink-2" />
                  <span>Overview</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/team`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <TeamIcon size={18} className="text-ink-2" />
                  <span>Team roster & charter</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/prep`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <PrepIcon size={18} className="text-ink-2" />
                  <span>Pre-hackathon prep</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/brief`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <BriefIcon size={18} className="text-ink-2" />
                  <span>Project brief</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/ideate`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <IdeateIcon size={18} className="text-ink-2" />
                  <span>Ideate & voting</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/crowd-check`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <CrowdCheckIcon size={18} className="text-ink-2" />
                  <span>Crowd check</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/plan`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <PlanIcon size={18} className="text-ink-2" />
                  <span>Plan & milestones</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/board`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <BoardIcon size={18} className="text-ink-2" />
                  <span>Board (Kanban)</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/schedule`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <ScheduleIcon size={18} className="text-ink-2" />
                  <span>Schedule & checkpoints</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/mvp`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <MvpStudioIcon size={18} className="text-ink-2" />
                  <span>MVP Studio</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/docs`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <DocsIcon size={18} className="text-ink-2" />
                  <span>Docs vault</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/github`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <GithubIcon size={18} className="text-ink-2" />
                  <span>GitHub repository</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/apis`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <ApiHubIcon size={18} className="text-ink-2" />
                  <span>API Hub</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/diagrams`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <DiagramsIcon size={18} className="text-ink-2" />
                  <span>Diagram studio</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/pitch/deck`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <PitchDeckIcon size={18} className="text-ink-2" />
                  <span>Pitch deck</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/pitch/rehearse`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <RehearseIcon size={18} className="text-ink-2" />
                  <span>Rehearse & timing</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/pitch/qa`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <QaIcon size={18} className="text-ink-2" />
                  <span>Q&A judge simulator</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/demo`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <DemoIcon size={18} className="text-ink-2" />
                  <span>Video demo studio</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/submission`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <SubmissionIcon size={18} className="text-ink-2" />
                  <span>Submission locker</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/readiness`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <ReadinessIcon size={18} className="text-ink-2" />
                  <span>Readiness audit</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/retro`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <RetroIcon size={18} className="text-ink-2" />
                  <span>Retro & portfolio</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator className="my-1.5" />
            </>
          )}

          {/* 3. Global Navigation */}
          <CommandGroup heading="Go to">
            <CommandItem
              onSelect={() => handleSelect(() => navigate('/app/home'))}
              className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
            >
              <HomeIcon size={18} className="text-ink-2" />
              <span>Home</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect(() => navigate('/app/rooms'))}
              className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
            >
              <MyRoomsIcon size={18} className="text-ink-2" />
              <span>My rooms</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect(() => navigate('/app/playbooks'))}
              className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
            >
              <PlaybooksIcon size={18} className="text-ink-2" />
              <span>Playbooks</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect(() => navigate('/app/tools'))}
              className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
            >
              <ToolDirectoryIcon size={18} className="text-ink-2" />
              <span>Tool directory</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect(() => navigate('/app/portfolio'))}
              className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
            >
              <PortfolioIcon size={18} className="text-ink-2" />
              <span>Portfolio</span>
            </CommandItem>

            <CommandItem
              onSelect={() => handleSelect(() => navigate('/app/settings'))}
              className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
            >
              <SettingsIcon size={18} className="text-ink-2" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

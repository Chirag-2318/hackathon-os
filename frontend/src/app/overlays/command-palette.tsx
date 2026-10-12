import { useNavigate, useLocation } from 'react-router-dom';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { useOverlay } from '@/app/providers/overlay-store';
import { isModuleHidden } from '@/config/featureFlags';
import { IssueTypeIcon, StatusLozenge } from '@/features/build/ui';
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

import * as React from 'react';
import { apiFetch } from '@/api/client';
import { FileText, BookOpen, Layers } from 'lucide-react';

export function CommandPaletteOverlay() {
  const { isOpen, open, close, toggle } = useOverlay('command-palette');
  const createRoomModal = useOverlay('create-room-dialog');
  const joinCodeModal = useOverlay('join-code-dialog');
  const inviteModal = useOverlay('invite-dialog');

  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any>(null);

  // Extract roomId if inside a room route
  const roomMatch = location.pathname.match(/\/app\/room\/([^/]+)/);
  const roomId = roomMatch ? roomMatch[1] : null;

  React.useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<any>(`/api/v1/search?q=${encodeURIComponent(query)}&roomId=${roomId || ''}`);
        setSearchResults(res);
      } catch {
        setSearchResults(null);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, roomId]);

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
        if (!isOpenState) {
          setQuery('');
          setSearchResults(null);
          close();
        } else open();
      }}
      title="Command palette"
      description="Search tasks, docs, rules, or jump to any page"
      className="sm:max-w-[640px] rounded-[24px] overflow-hidden p-0 bg-card border border-border shadow-2xl font-[var(--font-inter)] z-50"
    >
      <Command className="rounded-[24px]">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search tasks, docs, rules, or type a page..."
        />
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
                {!isModuleHidden('prep') && (
                  <CommandItem
                    onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/prep`))}
                    className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                  >
                    <PrepIcon size={18} className="text-ink-2" />
                    <span>Pre-hackathon prep</span>
                  </CommandItem>
                )}
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
                {!isModuleHidden('crowd-check') && (
                  <CommandItem
                    onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/crowd-check`))}
                    className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                  >
                    <CrowdCheckIcon size={18} className="text-ink-2" />
                    <span>Crowd check</span>
                  </CommandItem>
                )}
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
                {!isModuleHidden('schedule') && (
                  <CommandItem
                    onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/schedule`))}
                    className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                  >
                    <ScheduleIcon size={18} className="text-ink-2" />
                    <span>Schedule & checkpoints</span>
                  </CommandItem>
                )}
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
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/deck`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <PitchDeckIcon size={18} className="text-ink-2" />
                  <span>Deck</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/pitch-kit`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <RehearseIcon size={18} className="text-ink-2" />
                  <span>Pitch kit</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => handleSelect(() => navigate(`/app/room/${roomId}/submission`))}
                  className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                >
                  <SubmissionIcon size={18} className="text-ink-2" />
                  <span>Submission</span>
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

              {/* Search results: Tasks, Docs, Rules, Rooms */}
              {searchResults?.tasks && searchResults.tasks.length > 0 && (
                <>
                  <CommandGroup heading="Tasks">
                    {searchResults.tasks.slice(0, 15).map((t: any) => (
                      <CommandItem
                        key={t.key}
                        value={`${t.key} ${t.summary}`}
                        onSelect={() => handleSelect(() => navigate(`/app/room/${t.roomId}/board?task=${t.key}`))}
                        className="h-10 px-3 rounded-[var(--r-control)] flex items-center justify-between gap-3 cursor-pointer text-sm font-medium"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <IssueTypeIcon type="task" isDone={t.status === 'done'} />
                          <span className="font-mono text-xs text-muted-foreground shrink-0">{t.key}</span>
                          <span className="truncate">{t.summary}</span>
                        </div>
                        <StatusLozenge status={t.status} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator className="my-1.5" />
                </>
              )}

              {searchResults?.docs && searchResults.docs.length > 0 && (
                <>
                  <CommandGroup heading="Docs">
                    {searchResults.docs.slice(0, 10).map((d: any) => (
                      <CommandItem
                        key={d.fileName}
                        value={`${d.title} ${d.fileName}`}
                        onSelect={() => handleSelect(() => navigate(`/app/room/${d.roomId}/docs`))}
                        className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                      >
                        <FileText className="size-4 text-blue-500 shrink-0" />
                        <span className="truncate">{d.title || d.fileName}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator className="my-1.5" />
                </>
              )}

              {searchResults?.rules && searchResults.rules.length > 0 && (
                <>
                  <CommandGroup heading="Rules & Rubric">
                    {searchResults.rules.slice(0, 5).map((r: any, idx: number) => (
                      <CommandItem
                        key={idx}
                        value={`${r.field} ${r.snippet}`}
                        onSelect={() => handleSelect(() => navigate(`/app/room/${r.roomId}/brief`))}
                        className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                      >
                        <BookOpen className="size-4 text-purple-500 shrink-0" />
                        <span className="truncate"><strong className="capitalize">{r.field}:</strong> {r.snippet}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator className="my-1.5" />
                </>
              )}

              {searchResults?.rooms && searchResults.rooms.length > 0 && (
                <>
                  <CommandGroup heading="Rooms">
                    {searchResults.rooms.slice(0, 5).map((rm: any) => (
                      <CommandItem
                        key={rm.id}
                        value={rm.name}
                        onSelect={() => handleSelect(() => navigate(`/app/room/${rm.id}/overview`))}
                        className="h-10 px-3 rounded-[var(--r-control)] flex items-center gap-3 cursor-pointer text-sm font-medium"
                      >
                        <Layers className="size-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{rm.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator className="my-1.5" />
                </>
              )}
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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  PlusCircle,
  Hash,
  FileText,
  CheckSquare,
  Settings,
  FolderOpen,
  Copy,
} from 'lucide-react';
import { toast } from './toast';

export interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  activeRoomId?: string;
  activeRoomCode?: string;
}

/**
 * Command palette activated via Ctrl/Cmd+K or search bar click.
 * Fully keyboard driven with grouped sections and instant action triggers.
 */
export function CommandPalette({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  activeRoomId,
  activeRoomCode,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const navigate = useNavigate();

  const isControlled = typeof externalOpen === 'boolean';
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (externalOnOpenChange) externalOnOpenChange(val);
    if (!isControlled) setInternalOpen(val);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Menu"
      description="Type a command or search..."
      className="max-w-xl rounded-[12px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
    >
      <CommandInput placeholder="Type a command or search rooms, tasks, docs..." />
      <CommandList className="max-h-80 p-2 text-xs">
        <CommandEmpty className="py-6 text-center text-xs text-zinc-500">
          No results found.
        </CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => runCommand(() => navigate('/rooms/new'))}
            className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Create new room</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate('/join'))}
            className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] cursor-pointer"
          >
            <Hash className="w-4 h-4 text-emerald-600" />
            <span>Join room with code</span>
          </CommandItem>

          {activeRoomCode && (
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  navigator.clipboard.writeText(activeRoomCode);
                  toast.success(`Copied room code: ${activeRoomCode}`);
                })
              }
              className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] cursor-pointer"
            >
              <Copy className="w-4 h-4 text-zinc-600" />
              <span>Copy room code ({activeRoomCode})</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => navigate('/'))}
            className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] cursor-pointer"
          >
            <Home className="w-4 h-4 text-zinc-500" />
            <span>Home</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate('/rooms'))}
            className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-zinc-500" />
            <span>My Rooms</span>
          </CommandItem>

          {activeRoomId && (
            <>
              <CommandItem
                onSelect={() => runCommand(() => navigate(`/rooms/${activeRoomId}/board`))}
                className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                <span>Current Room Board</span>
              </CommandItem>

              <CommandItem
                onSelect={() => runCommand(() => navigate(`/rooms/${activeRoomId}/docs`))}
                className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Current Room Docs</span>
              </CommandItem>
            </>
          )}

          <CommandItem
            onSelect={() => runCommand(() => navigate('/settings'))}
            className="flex items-center gap-2 px-2.5 py-2 rounded-[6px] cursor-pointer"
          >
            <Settings className="w-4 h-4 text-zinc-500" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Command Palette — C26
 * Source: design.md §4 C26, PRD §4.1
 *
 * Trigger: Ctrl+K or search pill click.
 * T0 motion: ≤100ms opacity fade, no scale (frequency tier overrides generic overlay).
 * 640px centered dialog. Content stubbed.
 */
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { useOverlay } from '@/app/providers/overlay-store';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
} from '@/components/ui/command';

export function CommandPaletteOverlay() {
  const { isOpen, open, close, toggle } = useOverlay('command-palette');

  // Ctrl+K to toggle
  useKeyboardShortcut({
    key: 'k',
    ctrlOrMeta: true,
    handler: toggle,
  });

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(isOpenState) => {
        if (!isOpenState) close();
        else open();
      }}
      title="Command palette"
      description="Search tasks, docs, rules, or run actions"
      className="sm:max-w-[640px]"
    >
      <Command>
        <CommandInput placeholder="Search tasks, docs, rules..." />
        <CommandList>
          <CommandEmpty>
            <div className="py-8 text-center">
              <p className="text-body text-ink-muted">
                Search is not yet available.
              </p>
              <p className="text-caption text-ink-disabled mt-1">
                Content arrives in a later phase.
              </p>
            </div>
          </CommandEmpty>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { roomApi } from './api';
import { invitePath } from '@/shared/constants/routes';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { InviteIcon, CopyLinkIcon } from '@/components/icons';
import { Check, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvitePopoverProps {
  roomId: string;
  trigger?: React.ReactNode;
}

export function InvitePopover({ roomId, trigger }: InvitePopoverProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const { mutate: generateInvite, isPending } = useMutation({
    mutationFn: () => roomApi.createInvite(roomId),
    onSuccess: (data) => {
      const link = `${window.location.origin}${invitePath(data.token)}`;
      setInviteUrl(link);
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && !inviteUrl && roomId) {
      generateInvite();
    }
  };

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button
            type="button"
            className="group btn-icon size-7 rounded-md flex items-center justify-center text-ink-2 hover:bg-hover hover:text-ink transition-colors cursor-pointer"
            aria-label="Invite teammates"
            title="Invite teammates"
          >
            <InviteIcon size={16} />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] p-4 rounded-[20px] bg-card border border-border shadow-lg font-[var(--font-inter)] z-50"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <InviteIcon size={14} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink">Invite teammates</h4>
              <p className="text-[11px] text-ink-2">Anyone with this link can join your room</p>
            </div>
          </div>

          {/* Link box & Copy Button */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-surface border border-border">
            <input
              type="text"
              readOnly
              value={isPending ? 'Generating invite link…' : inviteUrl ?? 'Ready to invite'}
              className="flex-1 bg-transparent px-2 text-xs text-ink truncate outline-none select-all"
            />
            <button
              onClick={handleCopy}
              disabled={isPending || !inviteUrl}
              className={cn(
                'group h-7 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0',
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ink text-white hover:bg-ink/85 disabled:opacity-50'
              )}
            >
              {isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : copied ? (
                <>
                  <Check className="size-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <CopyLinkIcon size={13} />
                  <span>Copy link</span>
                </>
              )}
            </button>
          </div>

          {/* Mentor view row per spec */}
          <div className="pt-2 border-t border-border/70 flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-ink-3">Mentor Access</span>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface/50 border border-border/50 text-xs text-ink-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-blue-500" />
                Mentor read-only view
              </span>
              <a
                href="/mentor/demo-token"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Open <ExternalLink className="size-3" />
              </a>
            </div>
            <span className="text-[10px] text-ink-3 italic">
              * Dedicated mentor token source requires backend support
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

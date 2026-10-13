import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Loader2 } from 'lucide-react';
import { getRoomCover } from '@/shared/utils/room-cover';
import { useOverlay } from '@/app/providers/overlay-store';
import { apiFetch } from '@/api/client';
import { toast } from 'sonner';

interface ResumeData {
  id: string;
  name: string;
  cover?: string;
  type?: string;
  nextStep?: {
    label?: string;
    route?: string;
  } | null;
}

interface HomeActionRowProps {
  resume?: ResumeData | null;
}

export function HomeActionRow({ resume }: HomeActionRowProps) {
  const navigate = useNavigate();
  const createRoomModal = useOverlay('create-room-dialog');

  const [code, setCode] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const roomCover = React.useMemo(() => {
    return resume?.id ? getRoomCover(resume.id) : null;
  }, [resume?.id]);

  const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(raw);
    setErrorMessage(null);

    if (raw.length === 8 && !submitting) {
      setSubmitting(true);
      try {
        const res = await apiFetch<{ roomId: string; roomName?: string }>('/api/v1/rooms/join', {
          method: 'POST',
          body: JSON.stringify({ code: raw }),
        });
        if (res?.roomId) {
          toast.success(res.roomName ? `Joined ${res.roomName}` : 'Joined room');
          navigate(`/app/room/${res.roomId}/overview`);
        } else {
          setErrorMessage('Invalid code');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Invalid code');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const resumeRoute = resume?.nextStep?.route || (resume?.id ? `/app/room/${resume.id}/overview` : '#');
  const nextStepLabel = resume?.nextStep?.label || 'Resume workspace';

  return (
    <div className="w-full min-h-[52px] py-1 border-y border-black/[0.08] dark:border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left: Resume item */}
      {resume ? (
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="size-8 rounded-[6px] shrink-0 border border-black/[0.08] dark:border-white/[0.08]"
            style={{
              background: roomCover?.gradient || 'var(--color-home-tray, #EFEFEF)',
            }}
          />
          <div className="flex items-baseline gap-2 min-w-0 truncate">
            <span className="text-[14px] font-medium text-foreground truncate">
              {resume.name}
            </span>
            <span className="text-[13px] text-muted-foreground truncate hidden sm:inline">
              · {nextStepLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate(resumeRoute)}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[8px] text-[13px] font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150 shrink-0 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="size-3.5 stroke-[1.5]" />
          </button>
        </div>
      ) : (
        <div className="text-[13px] text-muted-foreground">
          No recent room to resume.
        </div>
      )}

      {/* Right: Join with code + Create room */}
      <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
        <div className="relative flex items-center">
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="JOIN CODE"
            maxLength={8}
            disabled={submitting}
            className="h-8 w-28 px-2 rounded-[8px] border border-black/[0.08] dark:border-white/[0.08] bg-transparent text-[13px] font-mono tracking-widest text-center text-foreground placeholder:text-muted-foreground placeholder:tracking-normal focus-visible:outline-none focus-visible:border-foreground uppercase tabular-nums transition-colors"
          />
          {submitting && (
            <div className="absolute right-2 flex items-center">
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
          {errorMessage && (
            <span className="absolute -bottom-4 left-0 text-[11px] text-red-500 whitespace-nowrap">
              {errorMessage}
            </span>
          )}
        </div>

        <button
          type="button"
          data-tour="create-room"
          onClick={() => createRoomModal.open()}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-foreground text-background text-[13px] font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-150 cursor-pointer shrink-0"
        >
          <Plus className="size-3.5 stroke-[2]" />
          <span>Create room</span>
        </button>
      </div>
    </div>
  );
}

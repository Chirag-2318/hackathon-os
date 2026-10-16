import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/design/api';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { UserAvatar } from '@/components/ui/user-avatar';

interface TokenInvitePreviewDto {
  roomName: string;
  templateName: string;
  duration: string;
  inviterUsername: string;
  inviterDisplayName: string;
  inviterAvatarUrl: string;
  memberCount: number;
  memberCap: number;
  expiresAt: string;
}

interface JoinInviteResponse {
  roomId: string;
}

export function JoinInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState<string>(() => {
    if (tokenFromUrl) {
      sessionStorage.setItem('pending_invite_token', tokenFromUrl);
      return tokenFromUrl;
    }
    return sessionStorage.getItem('pending_invite_token') || '';
  });

  useEffect(() => {
    if (tokenFromUrl && tokenFromUrl !== token) {
      setToken(tokenFromUrl);
      sessionStorage.setItem('pending_invite_token', tokenFromUrl);
    }
  }, [tokenFromUrl, token]);

  const { data: user, isLoading: isAuthLoading } = useCurrentUser();

  const { data: capacity } = useQuery<{ open: boolean; spotsLeft: number | null }>({
    queryKey: ['public-capacity'],
    queryFn: () => apiFetch<{ open: boolean; spotsLeft: number | null }>('/api/v1/public/capacity'),
    staleTime: 30000,
  });

  const {
    data: preview,
    isLoading: isPreviewLoading,
    isError,
  } = useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () =>
      apiFetch<TokenInvitePreviewDto>(`/api/v1/invites/preview?token=${encodeURIComponent(token)}`),
    enabled: Boolean(token),
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: (acceptToken: string) =>
      apiFetch<JoinInviteResponse>('/api/v1/invites/accept', {
        method: 'POST',
        body: JSON.stringify({ token: acceptToken }),
      }),
    onSuccess: (data) => {
      sessionStorage.removeItem('pending_invite_token');
      toast.success(preview?.roomName ? `Joined ${preview.roomName}` : 'Joined room');
      navigate(`/app/room/${data.roomId}/overview`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to join room');
    },
  });

  const handleAction = () => {
    if (!token) return;

    if (!user) {
      if (capacity && !capacity.open) {
        const reason = capacity.spotsLeft === 0 ? 'capacity' : 'closed';
        navigate(`/full?reason=${reason}`);
        return;
      }
      sessionStorage.setItem('pending_invite_token', token);
      navigate('/signin');
      return;
    }

    if (!user.onboardingCompleted) {
      sessionStorage.setItem('pending_invite_token', token);
      navigate('/onboarding');
      return;
    }

    acceptMutation.mutate(token);
  };

  const isExpired = preview ? new Date(preview.expiresAt).getTime() < Date.now() : false;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#070708] text-[#F4F1EA] select-none">
      {/* Loading State */}
      {(isPreviewLoading || isAuthLoading) && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-neutral-400" />
          <span className="text-xs font-mono text-neutral-500">Checking invite...</span>
        </div>
      )}

      {/* Invalid / Expired State */}
      {!isPreviewLoading && (isError || !token || !preview || isExpired) && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.16 }}
          className="bg-[#070708] border border-white/[0.08] rounded-[20px] max-w-[460px] w-full p-8 text-center flex flex-col items-center shadow-2xl"
          style={{
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          <p className="text-[15px] text-neutral-300 font-normal leading-relaxed mb-6">
            This invite isn't valid anymore. Ask the leader to send a new one.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="h-10 px-6 rounded-xl bg-[#F4F1EA] hover:bg-white text-neutral-950 font-semibold text-sm transition-all cursor-pointer shadow-md active:scale-[0.98]"
          >
            Go to Home
          </button>
        </motion.div>
      )}

      {/* Valid Invite Card */}
      {!isPreviewLoading && !isError && preview && !isExpired && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.16 }}
          className="bg-[#070708] border border-white/[0.08] rounded-[20px] max-w-[460px] w-full p-8 text-center flex flex-col items-center shadow-2xl"
          style={{
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {/* Inviter header */}
          <div className="flex items-center gap-2.5 mb-2">
            <UserAvatar
              user={{
                displayName: preview.inviterDisplayName,
                username: preview.inviterUsername,
                avatarUrl: preview.inviterAvatarUrl,
              }}
              size={36}
            />
            <span className="text-sm text-neutral-300 font-medium">
              @{preview.inviterUsername || preview.inviterDisplayName || 'Leader'} invited you to
            </span>
          </div>

          {/* Room Name */}
          <h1
            className="text-[32px] text-[#F4F1EA] font-normal leading-[1.15] tracking-tight mt-2 mb-1"
            style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
          >
            {preview.roomName}
          </h1>

          {/* Details in Mono */}
          <div
            className="text-xs text-neutral-400 font-mono tracking-wide mt-1.5"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            {preview.templateName || 'Hackathon'} · {preview.duration || '36h'} · {preview.memberCount} of{' '}
            {preview.memberCap || 6} seats filled
          </div>

          {/* Expiry */}
          <div
            className="text-[11px] text-neutral-500 font-mono mt-1 mb-7"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            Valid until{' '}
            {new Date(preview.expiresAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={handleAction}
            disabled={acceptMutation.isPending}
            className="w-full h-11 rounded-xl bg-[#F4F1EA] hover:bg-white text-neutral-950 font-semibold text-sm transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
          >
            {acceptMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : !user ? (
              'Sign in to join'
            ) : (
              'Join room'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-3.5 text-xs text-neutral-400 hover:text-[#F4F1EA] transition-colors cursor-pointer py-1"
          >
            Not now
          </button>
        </motion.div>
      )}
    </div>
  );
}

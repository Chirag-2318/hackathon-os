import React, { useState } from 'react';
import { Globe, Link as LinkIcon, Plus, Check, Copy, Download, Edit3, X, Eye, EyeOff } from 'lucide-react';
import { getPresetAvatarUrl } from '@/features/onboarding/preset-avatars';
import type { UserProfileDto, PortfolioSettingsDto, UpdateSettingsRequest } from '../types';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface IdentityHeroProps {
  profile: UserProfileDto;
  settings: PortfolioSettingsDto;
  isOwner: boolean;
  onUpdateBio?: (bio: string) => Promise<void>;
  onUpdateSettings?: (settings: Partial<UpdateSettingsRequest>) => Promise<void>;
  onExport?: () => void;
}

export const IdentityHero: React.FC<IdentityHeroProps> = ({
  profile,
  settings,
  isOwner,
  onUpdateBio,
  onUpdateSettings,
  onExport,
}) => {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(profile.bio || '');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const handleSaveBio = async () => {
    if (!onUpdateBio) return;
    setSavingBio(true);
    try {
      await onUpdateBio(bioInput);
      setIsEditingBio(false);
    } finally {
      setSavingBio(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim() || !onUpdateSettings) return;
    const current = settings.customLinks || [];
    const updated = [...current, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }];
    await onUpdateSettings({ customLinks: updated });
    setNewLinkLabel('');
    setNewLinkUrl('');
    setIsAddingLink(false);
  };

  const handleRemoveLink = async (index: number) => {
    if (!onUpdateSettings) return;
    const current = settings.customLinks || [];
    const updated = current.filter((_, i) => i !== index);
    await onUpdateSettings({ customLinks: updated });
  };

  const handleCopyLink = () => {
    const slug = profile.username || profile.githubLogin || profile.id;
    const url = `${window.location.origin}/u/${encodeURIComponent(slug)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = async () => {
    if (!onUpdateSettings) return;
    await onUpdateSettings({ isPublic: !settings.isPublic });
  };

  const joinDate = profile.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '2026';

  const avatarSrc = profile.avatarUrl || (profile.avatarPreset ? getPresetAvatarUrl(profile.avatarPreset) : null);

  return (
    <section className="relative border-b border-border bg-transparent pb-7 pt-4 px-4 sm:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        {/* Left: Avatar & Profile Info */}
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="relative shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={profile.name}
                className="h-24 w-24 rounded-full ring-1 ring-border bg-surface object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full ring-1 ring-border bg-surface text-2xl font-display font-medium text-foreground">
                {(profile.name || profile.username || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[9px] font-mono uppercase text-muted-foreground">
              Pass
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[36px] font-display font-normal tracking-tight text-foreground leading-tight">
                {profile.name}
              </h1>
              <span className="font-mono text-xs text-muted-foreground">
                @{profile.username || profile.githubLogin || 'builder'}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="font-mono text-xs text-muted-foreground">Joined {joinDate}</span>
            </div>

            {/* Rule-based Builder Line / one-line status */}
            {profile.builderLine && (
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{profile.builderLine}</span>
              </div>
            )}

            {/* Inline Editable Bio */}
            <div className="pt-1">
              {isEditingBio ? (
                <div className="flex items-center gap-2 max-w-lg">
                  <input
                    type="text"
                    maxLength={140}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="One-line bio..."
                    className="flex-1 rounded-[8px] border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:border-border focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveBio();
                      if (e.key === 'Escape') setIsEditingBio(false);
                    }}
                  />
                  <button
                    onClick={handleSaveBio}
                    disabled={savingBio}
                    className="rounded-[8px] border border-border bg-surface p-1 text-foreground hover:bg-hover"
                    title="Save"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingBio(false)}
                    className="rounded-[8px] border border-border bg-surface p-1 text-muted-foreground hover:text-foreground"
                    title="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  {profile.bio ? (
                    <span className="text-foreground">{profile.bio}</span>
                  ) : isOwner ? (
                    <span className="italic text-muted-foreground">No bio added yet</span>
                  ) : null}
                  {isOwner && (
                    <button
                      onClick={() => {
                        setBioInput(profile.bio || '');
                        setIsEditingBio(true);
                      }}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground hover:underline cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>{profile.bio ? 'Edit bio' : 'Add bio'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Links chips as plain bordered 8px-radius buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              {profile.githubLogin && (
                <a
                  href={`https://github.com/${profile.githubLogin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-2.5 py-1 text-xs text-foreground hover:bg-hover transition-colors"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  <span>github/{profile.githubLogin}</span>
                </a>
              )}

              {settings.customLinks?.map((link, idx) => (
                <div
                  key={idx}
                  className="group inline-flex items-center gap-1 rounded-[8px] border border-border bg-surface px-2.5 py-1 text-xs text-foreground hover:bg-hover transition-colors"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-foreground"
                  >
                    <Globe className="h-3 w-3" />
                    <span>{link.label}</span>
                  </a>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveLink(idx)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity ml-1"
                      title="Remove link"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}

              {isOwner && !isAddingLink && (
                <button
                  onClick={() => setIsAddingLink(true)}
                  className="inline-flex items-center gap-1 rounded-[8px] border border-dashed border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-hover transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Link</span>
                </button>
              )}

              {isOwner && isAddingLink && (
                <div className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface p-1">
                  <input
                    type="text"
                    placeholder="Label"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    className="w-20 rounded-[6px] border border-border bg-page px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="w-32 rounded-[6px] border border-border bg-page px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                  />
                  <button
                    onClick={handleAddLink}
                    className="rounded-[6px] border border-border bg-surface p-1 text-foreground hover:bg-hover"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setIsAddingLink(false)}
                    className="rounded-[6px] border border-border bg-surface p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions are secondary buttons (surface token, border token, text token) */}
        {isOwner && (
          <div className="flex flex-wrap items-center gap-2 md:self-start">
            <button
              onClick={handleTogglePublic}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-xs font-mono text-foreground hover:bg-hover transition-colors cursor-pointer"
              title={settings.isPublic ? 'Publicly accessible' : 'Only visible to you'}
            >
              {settings.isPublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span>{settings.isPublic ? 'Public' : 'Private'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-xs font-mono text-foreground hover:bg-hover transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Share Link'}</span>
            </button>

            {onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-xs font-mono text-foreground hover:bg-hover transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

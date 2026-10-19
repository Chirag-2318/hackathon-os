import React from 'react';
import { X, Printer, Check, Download } from 'lucide-react';
import { getPresetAvatarUrl } from '@/features/onboarding/preset-avatars';
import type { FullPortfolioResponse } from '../types';

interface PortfolioExportModalProps {
  data: FullPortfolioResponse;
  onClose: () => void;
}

export const PortfolioExportModal: React.FC<PortfolioExportModalProps> = ({ data, onClose }) => {
  const { profile, stats, featuredProjects } = data;

  const avatarSrc = profile.avatarUrl || (profile.avatarPreset ? getPresetAvatarUrl(profile.avatarPreset) : null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--backdrop-fallback,#0a0a0b80)] backdrop-blur-[3px] supports-[backdrop-filter]:bg-[var(--backdrop)] p-4 animate-in fade-in duration-150"
      style={{
        backdropFilter: 'var(--backdrop-blur, blur(3px))',
        WebkitBackdropFilter: 'var(--backdrop-blur, blur(3px))',
      }}
    >
      <div className="relative w-full max-w-2xl rounded-[16px] border border-border bg-card text-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface">
          <div>
            <h3 className="text-base font-semibold text-foreground">Export Builder Passport Card</h3>
            <p className="text-xs text-muted-foreground">Print or save as high-resolution PDF</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <div
            id="portfolio-print-card"
            className="rounded-lg border border-border bg-card p-6 text-foreground space-y-5 print:border-none print:shadow-none"
          >
            {/* Passport Card Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-4">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={profile.name}
                    className="h-14 w-14 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground font-bold text-lg">
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{profile.name}</h2>
                  <div className="font-mono text-xs text-muted-foreground">@{profile.username}</div>
                  {profile.builderLine && (
                    <div className="mt-1 font-mono text-xs text-emerald-600 dark:text-emerald-400">{profile.builderLine}</div>
                  )}
                </div>
              </div>

              <div className="text-right font-mono text-[10px] text-muted-foreground tracking-widest border border-border px-2 py-1 rounded bg-muted/50">
                [brackit] Passport
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2 border-b border-border pb-4 text-center font-mono">
              <div>
                <div className="text-xl font-bold text-foreground">{stats.hackathonsJoined}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Hackathons</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.projectsShipped}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Shipped</div>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{stats.tasksCompleted}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Tasks Done</div>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{stats.teamsLed}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Teams Led</div>
              </div>
            </div>

            {/* Featured Projects Highlight */}
            {featuredProjects.length > 0 && (
              <div className="space-y-2">
                <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                  Featured Projects
                </div>
                <div className="space-y-2">
                  {featuredProjects.map((p) => (
                    <div
                      key={p.roomId}
                      className="rounded border border-border bg-surface p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground">{p.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{p.dates}</span>
                      </div>
                      {p.pitch && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.pitch}</p>
                      )}
                      <div className="flex flex-wrap gap-1 pt-1 font-mono text-[10px] text-muted-foreground">
                        {p.techStack.slice(0, 5).join(' • ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card Footer */}
            <div className="border-t border-border pt-3 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>Verified builder passport on [brackit]</span>
              <span>{window.location.host}/u/{profile.username}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-3 bg-surface">
          <button
            onClick={onClose}
            className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-foreground hover:bg-hover transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

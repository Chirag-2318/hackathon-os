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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/60">
          <div>
            <h3 className="text-base font-semibold text-neutral-100">Export Builder Passport Card</h3>
            <p className="text-xs text-neutral-400">Print or save as high-resolution PDF</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <div
            id="portfolio-print-card"
            className="rounded-lg border border-neutral-700 bg-neutral-950 p-6 text-neutral-100 space-y-5"
          >
            {/* Passport Card Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-4">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={profile.name}
                    className="h-14 w-14 rounded-full border border-neutral-700 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 font-bold text-lg">
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold tracking-tight">{profile.name}</h2>
                  <div className="font-mono text-xs text-neutral-400">@{profile.username}</div>
                  {profile.builderLine && (
                    <div className="mt-1 font-mono text-xs text-emerald-400">{profile.builderLine}</div>
                  )}
                </div>
              </div>

              <div className="text-right font-mono text-[10px] text-neutral-400 uppercase tracking-widest border border-neutral-800 px-2 py-1 rounded bg-neutral-900">
                Hackathon OS Passport
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2 border-b border-neutral-800 pb-4 text-center font-mono">
              <div>
                <div className="text-xl font-bold text-neutral-100">{stats.hackathonsJoined}</div>
                <div className="text-[10px] text-neutral-400 uppercase">Hackathons</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-400">{stats.projectsShipped}</div>
                <div className="text-[10px] text-neutral-400 uppercase">Shipped</div>
              </div>
              <div>
                <div className="text-xl font-bold text-neutral-100">{stats.tasksCompleted}</div>
                <div className="text-[10px] text-neutral-400 uppercase">Tasks Done</div>
              </div>
              <div>
                <div className="text-xl font-bold text-neutral-100">{stats.teamsLed}</div>
                <div className="text-[10px] text-neutral-400 uppercase">Teams Led</div>
              </div>
            </div>

            {/* Featured Projects Highlight */}
            {featuredProjects.length > 0 && (
              <div className="space-y-2">
                <div className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  Featured Projects
                </div>
                <div className="space-y-2">
                  {featuredProjects.map((p) => (
                    <div
                      key={p.roomId}
                      className="rounded border border-neutral-800/80 bg-neutral-900/40 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-neutral-200">{p.name}</span>
                        <span className="font-mono text-[10px] text-neutral-400">{p.dates}</span>
                      </div>
                      {p.pitch && (
                        <p className="text-xs text-neutral-400 line-clamp-2">{p.pitch}</p>
                      )}
                      <div className="flex flex-wrap gap-1 pt-1 font-mono text-[10px] text-neutral-400">
                        {p.techStack.slice(0, 5).join(' • ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card Footer */}
            <div className="border-t border-neutral-800 pt-3 flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>Verified builder passport on Hackathon OS</span>
              <span>{window.location.host}/u/{profile.username}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-800 px-6 py-3 bg-neutral-950/60">
          <button
            onClick={onClose}
            className="rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-white"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

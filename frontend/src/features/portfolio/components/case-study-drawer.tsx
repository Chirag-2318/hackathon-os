import React, { useEffect } from 'react';
import { X, ExternalLink, Video, FileText, CheckCircle2, Award, Users, GitCommit } from 'lucide-react';
import type { ProjectCardDto, PassportStampDto } from '../types';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface CaseStudyDrawerProps {
  project: ProjectCardDto | PassportStampDto | null;
  onClose: () => void;
}

export const CaseStudyDrawer: React.FC<CaseStudyDrawerProps> = ({ project, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (project) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  const { caseStudy, name, role, dates } = project;
  const isLeader = role?.toUpperCase() === 'LEADER';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-neutral-900 border-l border-neutral-800 shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/95 px-6 py-4 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                isLeader ? 'bg-amber-950/40 text-amber-400 border border-amber-800/60' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {role}
              </span>
              <span className="text-xs text-neutral-500 font-mono">{dates}</span>
            </div>
            <h2 className="text-xl font-semibold text-neutral-100 mt-1">{name}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
            title="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="space-y-6 px-6 py-5 text-sm text-neutral-300">
          {/* Quick Links Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {caseStudy.links.demoUrl && (
              <a
                href={caseStudy.links.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 text-xs text-neutral-200 hover:bg-neutral-700 transition-colors"
              >
                <Video className="h-3.5 w-3.5 text-indigo-400" />
                <span>Demo Video</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
            {caseStudy.links.repoUrl && (
              <a
                href={caseStudy.links.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 text-xs text-neutral-200 hover:bg-neutral-700 transition-colors"
              >
                <GithubIcon className="h-3.5 w-3.5" />
                <span>Repository</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
            {caseStudy.links.deckUrl && (
              <a
                href={caseStudy.links.deckUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 text-xs text-neutral-200 hover:bg-neutral-700 transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-amber-400" />
                <span>Slide Deck</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
            {caseStudy.links.submissionUrl && (
              <a
                href={caseStudy.links.submissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 text-xs text-neutral-200 hover:bg-neutral-700 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Submission</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            )}
          </div>

          {/* Section: Problem */}
          {caseStudy.problem && (
            <div className="space-y-1.5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-neutral-400">Problem</h3>
              <p className="text-sm leading-relaxed text-neutral-200 whitespace-pre-line bg-neutral-950/40 p-3 rounded border border-neutral-800/80">
                {caseStudy.problem}
              </p>
            </div>
          )}

          {/* Section: What We Built (MVP) */}
          {caseStudy.whatWeBuilt && caseStudy.whatWeBuilt !== caseStudy.problem && (
            <div className="space-y-1.5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-neutral-400">What We Built (MVP)</h3>
              <p className="text-sm leading-relaxed text-neutral-200 whitespace-pre-line bg-neutral-950/40 p-3 rounded border border-neutral-800/80">
                {caseStudy.whatWeBuilt}
              </p>
            </div>
          )}

          {/* Section: Stack */}
          {caseStudy.techStack && caseStudy.techStack.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-mono text-xs uppercase tracking-wider text-neutral-400">Stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {caseStudy.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded border border-neutral-800 bg-neutral-950 px-2 py-0.5 font-mono text-xs text-neutral-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section: My Contribution */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-neutral-400">My Contribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              <div className="rounded border border-neutral-800 bg-neutral-950/50 p-2.5">
                <div className="text-lg font-mono font-semibold text-neutral-100">
                  {caseStudy.myContribution.tasksCompleted}
                </div>
                <div className="text-[10px] font-mono text-neutral-400 uppercase">Tasks Done</div>
              </div>
              <div className="rounded border border-neutral-800 bg-neutral-950/50 p-2.5">
                <div className="text-lg font-mono font-semibold text-neutral-100">
                  {caseStudy.myContribution.ideasAccepted}
                </div>
                <div className="text-[10px] font-mono text-neutral-400 uppercase">Ideas Validated</div>
              </div>
              {caseStudy.myContribution.commitsCount > 0 && (
                <div className="rounded border border-neutral-800 bg-neutral-950/50 p-2.5">
                  <div className="text-lg font-mono font-semibold text-neutral-100">
                    {caseStudy.myContribution.commitsCount}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">Git Commits</div>
                </div>
              )}
            </div>

            {/* Completed Task Summaries list */}
            {caseStudy.myContribution.taskSummaries.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs text-neutral-400 font-mono">Completed items:</div>
                <ul className="space-y-1 text-xs text-neutral-300 list-disc list-inside">
                  {caseStudy.myContribution.taskSummaries.map((summary, idx) => (
                    <li key={idx} className="leading-snug">{summary}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Section: Team */}
          {caseStudy.team && caseStudy.team.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-mono text-xs uppercase tracking-wider text-neutral-400">Team</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {caseStudy.team.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2.5 rounded border border-neutral-800/80 bg-neutral-950/30 p-2"
                  >
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-semibold text-neutral-200">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-neutral-200">{member.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">@{member.username}</div>
                    </div>
                    {member.role && (
                      <span className="text-[10px] font-mono text-neutral-500">{member.role}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Outcome & Awards */}
          {(caseStudy.outcome || caseStudy.awards.length > 0) && (
            <div className="space-y-2 border-t border-neutral-800 pt-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-neutral-400">Outcome</h3>
              {caseStudy.outcome && (
                <div className="inline-flex items-center gap-2 rounded bg-emerald-950/30 border border-emerald-800/50 px-3 py-1.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{caseStudy.outcome}</span>
                </div>
              )}
              {caseStudy.awards.map((award) => (
                <div key={award.id} className="flex items-center gap-2 text-xs text-amber-300">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span className="font-semibold">{award.name}:</span>
                  <span className="text-neutral-400">{award.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

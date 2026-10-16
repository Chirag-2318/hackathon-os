import React from 'react';
import { Pin, EyeOff, Video, FileText, CheckCircle2, Crown } from 'lucide-react';
import type { ProjectCardDto } from '../types';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-3.5 w-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface FeaturedProjectsProps {
  projects: ProjectCardDto[];
  isOwner: boolean;
  onSelectProject: (project: ProjectCardDto) => void;
  onTogglePin?: (roomId: string, currentPinned: boolean) => Promise<void>;
  onToggleVisibility?: (roomId: string, currentVisible: boolean) => Promise<void>;
}

export const FeaturedProjects: React.FC<FeaturedProjectsProps> = ({
  projects,
  isOwner,
  onSelectProject,
  onTogglePin,
  onToggleVisibility,
}) => {
  if (!projects || projects.length === 0) return null;

  const [heroProject, ...secondaryProjects] = projects;

  return (
    <section className="space-y-4 px-4 sm:px-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-display font-normal tracking-tight text-foreground flex items-center gap-2">
            <span>Featured Case Studies</span>
            <span className="font-mono text-xs text-muted-foreground">({projects.length})</span>
          </h2>
          <p className="text-xs text-muted-foreground">Selected hackathon projects and case studies</p>
        </div>
      </div>

      {/* Asymmetric Layout: 1 Wide Hero + 2 Narrower */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Wide Hero Tile */}
        {heroProject && (
          <div className="lg:col-span-7">
            <ProjectTile
              project={heroProject}
              isHero
              isOwner={isOwner}
              onClick={() => onSelectProject(heroProject)}
              onTogglePin={onTogglePin}
              onToggleVisibility={onToggleVisibility}
            />
          </div>
        )}

        {/* Secondary Tiles Column */}
        {secondaryProjects.length > 0 && (
          <div className="lg:col-span-5 flex flex-col gap-4">
            {secondaryProjects.map((p) => (
              <ProjectTile
                key={p.roomId}
                project={p}
                isHero={false}
                isOwner={isOwner}
                onClick={() => onSelectProject(p)}
                onTogglePin={onTogglePin}
                onToggleVisibility={onToggleVisibility}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

interface ProjectTileProps {
  project: ProjectCardDto;
  isHero: boolean;
  isOwner: boolean;
  onClick: () => void;
  onTogglePin?: (roomId: string, currentPinned: boolean) => Promise<void>;
  onToggleVisibility?: (roomId: string, currentVisible: boolean) => Promise<void>;
}

const ProjectTile: React.FC<ProjectTileProps> = ({
  project,
  isHero,
  isOwner,
  onClick,
  onTogglePin,
  onToggleVisibility,
}) => {
  const isLeader = project.role?.toUpperCase() === 'LEADER';
  const isHidden = !project.visible;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[14px] border border-border bg-surface p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isHidden ? 'opacity-60' : ''
      } ${isHero ? 'min-h-[340px]' : 'min-h-[160px]'}`}
    >
      {/* Top Bar: Event, Dates, Role, Actions */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{project.hackathonName}</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-xs text-muted-foreground">{project.dates}</span>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {isHidden && (
              <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                Hidden
              </span>
            )}

            {isLeader ? (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-amber-500">
                <Crown className="h-3.5 w-3.5" />
                <span>Leader</span>
              </span>
            ) : project.role ? (
              <span className="text-xs font-mono text-muted-foreground">
                {project.role}
              </span>
            ) : null}

            {isOwner && onTogglePin && (
              <button
                onClick={() => onTogglePin(project.roomId, project.pinned)}
                className={`p-1.5 rounded-[6px] hover:bg-hover transition-colors ${
                  project.pinned ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
                }`}
                title={project.pinned ? 'Unpin project' : 'Pin to top'}
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
            )}

            {isOwner && onToggleVisibility && (
              <button
                onClick={() => onToggleVisibility(project.roomId, project.visible)}
                className={`p-1.5 rounded-[6px] hover:bg-hover transition-colors ${
                  !project.visible ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'
                }`}
                title={project.visible ? 'Hide from public' : 'Show on public portfolio'}
              >
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Project Title */}
        <h3 className="font-sans text-[18px] font-medium tracking-tight text-foreground transition-colors mt-1">
          {project.name}
        </h3>

        {/* Pitch / Problem */}
        {project.pitch && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {project.pitch}
          </p>
        )}
      </div>

      {/* Bottom Area: Tech Stack, Team Avatar Stack & Quick Links */}
      <div className="mt-6 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
        {/* Tech Stack tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {project.techStack?.slice(0, isHero ? 6 : 4).map((tech, idx) => (
            <span
              key={idx}
              className="rounded-[6px] bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground border border-border"
            >
              {tech}
            </span>
          ))}
          {project.techStack?.length > (isHero ? 6 : 4) && (
            <span className="text-[10px] font-mono text-muted-foreground">
              +{project.techStack.length - (isHero ? 6 : 4)}
            </span>
          )}
        </div>

        {/* Team Avatars & Quick Links */}
        <div className="flex items-center gap-3">
          {/* Team avatar stack */}
          {project.team && project.team.length > 0 && (
            <div className="flex -space-x-1.5 overflow-hidden">
              {project.team.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-muted overflow-hidden"
                  title={m.name}
                >
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[9px] font-bold text-muted-foreground">
                      {m.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
              {project.team.length > 4 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted ring-2 ring-surface text-[9px] font-mono text-muted-foreground">
                  +{project.team.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Quick link icons */}
          <div className="flex items-center gap-1 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
            {project.links?.videoUrl && (
              <a
                href={project.links.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:text-foreground hover:bg-hover rounded transition-colors"
                title="Demo Video"
              >
                <Video className="h-3.5 w-3.5" />
              </a>
            )}
            {project.links?.repoUrl && (
              <a
                href={project.links.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:text-foreground hover:bg-hover rounded transition-colors"
                title="GitHub Repo"
              >
                <GithubIcon className="h-3.5 w-3.5" />
              </a>
            )}
            {project.links?.deckUrl && (
              <a
                href={project.links.deckUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:text-foreground hover:bg-hover rounded transition-colors"
                title="Pitch Deck"
              >
                <FileText className="h-3.5 w-3.5" />
              </a>
            )}
            {project.links?.submissionUrl && (
              <a
                href={project.links.submissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:text-foreground hover:bg-hover rounded transition-colors"
                title="Submission"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

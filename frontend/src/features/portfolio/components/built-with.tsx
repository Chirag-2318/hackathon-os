import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CollaboratorDto } from '../types';

interface BuiltWithProps {
  collaborators: CollaboratorDto[];
}

export const BuiltWith: React.FC<BuiltWithProps> = ({ collaborators }) => {
  if (!collaborators || collaborators.length === 0) return null;

  return (
    <section className="space-y-4 px-4 sm:px-6 pt-6">
      <div>
        <h2 className="text-[22px] font-display font-normal tracking-tight text-foreground flex items-center gap-2">
          <span>Built With</span>
          <span className="font-mono text-xs text-muted-foreground">({collaborators.length} teammates)</span>
        </h2>
        <p className="text-xs text-muted-foreground">Collaborators and squad members across hackathons</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {collaborators.map((c) => {
          const content = (
            <div
              className={`flex items-center gap-2.5 rounded-full border border-border bg-surface pl-1.5 pr-3.5 py-1 transition-all ${
                c.publicPortfolio ? 'hover:border-border-strong hover:bg-hover cursor-pointer' : ''
              }`}
            >
              {c.avatarUrl ? (
                <img src={c.avatarUrl} alt={c.name} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">{c.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {c.sharedHackathonsCount} {c.sharedHackathonsCount === 1 ? 'hackathon' : 'hackathons'}
                </span>
                {c.publicPortfolio && <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />}
              </div>
            </div>
          );

          if (c.publicPortfolio) {
            return (
              <Link key={c.id} to={`/u/${encodeURIComponent(c.username)}`} title={`View @${c.username}'s passport`}>
                {content}
              </Link>
            );
          }

          return <div key={c.id}>{content}</div>;
        })}
      </div>
    </section>
  );
};

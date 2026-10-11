import * as React from 'react';

import type { IdeateIdea } from '@/api/client';
import { cn } from 'cn';
import { Lock, MessageSquare, Paperclip } from 'lucide-react';
import { Chip } from '@/components/primitives/chip';

interface IdeaCardProps {
  idea: IdeateIdea;
  isRevealed: boolean;
  isAnonymous: boolean;
  className?: string;
  style?: React.CSSProperties;
  index?: number;
}

export const IdeaCard = React.forwardRef<HTMLDivElement, IdeaCardProps>(
  ({ idea, isRevealed, isAnonymous, className, style, index = 0, ...props }, ref) => {
    
    // M04 Idea Reveal Animation logic (staggered delay based on index)
    const revealStyle = isRevealed ? {
      animation: `revealFlip 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms forwards`,
    } : {};

    if (!isRevealed) {
      return (
        <div 
          ref={ref}
          style={{ ...style, ...revealStyle }}
          className={cn(
            "bg-surface-raised border border-border rounded-lg p-6 flex flex-col items-center justify-center min-h-[140px] shadow-sm",
            className
          )}
          {...props}
        >
          <Lock className="size-8 text-ink-muted mb-2" />
          <span className="text-sm font-medium text-ink-muted">Sealed Idea</span>
        </div>
      );
    }

    return (
      <div 
        ref={ref}
        style={{ ...style, ...revealStyle, transformStyle: 'preserve-3d' }}
        className={cn(
          "bg-surface border border-border hover:border-primary/50 transition-colors rounded-lg p-4 flex flex-col gap-3 shadow-sm cursor-grab active:cursor-grabbing",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-ink line-clamp-1 flex-1">{idea.title}</h4>
        </div>
        
        <p className="text-sm text-ink-muted line-clamp-3 leading-relaxed">
          {idea.identitySentence}
        </p>
        
        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {idea.roleNeeds.map((role: any) => (
            <Chip key={role} color="sky" className="text-[10px] py-0.5 px-2">{role}</Chip>
          ))}
        </div>
        
        <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-surface-sunken flex items-center justify-center text-[10px] font-bold text-ink">
              {isAnonymous ? '?' : idea.authorAvatarId}
            </div>
            <span className="text-xs font-medium text-ink-muted">
              {isAnonymous ? 'Anonymous' : idea.authorName}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-ink-muted">
            {idea.attachmentCount > 0 && (
              <div className="flex items-center gap-1 text-xs font-medium">
                <Paperclip className="size-3" />
                <span>{idea.attachmentCount}</span>
              </div>
            )}
            {idea.commentCount > 0 && (
              <div className="flex items-center gap-1 text-xs font-medium">
                <MessageSquare className="size-3" />
                <span>{idea.commentCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
IdeaCard.displayName = 'IdeaCard';

// CSS for reveal animation
// In a real app this would be in index.css, placing it inline for demo
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes revealFlip {
      0% { transform: perspective(400px) rotateY(0deg); opacity: 1; }
      50% { transform: perspective(400px) rotateY(90deg); opacity: 0.5; }
      100% { transform: perspective(400px) rotateY(0deg); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

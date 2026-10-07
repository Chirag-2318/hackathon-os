import * as React from 'react';

import type { IdeateResponse } from '@/api/client';
import { Link, FileText, Quote, CheckCircle2, Circle } from 'lucide-react';
import { cn } from 'cn';

export function ResearchStage({ data }: { data: IdeateResponse }) {
  const [selectedIdeaId, setSelectedIdeaId] = React.useState<string>(data.ideas[0]?.id);

  const selectedIdea = data.ideas.find(i => i.id === selectedIdeaId);
  const attachments = data.attachments.filter(a => a.ideaId === selectedIdeaId);
  const quotes = data.quotes.filter(q => q.ideaId === selectedIdeaId);
  const talkedToRealUser = data.talkedToRealUserCheckboxes[selectedIdeaId] || false;

  return (
    <div className="flex h-full gap-6">
      {/* Left List */}
      <div className="w-1/3 flex flex-col gap-3 overflow-auto pr-2">
        <h2 className="text-xl font-bold mb-2">Research Ideas</h2>
        {data.ideas.map(idea => (
          <div 
            key={idea.id}
            onClick={() => setSelectedIdeaId(idea.id)}
            className={cn(
              "p-4 rounded-lg cursor-pointer transition-colors border",
              selectedIdeaId === idea.id 
                ? "bg-primary/5 border-primary" 
                : "bg-surface-raised border-border hover:border-primary/50"
            )}
          >
            <h4 className="font-semibold text-ink line-clamp-1">{idea.title}</h4>
            <div className="flex gap-4 mt-2 text-xs text-ink-muted">
              <span>{data.attachments.filter(a => a.ideaId === idea.id).length} attachments</span>
              <span>{data.quotes.filter(q => q.ideaId === idea.id).length} quotes</span>
            </div>
          </div>
        ))}
      </div>

      {/* Right Drawer/Panel */}
      {selectedIdea ? (
        <div className="flex-1 bg-surface-raised border border-border rounded-lg p-6 flex flex-col overflow-auto">
          <h3 className="text-2xl font-bold mb-2">{selectedIdea.title}</h3>
          <p className="text-ink-muted mb-8">{selectedIdea.identitySentence}</p>

          <div className="grid grid-cols-2 gap-8">
            {/* Attachments Column */}
            <div>
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Attachments
              </h4>
              <div className="space-y-3">
                {attachments.length > 0 ? attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-3 p-3 bg-surface rounded-md border border-border hover:border-primary/50 cursor-pointer">
                    {att.type === 'link' ? <Link className="size-4 text-ink-muted" /> : <FileText className="size-4 text-ink-muted" />}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{att.title}</p>
                      {att.url && <p className="text-xs text-ink-muted truncate">{att.url}</p>}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-ink-muted">No attachments added.</p>
                )}
                <button className="w-full py-3 border-2 border-dashed border-border rounded-md text-ink-muted hover:border-primary hover:text-primary transition-colors text-sm font-medium">
                  + Add Attachment
                </button>
              </div>
            </div>

            {/* Quotes & User Validation Column */}
            <div>
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Quote className="size-5 text-primary" />
                User Quotes
              </h4>
              <div className="space-y-4 mb-8">
                {quotes.length > 0 ? quotes.map(quote => (
                  <div key={quote.id} className="p-4 bg-surface rounded-md border-l-2 border-primary">
                    <p className="text-sm italic text-ink mb-2">"{quote.text}"</p>
                    <p className="text-xs text-ink-muted">— {quote.source}</p>
                  </div>
                )) : (
                  <p className="text-sm text-ink-muted">No user quotes yet.</p>
                )}
                <button className="w-full py-3 border-2 border-dashed border-border rounded-md text-ink-muted hover:border-primary hover:text-primary transition-colors text-sm font-medium">
                  + Add Quote
                </button>
              </div>

              {/* Talked to a real user checkbox */}
              <div className={cn(
                "p-4 rounded-lg flex items-center gap-3 cursor-pointer border",
                talkedToRealUser ? "bg-success-fill/20 border-success-fill" : "bg-surface border-border"
              )}>
                {talkedToRealUser ? (
                  <CheckCircle2 className="size-5 text-success-fill" />
                ) : (
                  <Circle className="size-5 text-ink-muted" />
                )}
                <span className={cn("font-medium", talkedToRealUser ? "text-success-text" : "text-ink-muted")}>
                  Talked to a real user
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-ink-muted">
          Select an idea to view research
        </div>
      )}
    </div>
  );
}

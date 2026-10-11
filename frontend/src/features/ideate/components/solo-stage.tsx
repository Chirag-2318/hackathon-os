
import type { IdeateResponse } from '@/api/client';
import { Lock } from 'lucide-react';
import { Chip } from '@/components/primitives/chip';

import { useCurrentUser } from '@/features/auth/useCurrentUser';

export function SoloStage({ data }: { data: IdeateResponse }) {
  const { data: user } = useCurrentUser();
  const currentUserId = user?.id ? String(user.id) : undefined;
  const myIdeas = currentUserId
    ? data.ideas.filter((i: any) => String(i.authorId) === currentUserId)
    : data.ideas;

  return (
    <div className="flex h-full gap-6">
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Your ideas</h2>
          <Chip color="sky" className="flex items-center gap-1"><Lock className="size-3" /> Private until reveal</Chip>
        </div>
        <div className="flex-1 overflow-auto space-y-4 pr-2">
          {myIdeas.map((idea: any) => (
            <div 
              key={idea.id} 
              className="p-4 bg-surface-raised border border-primary ring-1 ring-primary/20 rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              <h3 className="font-semibold text-ink">{idea.title}</h3>
              <p className="text-sm text-ink-muted line-clamp-2 mt-1">{idea.identitySentence}</p>
            </div>
          ))}
          <button className="w-full py-4 border-2 border-dashed border-border rounded-lg text-ink-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center font-medium">
            + Draft new idea
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-surface-raised border border-border rounded-lg p-6 flex flex-col">
        <h3 className="text-lg font-bold mb-6">Idea Editor</h3>
        {/* Form C16 mock */}
        <div className="space-y-6 flex-1">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="e.g. Study Buddy Tinder" 
              defaultValue={myIdeas[0]?.title} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Identity sentence</label>
            <textarea 
              className="w-full px-3 py-2 border border-border rounded-md bg-surface min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" 
              placeholder="A mobile app that..." 
              defaultValue={myIdeas[0]?.identitySentence} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Role needs</label>
            <div className="flex flex-wrap gap-2">
              {myIdeas[0]?.roleNeeds.map((role: any) => (
                <Chip key={role} color="sky">{role}</Chip>
              ))}
              <button className="px-3 py-1 border border-border rounded-full text-xs font-medium hover:bg-surface-sunken transition-colors">
                + Add role
              </button>
            </div>
          </div>
          <div className="pt-6 mt-auto border-t border-border flex justify-end">
            <button className="px-6 py-2 bg-primary text-primary-content rounded-md font-medium hover:opacity-90 transition-opacity shadow-sm">
              Save draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

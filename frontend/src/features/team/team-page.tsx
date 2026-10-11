import * as React from 'react';
import { useTeam } from './hooks/use-team';
import { Chip } from '@/components/primitives/chip';
import { Button } from '@/components/ui/button';
import { SkillGapRadar } from './components/skill-gap-radar';
import { HealthPanel } from './components/health-panel';
import { CharterPollBar } from './components/charter-poll-bar';
import { cn } from 'cn';
import { Mail, GitBranch, Users, Plus } from 'lucide-react';

import { useParams } from 'react-router-dom';

export function TeamPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data, isLoading } = useTeam(roomId || '');
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null);

  const isLeader = true; // Hardcoded mock role for this phase

  if (isLoading || !data) {
    return <div className="p-8 text-ink-muted">Loading Team...</div>;
  }

  // Default to first member if none selected
  const selectedMember = data.members.find((m: any) => m.id === selectedMemberId) || data.members[0];

  return (
    <div className="max-w-[1440px] mx-auto w-full px-6 pb-12">
      <div className="flex flex-col lg:flex-row flex-wrap xl:flex-nowrap items-start gap-6">
      
      {/* Col 1: Member List */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
        <h2 className="text-h2">Members</h2>
        <div className="flex flex-col bg-surface rounded-card border border-border py-5 divide-y divide-border">
          {data.members.map((member: any) => {
            const isSelected = selectedMember?.id === member.id;
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={cn(
                  "flex items-center gap-3 px-5 h-16 transition-colors text-left border-l-[3px]",
                  isSelected ? "bg-lav-100 border-lav-600" : "border-transparent hover:bg-hover-row"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center shrink-0 border border-border text-label font-bold text-ink">
                  {member.avatarId}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-body-strong text-ink truncate">{member.fullName}</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <span className="text-caption text-ink-muted truncate">{member.roleTags[0]}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Col 2: Profile Detail */}
      <div className="flex-1 min-w-[320px] flex flex-col gap-6">
        <h2 className="text-h2 opacity-0 select-none hidden lg:block" aria-hidden>Detail</h2>
        {selectedMember && (
          <div className="flex flex-col gap-6 bg-surface-raised rounded-card border border-border p-6 shadow-e0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-surface-sunken flex items-center justify-center border border-border text-h3 text-ink shrink-0">
                {selectedMember.avatarId}
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-h3 truncate">{selectedMember.fullName}</h1>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Chip fill="sun" className="text-ink">{selectedMember.timeSlotsText}</Chip>
                  <Chip fill="sky" className="text-ink">{selectedMember.sessionsCount} sessions</Chip>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-4 min-w-0">
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">Full name</label>
                <div className="flex items-center h-10 px-3 rounded-control border border-input bg-surface min-w-0">
                  <span className="text-body text-ink truncate">{selectedMember.fullName}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">Email</label>
                <div className="flex items-center h-10 px-3 rounded-control border border-input bg-surface min-w-0 group cursor-help" title={selectedMember.email}>
                  <span className="text-body text-ink truncate flex-1">{selectedMember.email}</span>
                  <Mail className="w-4 h-4 text-ink-muted shrink-0 ml-2" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">GitHub</label>
                <div className="flex items-center h-10 px-3 rounded-control border border-input bg-surface min-w-0 group cursor-help" title={selectedMember.githubHandle}>
                  <span className="text-body text-ink truncate flex-1">{selectedMember.githubHandle}</span>
                  <GitBranch className="w-4 h-4 text-ink-muted shrink-0 ml-2" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">Role tags</label>
                <div className="flex flex-wrap gap-1 min-h-[40px] px-3 py-2 rounded-control border border-input bg-surface min-w-0">
                  {selectedMember.roleTags.map((tag: any) => (
                    <Chip key={tag} fill="stone" className="text-ink">{tag}</Chip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">Availability</label>
                <div className="flex items-center h-10 px-3 rounded-control border border-input bg-surface min-w-0">
                  <span className="text-body text-ink truncate">{selectedMember.availabilityHours} hours</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">Skills</label>
                <div className="flex flex-wrap gap-1 min-h-[40px] px-3 py-2 rounded-control border border-input bg-surface min-w-0">
                  {selectedMember.skills.map((skill: any) => (
                    <Chip key={skill} fill="peach" className="text-ink">{skill}</Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Col 3: Radar, Health, Charter, Invite */}
      <div className="w-full xl:w-[360px] shrink-0 flex flex-col gap-6">
        <h2 className="text-h2 opacity-0 select-none hidden xl:block" aria-hidden>Rail</h2>
        
        {/* Invite Control */}
        <div className="flex flex-col gap-4 p-5 bg-surface rounded-card border border-border shadow-e0 min-w-0">
          <header className="flex items-center justify-between">
            <h3 className="text-h3 text-ink">Grow team</h3>
            <Button 
              className="bg-ink text-white hover:bg-ink-strong shadow-e1 shrink-0 active:scale-95 transition-transform px-3 h-8 text-caption"
              disabled={!isLeader}
            >
              <Plus className="w-3 h-3 mr-1" />
              Invite
            </Button>
          </header>
          <div className="flex min-w-0">
            <span className="text-body text-ink-muted">
              Your team is currently missing key roles required for submission. Invite teammates to fill the gaps.
            </span>
          </div>
        </div>

        <SkillGapRadar data={data.skillGapRadar} />

        <HealthPanel data={data.healthPanel} members={data.members} />

        <div className="flex flex-col gap-5 p-5 bg-surface rounded-card border border-border shadow-e0 min-w-0">
          <header className="flex items-center gap-2">
            <Users className="w-5 h-5 text-ink-muted" />
            <h3 className="text-h3 text-ink">Team Charter</h3>
          </header>
          <div className="flex flex-col gap-5 min-w-0">
            {data.charterPolls.map((poll: any, i: number) => (
              <React.Fragment key={poll.id}>
                {i > 0 && <hr className="border-t border-border" />}
                <div className="flex flex-col gap-2 min-w-0">
                  <CharterPollBar 
                    title={poll.title} 
                    options={poll.options} 
                  />
                  {poll.unansweredMemberIds.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider shrink-0">Waiting on</span>
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        {poll.unansweredMemberIds.map((id: any) => {
                          const m = data.members.find((member: any) => member.id === id);
                          return m ? (
                            <div 
                              key={id} 
                              className="w-5 h-5 rounded-full border border-dashed border-ink-muted flex items-center justify-center shrink-0 text-[8px] font-bold text-ink-muted"
                              title={m.fullName}
                            >
                              {m.avatarId}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

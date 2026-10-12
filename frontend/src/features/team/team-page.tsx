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

import { useOverlay } from '@/app/providers/overlay-store';

export function TeamPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data, isLoading } = useTeam(roomId || '');
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null);
  const inviteModal = useOverlay('invite-dialog');

  const isLeader = true; // Hardcoded mock role for this phase

  if (isLoading || !data) {
    return <div className="p-8 text-ink-muted">Loading Team...</div>;
  }

  // Default to first member if none selected
  const members = data?.members || [];
  const selectedMember = members.find((m: any) => (m.userId || m.id) === selectedMemberId) || members[0] || null;

  const selectedRoleTags = selectedMember
    ? (Array.isArray(selectedMember.roleTags) ? selectedMember.roleTags : (selectedMember.role ? [selectedMember.role] : ['Member']))
    : [];
  const selectedSkills = selectedMember
    ? (Array.isArray(selectedMember.skills) ? selectedMember.skills : [])
    : [];
  const selectedInitials = selectedMember
    ? (selectedMember.initials || (selectedMember.name ? selectedMember.name.slice(0, 2).toUpperCase() : selectedMember.avatarId || 'ME'))
    : 'ME';
  const selectedDisplayName = selectedMember
    ? (selectedMember.name || selectedMember.fullName || selectedMember.displayName || 'Member')
    : 'Member';
  const selectedEmail = selectedMember?.email || `${selectedDisplayName.toLowerCase().replace(/\s+/g, '')}@team.internal`;
  const selectedGithub = selectedMember?.githubHandle || selectedMember?.github || 'Not linked';
  const selectedAvailability = selectedMember?.availabilityHours ?? (data?.charter?.averageHours || 12);
  const selectedTimeSlots = selectedMember?.timeSlotsText || (selectedMember?.status === 'ONLINE' ? 'Active now' : selectedMember?.status || 'Active');
  const selectedSessions = selectedMember?.sessionsCount ?? (selectedMember?.tasksDone || 0);

  const charterPolls = Array.isArray(data?.charterPolls) && data.charterPolls.length > 0
    ? data.charterPolls
    : [
        {
          id: 'cp-goals',
          title: 'Sprint Goal Alignment',
          options: [
            { label: 'Win Track', percent: data?.charter?.goals?.WIN ? Math.round((data.charter.goals.WIN / Math.max(1, members.length)) * 100) : 60, color: 'sun' },
            { label: 'Learn & Ship', percent: data?.charter?.goals?.LEARN ? Math.round((data.charter.goals.LEARN / Math.max(1, members.length)) * 100) : 40, color: 'sky' },
          ],
          unansweredMemberIds: [],
        },
        {
          id: 'cp-norms',
          title: 'Working Norms Signed',
          options: [
            { label: 'Acknowledged', percent: data?.charter?.norms?.total ? Math.round((data.charter.norms.acknowledged / data.charter.norms.total) * 100) : 100, color: 'mint' },
          ],
          unansweredMemberIds: [],
        },
      ];

  return (
    <div className="max-w-[1440px] mx-auto w-full px-6 pb-12">
      <div className="flex flex-col lg:flex-row flex-wrap xl:flex-nowrap items-start gap-6">
      
      {/* Col 1: Member List */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-h2">Members</h2>
          <Button
            size="sm"
            onClick={() => inviteModal.open({ roomId })}
            className="h-8 px-3 text-caption gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" /> Add member
          </Button>
        </div>
        <div className="flex flex-col bg-surface rounded-card border border-border py-5 divide-y divide-border">
          {members.length === 0 ? (
            <div className="p-4 text-xs text-ink-muted text-center">No teammates found. Click "Add member" to invite!</div>
          ) : (
            members.map((member: any) => {
              const memId = member.userId || member.id;
              const isSelected = selectedMember && (selectedMember.userId || selectedMember.id) === memId;
              const rawRole = (member.role || member.roleTags?.[0] || '').toUpperCase();
              const roleLabel = rawRole === 'LEADER' ? 'Leader' : rawRole === 'BUILDER' ? 'Member' : (member.role || member.roleTags?.[0] || 'Member');
              const memInitials = member.initials || (member.name ? member.name.slice(0, 2).toUpperCase() : member.avatarId || 'ME');
              const memName = member.name || member.fullName || member.displayName || 'Member';

              return (
                <button
                  key={memId}
                  onClick={() => setSelectedMemberId(memId)}
                  className={cn(
                    "flex items-center gap-3 px-5 h-16 transition-colors text-left border-l-[3px]",
                    isSelected ? "bg-lav-100 border-lav-600" : "border-transparent hover:bg-hover-row"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-surface-sunken flex items-center justify-center shrink-0 border border-border text-label font-bold text-ink">
                    {memInitials}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-body-strong text-ink truncate">{memName}</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      <span className="text-caption text-ink-muted truncate">{roleLabel}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Col 2: Profile Detail */}
      <div className="flex-1 min-w-[320px] flex flex-col gap-6">
        <h2 className="text-h2 opacity-0 select-none hidden lg:block" aria-hidden>Detail</h2>
        {selectedMember && (
          <div className="flex flex-col gap-6 bg-surface-raised rounded-card border border-border p-6 shadow-e0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-surface-sunken flex items-center justify-center border border-border text-h3 text-ink shrink-0 font-bold">
                {selectedInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-h3 truncate">{selectedDisplayName}</h1>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Chip fill="sun" className="text-ink">{selectedTimeSlots}</Chip>
                  <Chip fill="sky" className="text-ink">{selectedSessions} sessions</Chip>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-4 min-w-0">
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">Full name</label>
                <div className="flex items-center h-10 px-3 rounded-control border border-input bg-surface min-w-0">
                  <span className="text-body text-ink truncate">{selectedDisplayName}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">Email</label>
                <div className="flex items-center h-10 px-3 rounded-control border border-input bg-surface min-w-0 group cursor-help" title={selectedEmail}>
                  <span className="text-body text-ink truncate flex-1">{selectedEmail}</span>
                  <Mail className="w-4 h-4 text-ink-muted shrink-0 ml-2" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">GitHub</label>
                <div className="flex items-center h-10 px-3 rounded-control border border-input bg-surface min-w-0 group cursor-help" title={selectedGithub}>
                  <span className="text-body text-ink truncate flex-1">{selectedGithub}</span>
                  <GitBranch className="w-4 h-4 text-ink-muted shrink-0 ml-2" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">Role tags</label>
                <div className="flex flex-wrap gap-1 min-h-[40px] px-3 py-2 rounded-control border border-input bg-surface min-w-0">
                  {selectedRoleTags.map((tag: any) => (
                    <Chip key={tag} fill="stone" className="text-ink">{tag}</Chip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">Availability</label>
                <div className="flex items-center h-10 px-3 rounded-control border border-input bg-surface min-w-0">
                  <span className="text-body text-ink truncate">{selectedAvailability} hours</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="text-label text-ink-muted">Skills</label>
                <div className="flex flex-wrap gap-1 min-h-[40px] px-3 py-2 rounded-control border border-input bg-surface min-w-0">
                  {selectedSkills.length === 0 ? (
                    <span className="text-caption text-ink-muted self-center">No skills listed yet</span>
                  ) : (
                    selectedSkills.map((skill: any) => (
                      <Chip key={skill} fill="peach" className="text-ink">{skill}</Chip>
                    ))
                  )}
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
              className="bg-ink text-white hover:bg-ink-strong shadow-e1 shrink-0 active:scale-95 transition-transform px-3 h-8 text-caption cursor-pointer"
              onClick={() => inviteModal.open({ roomId })}
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

        <SkillGapRadar data={data?.skillCoverage || data?.skillGapRadar || []} />

        <HealthPanel data={data?.healthPanel} members={members} />

        <div className="flex flex-col gap-5 p-5 bg-surface rounded-card border border-border shadow-e0 min-w-0">
          <header className="flex items-center gap-2">
            <Users className="w-5 h-5 text-ink-muted" />
            <h3 className="text-h3 text-ink">Team Charter</h3>
          </header>
          <div className="flex flex-col gap-5 min-w-0">
            {charterPolls.map((poll: any, i: number) => (
              <React.Fragment key={poll.id || i}>
                {i > 0 && <hr className="border-t border-border" />}
                <div className="flex flex-col gap-2 min-w-0">
                  <CharterPollBar 
                    title={poll.title} 
                    options={poll.options || []} 
                  />
                  {(poll.unansweredMemberIds || []).length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider shrink-0">Waiting on</span>
                      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                        {(poll.unansweredMemberIds || []).map((id: any) => {
                          const m = members.find((member: any) => (member.userId || member.id) === id);
                          const initials = m ? (m.initials || (m.name ? m.name.slice(0, 2).toUpperCase() : m.avatarId || 'ME')) : '?';
                          return m ? (
                            <div 
                              key={id} 
                              className="w-5 h-5 rounded-full border border-dashed border-ink-muted flex items-center justify-center shrink-0 text-[8px] font-bold text-ink-muted"
                              title={m.name || m.fullName}
                            >
                              {initials}
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

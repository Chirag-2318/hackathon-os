import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRooms, getRoom, setRoom, deleteRoom,
  getCurrentRole, setCurrentRole,
  DEMO_MEMBERS, DEMO_TEAMMATE_IDS,
  getIdeas, setIdeas, upsertIdea,
  getPlanState, setPlanState,
  getCrowdRows, setCrowdRows,
  getBrief, setBrief,
  genId, CURRENT_USER_ID,
} from '@/services/mockStore';
import type { Room, Idea, RoomStage } from '@/services/types';
import { Button } from '@/components/ui/button';
import { DEFAULT_BRIEF_FIELDS } from '@/services/briefService';

export function DevFlowPage() {
  const navigate = useNavigate();
  const [rooms, setRoomsState] = useState<Record<string, Room>>({});
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [role, setRoleState] = useState<'leader' | 'member'>('leader');
  const [message, setMessage] = useState<string>('');
  const [forceCrash, setForceCrash] = useState(false);

  const refreshData = () => {
    const all = getRooms();
    setRoomsState(all);
    const roomKeys = Object.keys(all);
    if (!selectedRoomId && roomKeys.length > 0) {
      setSelectedRoomId(roomKeys[0]);
    }
    setRoleState(getCurrentRole());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const currentRoom = selectedRoomId ? rooms[selectedRoomId] : null;

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleToggleRole = () => {
    const nextRole = role === 'leader' ? 'member' : 'leader';
    setCurrentRole(nextRole);
    setRoleState(nextRole);
    showMsg(`Switched role to ${nextRole.toUpperCase()}`);
  };

  const handleAddTeammates = () => {
    if (!currentRoom) return;
    const updatedIds = Array.from(new Set([...currentRoom.memberIds, ...DEMO_TEAMMATE_IDS]));
    const updated = { ...currentRoom, memberIds: updatedIds };
    setRoom(updated);
    refreshData();
    showMsg('Added 3 teammates (Ishita, Kabir, Sanjay)!');
  };

  const handleSeedIdeas = () => {
    if (!currentRoom) return;
    const sampleIdeas: Idea[] = [
      {
        id: genId('idea'),
        roomId: currentRoom.id,
        authorId: CURRENT_USER_ID,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'approved',
        hidden: false,
        who: 'Hackathon participants and student teams',
        problem: 'Teams lose time arguing over tech choices and disjointed tooling instead of shipping.',
        identity: 'A real-time opinionated OS guiding hackathon teams from rules to pitch.',
        coreFlow: [
          '1. Paste hackathon rules & parse rubric',
          '2. Brainstorm with silent voting rounds',
          '3. Generate PRD, MVP cut-list, and task schedule',
          '4. Rehearse pitch with AI judge timer',
        ],
        wow: 'Auto-extracted rubric checklist from link',
        riskiest: 'Students abandoning the structured sequence under crunch time',
        tech: 'React, TypeScript, Tailwind, Spring Boot',
        notes: [{ type: 'note', text: 'Benchmark against Devpost submissions from 2025' }],
        isPrimary: true,
      },
      {
        id: genId('idea'),
        roomId: currentRoom.id,
        authorId: 'u-ishita',
        createdAt: new Date(Date.now() - 3000000).toISOString(),
        status: 'approved',
        hidden: false,
        who: 'First-time student designers',
        problem: 'Creating pitch decks under pressure results in text-heavy unreadable slides.',
        identity: 'A markdown-to-slide pitch studio with live timing warnings.',
        coreFlow: [
          '1. Select pitch template (3-minute standard)',
          '2. Populate problem, solution, architecture, and live demo slide',
          '3. Run rehearse timer with slide flip cues',
        ],
        wow: 'Instant visual cards from bullet points',
        riskiest: 'Customizing layout might be too limited',
        tech: 'React, SVG, Canvas',
        notes: [{ type: 'link', text: 'Pitch deck guidelines', url: 'https://ycombinator.com/library' }],
      },
      {
        id: genId('idea'),
        roomId: currentRoom.id,
        authorId: 'u-kabir',
        createdAt: new Date(Date.now() - 2400000).toISOString(),
        status: 'pending',
        hidden: false,
        who: 'AI sprint developers',
        problem: 'Prompting LLMs across different browser tabs without shared team context.',
        identity: 'A unified prompt bridge chaining PRD into tasks and tests.',
        coreFlow: [
          '1. Define master project context pack',
          '2. Send step prompt to ChatGPT or Claude',
          '3. Paste and validate structured output',
        ],
        wow: 'Zero token hallucination with structured schemas',
        riskiest: 'LLMs deviating from strict JSON schemas',
        tech: 'OpenAI API, Web Workers',
        notes: [],
      },
      {
        id: genId('idea'),
        roomId: currentRoom.id,
        authorId: 'u-sanjay',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        status: 'pending',
        hidden: false,
        who: 'Full-stack team leads',
        problem: 'Merge conflicts and branch chaos in the final 2 hours of hackathons.',
        identity: 'A branch governor enforcing trunk-based single PR builds.',
        coreFlow: [
          '1. Scaffold repo with GitHub Actions',
          '2. Auto-merge verified micro PRs',
          '3. Lock main branch 2 hours before deadline',
        ],
        wow: 'One-click emergency demo branch rollback',
        riskiest: 'GitHub API rate limits on free accounts',
        tech: 'GitHub Octokit, Webhooks',
        notes: [],
      },
      {
        id: genId('idea'),
        roomId: currentRoom.id,
        authorId: 'u-kabir',
        createdAt: new Date(Date.now() - 1200000).toISOString(),
        status: 'rejected',
        rejectReason: 'Too heavy for a 36-hour build window.',
        hidden: false,
        who: 'Hardware hackathon participants',
        problem: 'Breadboard wiring mistakes during live judge demo.',
        identity: 'An AR camera scanner checking Arduino circuit pinouts.',
        coreFlow: [
          '1. Point camera at breadboard',
          '2. Overlay target schematic',
          '3. Highlight incorrect pin connections',
        ],
        wow: 'Real-time wire detection overlay',
        riskiest: 'Camera lighting in hackathon venues is too poor',
        tech: 'WebRTC, TensorFlow.js',
        notes: [],
      },
    ];

    setIdeas(currentRoom.id, sampleIdeas);
    refreshData();
    showMsg('Seeded 5 sample ideas from teammates!');
  };

  const handleJumpStage = (stage: RoomStage) => {
    if (!currentRoom) return;
    const stageDone = {
      brief: ['ideate', 'crowd', 'plan', 'build'].includes(stage),
      ideate: ['crowd', 'plan', 'build'].includes(stage),
      crowd: ['plan', 'build'].includes(stage),
      plan: stage === 'build',
    };
    const updated: Room = { ...currentRoom, stage, stageDone };
    setRoom(updated);

    // If jumping past brief, ensure brief exists
    if (stageDone.brief && !getBrief(currentRoom.id)) {
      setBrief({
        roomId: currentRoom.id,
        source: 'manual',
        rawText: 'Hackathon brief manual text',
        fields: DEFAULT_BRIEF_FIELDS,
        confirmed: true,
        confirmedFields: { problemStatement: true, rubric: true },
        risks: [],
      });
    }

    refreshData();
    showMsg(`Jumped room stage to "${stage.toUpperCase()}"!`);
  };

  const handleResetCurrentRoom = () => {
    if (!currentRoom) return;
    const reset: Room = {
      ...currentRoom,
      stage: 'brief',
      stageDone: { brief: false, ideate: false, crowd: false, plan: false },
      memberIds: [CURRENT_USER_ID],
    };
    setRoom(reset);
    setIdeas(currentRoom.id, []);
    setCrowdRows(currentRoom.id, []);
    localStorage.removeItem(`hos:v2:briefs`);
    refreshData();
    showMsg(`Reset room "${currentRoom.name}" to brand new state!`);
  };

  const handleResetAllData = () => {
    const keys = [
      'hos:v2:rooms', 'hos:v2:members', 'hos:v2:briefs', 'hos:v2:ideas',
      'hos:v2:crowd', 'hos:v2:plan', 'hos:v2:docs', 'hos:v2:phases',
      'hos:v2:tasks', 'hos:v2:prep', 'hos:v2:notifs', 'hos:v2:role',
    ];
    keys.forEach(k => localStorage.removeItem(k));
    refreshData();
    showMsg('Reset all mock data to factory state!');
  };

  if (forceCrash) {
    throw new Error('Forced crash test from Dev Flow Panel! Error boundary should catch this.');
  }

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-5 mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dev Flow Panel</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Test end-to-end new-room journey, stages, roles, and error states without a backend.
            </p>
          </div>
          {currentRoom && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/room/${currentRoom.id}/overview`)}
              className="text-xs font-medium"
            >
              Open Room Overview &rarr;
            </Button>
          )}
        </div>

        {message && (
          <div className="mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            {message}
          </div>
        )}

        {/* Room selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Target Room
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.values(rooms).map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRoomId(r.id)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  selectedRoomId === r.id
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {r.name} <span className="text-[10px] opacity-75 font-mono">({r.stage})</span>
              </button>
            ))}
          </div>
        </div>

        {currentRoom && (
          <div className="space-y-6">
            {/* Role switch */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Active Role</h3>
                  <p className="text-xs text-muted-foreground">
                    Currently acting as: <strong className="text-foreground capitalize">{role}</strong>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleToggleRole}>
                  Switch to {role === 'leader' ? 'Member' : 'Leader'}
                </Button>
              </div>
            </div>

            {/* Teammates & Ideas */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Team & Ideas Mock Data</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleAddTeammates}>
                  + Add 3 Mock Teammates (Ishita, Kabir, Sanjay)
                </Button>
                <Button variant="outline" size="sm" onClick={handleSeedIdeas}>
                  + Seed 5 Sample Ideas (Mixed Statuses)
                </Button>
              </div>
            </div>

            {/* Stage Jump */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Jump Room Stage</h3>
              <div className="grid grid-cols-5 gap-2">
                {(['brief', 'ideate', 'crowd', 'plan', 'build'] as RoomStage[]).map(s => (
                  <button
                    key={s}
                    onClick={() => handleJumpStage(s)}
                    className={`rounded-xl py-2 px-3 text-xs font-semibold capitalize transition ${
                      currentRoom.stage === s
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card border border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Error testing */}
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-destructive">Test Error Boundary</h3>
                <p className="text-xs text-muted-foreground">
                  Triggers an unhandled render error to verify error card and Retry button.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setForceCrash(true)}
              >
                Trigger Crash
              </Button>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl border border-border p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Reset Controls</h3>
                <p className="text-xs text-muted-foreground">
                  Reset current room to empty or wipe all localStorage keys.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleResetCurrentRoom}>
                  Reset This Room
                </Button>
                <Button variant="ghost" size="sm" onClick={handleResetAllData} className="text-destructive">
                  Reset All Mock Data
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

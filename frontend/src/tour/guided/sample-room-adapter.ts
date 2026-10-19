import { toast } from 'sonner';
import {
  SAMPLE_ROOM,
  SAMPLE_TEAMMATES,
  RAW_EVENT_RULES,
  RUBRIC_CRITERIA,
  RULES_CHECKLIST,
  SAMPLE_IDEAS,
  PLAN_STEPS,
  SAMPLE_ROOM_PHASES,
  SAMPLE_KANBAN_TASKS,
  SAMPLE_TECH_BRANCHES,
  SAMPLE_APIS,
  PRESENT_SAMPLE,
} from '../fixtures';

export function isSampleRoomTarget(path: string): boolean {
  return path.includes('/sample-room') || path.includes('sample-room');
}

export function handleSampleRoomRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();

  // Block all mutations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    toast.info('Sample room - nothing here is saved');
    return Promise.resolve({ success: true, message: 'Sample room - nothing here is saved' } as unknown as T);
  }

  // Normalize path
  const p = path.toLowerCase();

  // 1. Overview / Base room
  if (p.endsWith('/overview') || p.endsWith('/sample-room') || p.endsWith('/sample-room/')) {
    const room = {
      id: 'sample-room',
      name: SAMPLE_ROOM.name,
      code: SAMPLE_ROOM.code,
      event: SAMPLE_ROOM.event,
      track: SAMPLE_ROOM.track,
      template: 'SIH-Style',
      templateName: 'SIH-Style',
      templateId: 'sih-style',
      durationHours: 36,
      membersLimit: SAMPLE_ROOM.membersLimit,
      stage: 'build',
      stageChip: 'BUILD',
      currentUserRole: 'leader',
      eventStart: new Date().toISOString(),
      eventEnd: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
      stageDone: {
        brief: true,
        ideate: true,
        crowd: true,
        plan: true,
        build: false,
      },
      clock: {
        serverNow: Date.now(),
        startsInMs: 0,
        msToDeadline: 36 * 3600 * 1000,
        elapsedPercent: 0,
        currentHour: 0,
        totalHours: 36,
        hoursLeft: 36,
        minutesLeft: 0,
        formattedRemaining: '36h 00m',
        clockStatus: 'LIVE',
      },
      vitals: {
        checkpoints: { passed: 3, total: 4 },
        tasks: { open: 5, todo: 1, inProgress: 2, blocked: 0, done: 2 },
        vsPlan: {
          deltaPct: 12,
          actualPct: 68,
          plannedPct: 56,
          label: 'AHEAD',
        },
      },
      progress: {
        deltaPct: 12,
        actualPct: 68,
        plannedPct: 56,
      },
      kpis: {
        tasksOpen: { value: 5 },
        checkpointsPassed: { value: 3 },
      },
      unlockRules: [
        { targetStage: 'brief', unlocked: true },
        { targetStage: 'ideate', unlocked: true },
        { targetStage: 'plan', unlocked: true },
        { targetStage: 'build', unlocked: true },
        { targetStage: 'tech', unlocked: true },
        { targetStage: 'present', unlocked: true },
        { targetStage: 'review', unlocked: true },
      ],
      members: SAMPLE_TEAMMATES.map((m, i) => ({
        id: m.userId,
        userId: m.userId,
        name: m.name,
        displayName: m.displayName,
        username: m.username,
        avatarType: m.avatarType,
        avatarPreset: m.avatarPreset,
        role: m.role,
        roleTag: m.roleTag,
        isLeader: i === 0,
      })),
      tasks: SAMPLE_KANBAN_TASKS.map((t) => ({
        id: t.id,
        key: `ORB-${t.id.toUpperCase()}`,
        title: t.title,
        status: t.col === 'in_progress' ? 'inprogress' : t.col,
        assignee: t.assignee,
      })),
      phases: SAMPLE_ROOM_PHASES,
    };
    return Promise.resolve(room as unknown as T);
  }

  // 1b. Phases endpoint
  if (p.includes('/phases')) {
    return Promise.resolve(SAMPLE_ROOM_PHASES as unknown as T);
  }

  // 2. Brief
  if (p.includes('/brief')) {
    const brief = {
      id: 'brief-sample',
      roomId: 'sample-room',
      hasSource: true,
      rawRules: RAW_EVENT_RULES,
      problemStatement: 'AI-Driven Fleet Synchronization for Smart Bus Corridors',
      audience: 'Urban transit operators, city bus fleets, and daily commuters',
      fields: {
        problemStatement: 'AI-Driven Fleet Synchronization for Smart Bus Corridors',
        audience: 'Urban transit operators, city bus fleets, and daily commuters',
        targetAudience: 'Transit commuters and control center dispatchers',
        coreConstraints: 'Must support GTFS real-time feeds and work offline in low-connectivity areas',
      },
      rubric: RUBRIC_CRITERIA.map((r) => ({ label: r.name, weight: r.weight, color: r.color })),
      rules: RULES_CHECKLIST.map((r) => ({ id: r.id, label: r.text, pass: true })),
      confirmed: true,
      confirmedFields: {
        problemStatement: true,
        audience: true,
        rubric: true,
        rules: true,
      },
    };
    return Promise.resolve(brief as unknown as T);
  }

  // 3. Members / Team
  if (p.includes('/members') || p.includes('/team')) {
    const members = SAMPLE_TEAMMATES.map((m, i) => ({
      id: m.userId,
      userId: m.userId,
      name: m.name,
      displayName: m.displayName,
      username: m.username,
      avatarType: m.avatarType,
      avatarPreset: m.avatarPreset,
      role: m.role,
      roleTag: m.roleTag,
      status: 'working',
      isLeader: i === 0,
      tasksDone: i === 0 ? 2 : 1,
      tasksExpected: 3,
    }));
    return Promise.resolve(members as unknown as T);
  }

  // 4. Ideas / Ideate
  if (p.includes('/ideas') || p.includes('/ideate')) {
    const ideas = SAMPLE_IDEAS.map((idea) => ({
      ...idea,
      roomId: 'sample-room',
      score: 9,
      status: idea.approved ? 'approved' : idea.rejected ? 'rejected' : 'pending',
    }));
    return Promise.resolve(ideas as unknown as T);
  }

  // 5. Plan
  if (p.includes('/plan')) {
    const plan = {
      roomId: 'sample-room',
      steps: {
        prd: { validated: true, text: 'Product Requirements Document for Fleet Sync' },
        tech: { validated: true, text: 'Vite React, Spring Boot, Postgres, GTFS' },
        phases: { validated: true, text: '3 Sprints: Foundation, Core Engine, Polish' },
        tasks: { validated: true, text: '14 Tasks mapped across team' },
        demo: { validated: true, text: '3-min live demo walkthrough script' },
      },
      docs: PLAN_STEPS.map((s) => ({
        id: s.id,
        filename: s.file,
        title: s.step,
        description: s.desc,
      })),
    };
    return Promise.resolve(plan as unknown as T);
  }

  // 6. Docs Vault
  if (p.includes('/docs')) {
    const docs = PLAN_STEPS.map((s) => ({
      id: s.id,
      filename: s.file,
      title: s.step,
      content: `# ${s.step}\n\n${s.desc}\n\n*Generated and validated during planning phase.*`,
      updatedAt: new Date().toISOString(),
    }));
    return Promise.resolve(docs as unknown as T);
  }

  // 7. Board / Tasks
  if (p.includes('/board') || p.includes('/tasks')) {
    const board = {
      columns: [
        { id: 'todo', title: 'To Do', taskIds: ['t1'] },
        { id: 'inprogress', title: 'In Progress', taskIds: ['t2', 't3'] },
        { id: 'done', title: 'Done', taskIds: ['t4', 't5'] },
      ],
      tasks: SAMPLE_KANBAN_TASKS.map((t) => ({
        id: t.id,
        key: `ORB-${t.id.toUpperCase()}`,
        summary: t.title,
        title: t.title,
        status: t.col === 'in_progress' ? 'inprogress' : t.col,
        assignee: t.assignee,
        priority: 'high',
        estimateHours: 4,
      })),
    };
    return Promise.resolve(board as unknown as T);
  }

  // 8. GitHub
  if (p.includes('/github')) {
    const gh = {
      repo: 'hackathon-os/team-orbit',
      connected: true,
      branches: SAMPLE_TECH_BRANCHES,
      openPrsCount: 1,
      commitsCount: 38,
      health: { cleanLineage: true, branchProtection: true },
      activity: [],
    };
    return Promise.resolve(gh as unknown as T);
  }

  // 9. APIs
  if (p.includes('/apis')) {
    return Promise.resolve(SAMPLE_APIS as unknown as T);
  }

  // 10. Pitch Kit / Settings / Readiness / Demo Station
  if (p.includes('/pitchkit/readiness')) {
    const readiness = {
      readyCount: 7,
      totalCount: 10,
      scorePercent: 70,
      items: [
        { id: 'pitch-script', label: 'Pitch script exists with at least 3 beats', status: 'READY', detail: '4 beats structured in rehearsal script', route: '?tab=pitch', weight: 1 },
        { id: 'pitch-timing', label: 'Pitch fits the time limit', status: 'READY', detail: '3:00 / 3:00 target', route: '?tab=pitch', weight: 1 },
        { id: 'team-rehearsals', label: '3 completed team rehearsals', status: 'MISSING', detail: '0 of 3 team rehearsals completed', route: '?tab=pitch', weight: 1 },
        { id: 'full-recording', label: 'Full recording added and reachable', status: 'READY', detail: 'YouTube recording verified reachable', route: '?tab=demo', weight: 1 },
        { id: 'backup-recording', label: 'Backup recording added and reachable', status: 'READY', detail: 'Loom backup verified reachable', route: '?tab=demo', weight: 1 },
        { id: 'live-link', label: 'Live link reachable', status: 'READY', detail: 'https://pulsetransit.in reachable for judges', route: '?tab=demo', weight: 1 },
        { id: 'screenshots', label: 'At least 3 screenshots', status: 'READY', detail: '4 screenshots uploaded', route: '?tab=demo', weight: 1 },
        { id: 'fallback-ladder', label: 'At least 3 of 4 fallback rungs ready', status: 'READY', detail: '4 of 4 rungs ready on failure ladder', route: '?tab=demo', weight: 1 },
        { id: 'stage-roles', label: 'Presenter and operator assigned', status: 'READY', detail: '@priya presents, @aravind operates', route: '?tab=demo', weight: 1 },
        { id: 'qna-solid', label: 'Q&A at least 70% solid', status: 'MISSING', detail: '0% solid (rehearsal and practice needed)', route: '?tab=qa', weight: 1 },
      ],
    };
    return Promise.resolve(readiness as unknown as T);
  }

  if (p.includes('/pitchkit/settings')) {
    const settings = {
      roomId: 'sample-room',
      format: 'LIVE',
      pitchLimitSec: 180,
      qaLimitSec: 120,
      presenterUserId: 'u-priya',
      operatorUserId: 'u-aravind',
      locked: false,
      lockedBy: null,
      wpm: 150,
      version: 1,
    };
    return Promise.resolve(settings as unknown as T);
  }

  if (p.includes('/demo/assets')) {
    const assets = [
      {
        id: 'asset-1',
        roomId: 'sample-room',
        kind: 'FULL_RECORDING',
        url: 'https://youtube.com/watch?v=sample123',
        provider: 'YouTube',
        title: 'Full screen demo recording',
        status: 'REACHABLE',
        checkedAt: new Date(Date.now() - 3600000).toISOString(),
        caption: 'Full walkthrough',
        position: 0,
        addedBy: 'u-priya',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'asset-2',
        roomId: 'sample-room',
        kind: 'BACKUP_RECORDING',
        url: 'https://loom.com/share/sample123',
        provider: 'Loom',
        title: 'Backup 60s demo recording',
        status: 'REACHABLE',
        checkedAt: new Date(Date.now() - 7200000).toISOString(),
        caption: 'Backup video',
        position: 1,
        addedBy: 'u-priya',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'asset-3',
        roomId: 'sample-room',
        kind: 'LIVE_LINK',
        url: 'https://pulsetransit.in',
        provider: 'Other',
        title: 'Pulse Transit Live Simulator',
        status: 'REACHABLE',
        checkedAt: new Date(Date.now() - 1800000).toISOString(),
        caption: 'Live prototype',
        position: 2,
        addedBy: 'u-priya',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'asset-4',
        roomId: 'sample-room',
        kind: 'SCREENSHOT',
        url: '',
        provider: 'Other',
        title: 'dashboard.webp',
        status: 'REACHABLE',
        checkedAt: new Date().toISOString(),
        caption: 'Fleet overview dashboard',
        position: 0,
        addedBy: 'u-priya',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'asset-5',
        roomId: 'sample-room',
        kind: 'SCREENSHOT',
        url: '',
        provider: 'Other',
        title: 'realtime-map.webp',
        status: 'REACHABLE',
        checkedAt: new Date().toISOString(),
        caption: 'Live telemetry stream',
        position: 1,
        addedBy: 'u-priya',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'asset-6',
        roomId: 'sample-room',
        kind: 'SCREENSHOT',
        url: '',
        provider: 'Other',
        title: 'predictions.webp',
        status: 'REACHABLE',
        checkedAt: new Date().toISOString(),
        caption: 'Delay prediction curve',
        position: 2,
        addedBy: 'u-priya',
        createdAt: new Date().toISOString(),
      },
    ];
    return Promise.resolve(assets as unknown as T);
  }

  if (p.includes('/demo/ladder')) {
    const ladder = [
      { rung: 'A', name: 'Live demo', status: 'READY', sayText: 'Here is our live product running on Bangalore Route 500D.', testedAt: new Date().toISOString(), testedBy: 'u-priya', testedByName: '@priya' },
      { rung: 'B', name: 'Backup recording', status: 'READY', sayText: 'Our connection dropped, so here is the recording from this morning.', testedAt: new Date().toISOString(), testedBy: 'u-priya', testedByName: '@priya' },
      { rung: 'C', name: 'Screenshots', status: 'READY', sayText: 'Here are the screenshots captured from our working build.', testedAt: new Date().toISOString(), testedBy: 'u-priya', testedByName: '@priya' },
      { rung: 'D', name: 'Talk it through', status: 'READY', sayText: 'Let us walk you through the core workflow and architecture.', testedAt: new Date().toISOString(), testedBy: 'u-priya', testedByName: '@priya' },
    ];
    return Promise.resolve(ladder as unknown as T);
  }

  if (p.includes('/demo/preflight')) {
    const preflight = [
      { id: 'pf-1', itemHash: 'h1', label: 'Laptop charged to 100%', checked: true, checkedBy: 'u-priya', checkedByName: '@priya', checkedAt: new Date().toISOString(), source: 'DEFAULT', position: 0 },
      { id: 'pf-2', itemHash: 'h2', label: 'Spare laptop or device ready', checked: true, checkedBy: 'u-aravind', checkedByName: '@aravind', checkedAt: new Date().toISOString(), source: 'DEFAULT', position: 1 },
      { id: 'pf-3', itemHash: 'h3', label: 'Personal hotspot enabled and paired', checked: true, checkedBy: 'u-priya', checkedByName: '@priya', checkedAt: new Date().toISOString(), source: 'DEFAULT', position: 2 },
      { id: 'pf-4', itemHash: 'h4', label: 'Charger plugged in', checked: true, checkedBy: 'u-aravind', checkedByName: '@aravind', checkedAt: new Date().toISOString(), source: 'DEFAULT', position: 3 },
      { id: 'pf-5', itemHash: 'h5', label: 'Known-good test account verified', checked: true, checkedBy: 'u-priya', checkedByName: '@priya', checkedAt: new Date().toISOString(), source: 'DEFAULT', position: 4 },
      { id: 'pf-6', itemHash: 'h6', label: 'Wi-Fi off mode tested', checked: false, checkedBy: null, checkedByName: null, checkedAt: null, source: 'DEFAULT', position: 5 },
      { id: 'pf-7', itemHash: 'h7', label: 'Notifications and Do Not Disturb turned on', checked: true, checkedBy: 'u-priya', checkedByName: '@priya', checkedAt: new Date().toISOString(), source: 'DEFAULT', position: 6 },
      { id: 'pf-8', itemHash: 'h8', label: 'Volume and audio output checked', checked: false, checkedBy: null, checkedByName: null, checkedAt: null, source: 'DEFAULT', position: 7 },
      { id: 'pf-9', itemHash: 'h9', label: 'Browser tabs prepared and cleaned', checked: true, checkedBy: 'u-priya', checkedByName: '@priya', checkedAt: new Date().toISOString(), source: 'DEFAULT', position: 8 },
      { id: 'pf-10', itemHash: 'h10', label: 'Browser zoom reset to 100%', checked: true, checkedBy: 'u-aravind', checkedByName: '@aravind', checkedAt: new Date().toISOString(), source: 'DEFAULT', position: 9 },
    ];
    return Promise.resolve(preflight as unknown as T);
  }

  // 10. Pitch Kit & Rehearsals & Deck
  if (p.includes('/rehearsals')) {
    if (p.endsWith('/rehearsals') && (options.method ?? 'GET').toUpperCase() === 'GET') {
      const rehearsalsList = [
        {
          id: 'sample-rehearsal-1',
          roomId: 'sample-room',
          userId: 'user-sample',
          userName: 'Alex Dev',
          mode: 'TIMED',
          scope: 'FULL',
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          durationMs: 174000,
          plannedMs: 180000,
          completed: true,
          completionPct: 100,
          countsTowardReadiness: true,
          delta: { durationDeltaMs: -6000, wpmDelta: 5 },
        },
      ];
      return Promise.resolve(rehearsalsList as unknown as T);
    }
    const rehearsalDetail = {
      id: 'sample-rehearsal-1',
      roomId: 'sample-room',
      userId: 'user-sample',
      userName: 'Alex Dev',
      pitchVersion: 1,
      mode: 'TIMED',
      scope: 'FULL',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      endedAt: new Date(Date.now() - 3426000).toISOString(),
      durationMs: 174000,
      plannedMs: 180000,
      completed: true,
      completionPct: 100,
      countsTowardReadiness: true,
      beatTimings: [
        { beatId: 'b1', plannedMs: 30000, actualMs: 28000, startedAtMs: 0 },
        { beatId: 'b2', plannedMs: 45000, actualMs: 44000, startedAtMs: 28000 },
        { beatId: 'b3', plannedMs: 60000, actualMs: 58000, startedAtMs: 72000 },
        { beatId: 'b4', plannedMs: 45000, actualMs: 44000, startedAtMs: 130000 },
      ],
      stumbles: [],
      transcript: {},
      metrics: {
        overallWpm: 152,
        totalFillers: 3,
        fillersPerMin: 1.0,
        overallCoveragePct: 92,
        totalStumbles: 0,
        totalDeltaMs: -6000,
        slowestBeatId: 'b2',
        slowestBeatDeltaMs: 0,
        beatMetrics: [
          { beatId: 'b1', wpm: 150, fillerCount: 1, scriptCoveragePct: 95, missedPhrases: [], deltaMs: -2000 },
          { beatId: 'b2', wpm: 155, fillerCount: 1, scriptCoveragePct: 90, missedPhrases: [], deltaMs: -1000 },
          { beatId: 'b3', wpm: 148, fillerCount: 1, scriptCoveragePct: 92, missedPhrases: [], deltaMs: -2000 },
          { beatId: 'b4', wpm: 154, fillerCount: 0, scriptCoveragePct: 94, missedPhrases: [], deltaMs: -1000 },
        ],
      },
      coach: {
        worked: ['Steady delivery and well within time limit.', 'Clean transitions between beats.'],
        fix: [{ issue: 'Pacing dip in demo', evidence: 'Beat 3 had a 2-second pause', drill: 'Run live demo twice without pause' }],
        oneDrill: 'Run Beat 3 live demo twice at 150 wpm.',
      },
      delta: { durationDeltaMs: -6000, wpmDelta: 5 },
      beats: [
        { id: 'b1', title: 'The Urban Transit Problem', durationSec: 30, say: 'Buses bunch together, leaving riders stranded for 40 minutes.', show: 'Problem stats', cue: 'Slide 1' },
        { id: 'b2', title: 'Our Solution: Dynamic Headways', durationSec: 45, say: 'GTFS real-time feeds adjust headway automatically.', show: 'Architecture diagram', cue: 'Slide 2' },
        { id: 'b3', title: 'Live Prototype Demo', durationSec: 60, say: 'Watch simulated fleet synchronization on Bangalore route 500D.', show: 'Live fleet simulator', cue: 'Demo tab' },
        { id: 'b4', title: 'Impact & Scalability', durationSec: 45, say: '22% reduction in commuter wait time across peak corridors.', show: 'Metrics graph', cue: 'Slide 3' },
      ],
    };
    return Promise.resolve(rehearsalDetail as unknown as T);
  }

  if (p.includes('/pitch/coverage')) {
    return Promise.resolve([
      { criterion: 'Technical Depth', weight: 3, matchingBeats: [{ id: 'b2', title: 'Our Solution' }] },
      { criterion: 'Market Impact', weight: 2, matchingBeats: [{ id: 'b4', title: 'Impact & Scalability' }] },
    ] as unknown as T);
  }

  if (p.includes('/pitch') || p.includes('/deck') || p.includes('/rehearse') || p.includes('/qa')) {
    const pitch = {
      roomId: 'sample-room',
      version: 1,
      timeLimitSec: 180,
      source: 'DOC',
      docVersion: 1,
      updatedBy: 'user-sample',
      updatedByName: 'Alex Dev',
      updatedAt: new Date().toISOString(),
      beats: [
        { id: 'b1', title: 'The Urban Transit Problem', durationSec: 30, say: 'Buses bunch together, leaving riders stranded for 40 minutes.', show: 'Problem stats', cue: 'Slide 1' },
        { id: 'b2', title: 'Our Solution: Dynamic Headways', durationSec: 45, say: 'GTFS real-time feeds adjust headway automatically.', show: 'Architecture diagram', cue: 'Slide 2' },
        { id: 'b3', title: 'Live Prototype Demo', durationSec: 60, say: 'Watch simulated fleet synchronization on Bangalore route 500D.', show: 'Live fleet simulator', cue: 'Demo tab' },
        { id: 'b4', title: 'Impact & Scalability', durationSec: 45, say: '22% reduction in commuter wait time across peak corridors.', show: 'Metrics graph', cue: 'Slide 3' },
      ],
      slides: [
        { id: 1, headline: 'The Urban Transit Problem', say: 'Buses bunch together, leaving riders stranded for 40 minutes.', seconds: 30 },
        { id: 2, headline: 'Our Solution: Dynamic Headways', say: 'GTFS real-time feeds adjust headway automatically.', seconds: 45 },
        { id: 3, headline: 'Live Prototype Demo', say: 'Watch simulated fleet synchronization on Bangalore route 500D.', seconds: 60 },
        { id: 4, headline: 'Impact & Scalability', say: '22% reduction in commuter wait time across peak corridors.', seconds: 45 },
      ],
      totalSeconds: 180,
      runs: [{ durationSec: 176 }],
      questions: [
        { question: PRESENT_SAMPLE.judgeQuestion, answer: PRESENT_SAMPLE.counterAnswer, practiced: true },
      ],
      deckUrl: PRESENT_SAMPLE.deckUrl,
      hook: 'Buses arrive on time when algorithms talk to traffic signals.',
    };
    return Promise.resolve(pitch as unknown as T);
  }

  // 10b. Q&A Defence Station
  if (p.includes('/qna/map')) {
    const map = {
      totalQuestions: 22,
      solidQuestions: 14,
      solidPercent: 64,
      weakestCriterion: 'Technical Implementation',
      weakestSolidCount: 1,
      weakestTotalCount: 5,
      lanes: [
        { criterion: 'Technical Implementation', weight: 25, total: 5, solid: 1, shaky: 2, missed: 1, unseen: 1 },
        { criterion: 'Originality & Innovation', weight: 20, total: 4, solid: 3, shaky: 1, missed: 0, unseen: 0 },
        { criterion: 'User Experience & Design', weight: 20, total: 4, solid: 3, shaky: 1, missed: 0, unseen: 0 },
        { criterion: 'Impact & Feasibility', weight: 20, total: 5, solid: 4, shaky: 1, missed: 0, unseen: 0 },
        { criterion: 'Presentation & Polish', weight: 15, total: 4, solid: 3, shaky: 1, missed: 0, unseen: 0 },
      ],
      teamMembers: [
        { userId: 'u-priya', userName: 'Priya Sharma', userHandle: 'priya', practisedCount: 16, solidCount: 10, weakestOwnedCount: 2 },
        { userId: 'u-aravind', userName: 'Aravind K', userHandle: 'aravind', practisedCount: 9, solidCount: 4, weakestOwnedCount: 3 },
      ],
      weakestOwnerHandle: 'aravind',
      weakestOwnerCount: 3,
    };
    return Promise.resolve(map as unknown as T);
  }

  if (p.includes('/qna/sessions') && p.includes('/finish')) {
    const summary = {
      counts: { solid: 4, shaky: 1, missed: 0 },
      avgAnswerMs: 18000,
      longestHesitation: 32000,
      weakestCriterion: 'Technical Implementation',
      revisit: [],
    };
    return Promise.resolve(summary as unknown as T);
  }

  if (p.includes('/qna/sessions')) {
    const sessionRes = {
      id: 'mock-session-1',
      questions: [
        {
          id: 'q-mock-1',
          hash: 'hash-mock-1',
          kind: 'QUESTION',
          category: 'Architecture',
          criterion: 'Technical Implementation',
          question: 'How does your telemetry pipeline maintain sub-second latency across 5,000 buses?',
          answer: 'We ingest GTFS-RT packets through an asynchronous ingestion pipeline backed by Redis Streams. Real-time headway calculations execute in worker threads without blocking database persistence.',
          followup: 'What happens when network connectivity is lost on the bus terminal?',
          counter: 'The onboard edge cache buffers up to 30 minutes of telemetry and batch synchronizes with conflict-free monotonic sequence numbers upon reconnection.',
          proof: 'See ARCHITECTURE.md and Demo tab for live retry telemetry.',
          ownerUserId: 'u-aravind',
          ownerHandle: 'aravind',
          source: 'DOC',
          myMastery: 2,
          teamMastery: 2,
          myOwnAnswer: 'Mention Redis Streams buffering and graceful degradation.',
          myShared: true,
          sharedAnswers: [],
          position: 1,
        },
      ],
      config: {},
    };
    return Promise.resolve(sessionRes as unknown as T);
  }

  if (p.includes('/qna')) {
    const items = [
      {
        id: 'q-mock-1',
        hash: 'hash-mock-1',
        kind: 'QUESTION',
        category: 'Architecture',
        criterion: 'Technical Implementation',
        question: 'How does your telemetry pipeline maintain sub-second latency across 5,000 buses?',
        answer: 'We ingest GTFS-RT packets through an asynchronous ingestion pipeline backed by Redis Streams. Real-time headway calculations execute in worker threads without blocking database persistence.',
        followup: 'What happens when network connectivity is lost on the bus terminal?',
        counter: 'The onboard edge cache buffers up to 30 minutes of telemetry and batch synchronizes with conflict-free monotonic sequence numbers upon reconnection.',
        proof: 'See ARCHITECTURE.md and Demo tab for live retry telemetry.',
        ownerUserId: 'u-aravind',
        ownerHandle: 'aravind',
        source: 'DOC',
        myMastery: 2,
        teamMastery: 2,
        myOwnAnswer: 'Mention Redis Streams buffering and graceful degradation.',
        myShared: true,
        sharedAnswers: [],
        position: 1,
      },
      {
        id: 'q-mock-2',
        hash: 'hash-mock-2',
        kind: 'CODE',
        category: 'Code Defense',
        criterion: 'Technical Implementation',
        question: 'Show the conflict resolution code for concurrent GTFS updates.',
        answer: 'The headway calculation service uses optimistic locking with atomic compare-and-swap on route segments. If timestamp drift exceeds 3 seconds, the older packet is recorded in dead-letter telemetry.',
        followup: 'Why not use distributed transactions across services?',
        counter: '2PC introduces high latency under network partitions; eventual consistency with monotonic timestamps satisfies municipal transit requirements with zero packet drops.',
        proof: 'See GitHub repo src/main/java/telemetry/HeadwayService.java',
        ownerUserId: 'u-priya',
        ownerHandle: 'priya',
        source: 'DOC',
        myMastery: 3,
        teamMastery: 3,
        myOwnAnswer: null,
        myShared: false,
        sharedAnswers: [],
        position: 2,
      },
    ];
    return Promise.resolve(items as unknown as T);
  }

  // 11. Submission
  if (p.includes('/submission')) {
    const submission = {
      checklist: RULES_CHECKLIST.map((r) => ({
        id: r.id,
        label: r.text,
        completed: true,
      })),
      allCompleted: true,
      submittedAt: null,
    };
    return Promise.resolve(submission as unknown as T);
  }

  // 12. Checkpoints
  if (p.includes('/checkpoints')) {
    const checkpoints = [
      { id: 'cp1', label: 'Architecture & PRD', status: 'done' },
      { id: 'cp2', label: 'Feature Freeze', status: 'done' },
      { id: 'cp3', label: 'Final Demo & Submission', status: 'current' },
    ];
    return Promise.resolve(checkpoints as unknown as T);
  }

  // 13. Nav badges
  if (p.includes('/nav-badges')) {
    return Promise.resolve({
      brief: 0,
      ideate: 1,
      plan: 0,
      board: 5,
      github: 0,
      pitch: 0,
      submission: 0,
    } as unknown as T);
  }

  // 14. Presence / SSE
  if (p.includes('/presence')) {
    return Promise.resolve({ activeUserIds: ['u-priya'], onlineCount: 5 } as unknown as T);
  }

  // 15. MVP
  if (p.includes('/mvp')) {
    return Promise.resolve({
      items: [{ id: 'mvp-1', label: 'Real-time GTFS stream parser', done: true }],
    } as unknown as T);
  }

  // 16. Diagrams
  if (p.includes('/diagrams')) {
    return Promise.resolve({
      diagrams: [{ id: 'd1', title: 'System Architecture', type: 'c4' }],
    } as unknown as T);
  }

  // 17. Prep
  if (p.includes('/prep')) {
    return Promise.resolve({
      checklist: [{ id: 'pr1', title: 'Git repo created', done: true }],
      progress: { done: 6, total: 6 },
    } as unknown as T);
  }

  // Unknown GET under sample-room: return safe empty object
  return Promise.resolve({} as unknown as T);
}

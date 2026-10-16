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

  // 10. Pitch Kit / Deck / Rehearse / QA
  if (p.includes('/pitch') || p.includes('/deck') || p.includes('/rehearse') || p.includes('/qa')) {
    const pitch = {
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

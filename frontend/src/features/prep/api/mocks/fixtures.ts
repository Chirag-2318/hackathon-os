/**
 * MSW fixtures — Phase 6a (S25, S26, S27, S28)
 * PRD 6a §4
 */
import type {
  PrepResponse,
  CrowdCheckResponse,
  ToolsResponse,
  SettingsResponse,
} from '../types';

// ── S25 Prep ─────────────────────────────────────────────────────

export const prepFixture: PrepResponse = {
  checklist: [
    { id: 'env',       label: 'Environment readiness', done: false },
    { id: 'sandbox',   label: 'Stack sandbox test',    done: false },
    { id: 'logistics', label: 'Logistics',             done: true  },
    { id: 'team',      label: 'Team intro',            done: false },
    { id: 'brief',     label: 'Read the brief',        done: false },
  ],
  event: {
    name: 'Campus Build Sprint 2026',
    startDate: '2026-11-20T18:00:00+05:30',
    endDate:   '2026-11-22T06:00:00+05:30',
    venue: 'AB2 Seminar Hall, IIT Bombay',
    address:
      'Indian Institute of Technology Bombay, Powai, Mumbai, Maharashtra 400076',
    weather: { temp: 27, unit: 'C', condition: 'Partly cloudy' },
    travelTime: '23 min by metro',
  },
  githubConnected: true,
  preExistingCodeAllowed: false,
};

/** Variant: pre-existing code allowed → no guardrail banner */
export const prepAllowedFixture: PrepResponse = {
  ...prepFixture,
  preExistingCodeAllowed: true,
};

/** Variant: no event brief yet → event = null */
export const prepNoEventFixture: PrepResponse = {
  ...prepFixture,
  event: null,
  preExistingCodeAllowed: true,
};

// ── S26 Crowd Check ───────────────────────────────────────────────

export const crowdCheckFixture: CrowdCheckResponse = {
  rows: [
    {
      id: 'r1',
      option: 'Food waste prediction',
      likelyCompetingIdeas: 'Demand forecasting dashboards, AI-based wastage trackers',
      collegeOverlap: 4,
      crowdedness: 'HIGH',
      notes: 'Very common in sustainability tracks',
    },
    {
      id: 'r2',
      option: 'Hostel facility booking',
      likelyCompetingIdeas: 'Slot-booking apps, attendance systems',
      collegeOverlap: 2,
      crowdedness: 'MEDIUM',
      notes: '',
    },
  ],
};

// ── S27 Tool Directory ────────────────────────────────────────────

export const toolsFixture: ToolsResponse = {
  tools: [
    {
      id: 't1',
      name: 'Recordly',
      oneLineUse: 'Open-source screen recorder with auto-zoom and timeline editing',
      category: 'Recording',
      cost: 'Free',
      license: 'Open source',
      lastChecked: '2026-09-20',
      verified: true,
      url: 'https://github.com/nonomal/Recordly',
    },
    {
      id: 't2',
      name: 'Excalidraw',
      oneLineUse: 'Browser-based whiteboard for diagrams and wireframes',
      category: 'Diagrams',
      cost: 'Free',
      license: 'Open source',
      lastChecked: '2026-09-20',
      verified: true,
      url: 'https://excalidraw.com',
    },
    {
      id: 't3',
      name: 'RepoClip',
      oneLineUse: 'Turn your repo into a promo video',
      category: 'Video',
      cost: 'Freemium',
      license: 'Proprietary',
      lastChecked: '2026-09-20',
      verified: false,
      url: 'https://repoclip.dev',
    },
    {
      id: 't4',
      name: 'Scalar',
      oneLineUse: 'Modern OpenAPI reference viewer',
      category: 'API',
      cost: 'Free',
      license: 'Open source',
      lastChecked: '2026-09-20',
      verified: true,
      url: 'https://scalar.com',
    },
    {
      id: 't5',
      name: 'Figma',
      oneLineUse: 'Collaborative interface design and prototyping',
      category: 'Design',
      cost: 'Freemium',
      license: 'Proprietary',
      lastChecked: '2026-09-20',
      verified: true,
      url: 'https://figma.com',
    },
    {
      id: 't6',
      name: 'Railway',
      oneLineUse: 'Zero-config deployment for web apps and databases',
      category: 'Deployment',
      cost: 'Freemium',
      license: 'Proprietary',
      lastChecked: '2026-09-20',
      verified: true,
      url: 'https://railway.app',
    },
  ],
};

// ── S28 Settings ──────────────────────────────────────────────────

export const settingsFixture: SettingsResponse = {
  profile: {
    displayName: 'Aarav Mehta',
    email: 'aarav.mehta@example.com',
    githubHandle: 'aarav-mehta',
    roleTags: ['Backend'],
    availability: '20 hours',
    skills: 'Java, Spring Boot, PostgreSQL',
  },
  appearance: {
    theme: 'system',
    density: 'comfortable',
  },
  notifications: {
    blockerAlerts: true,
    checkpointReminders: true,
    taskAssignments: true,
    deadlineReminders: true,
    teamAnnouncements: true,
  },
  integrations: {
    github: { connected: true, username: 'aarav-mehta' },
    google: { connected: false },
  },
  aiAndKeys: {
    mode: 'promptBridge',
    providers: [],
  },
  billing: {
    plan: 'free',
  },
};

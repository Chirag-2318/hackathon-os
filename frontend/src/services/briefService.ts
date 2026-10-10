/**
 * briefService.ts — Brief CRUD, intake parsing, and confirmation.
 */
import { apiFetch } from '@/api/client';
import type { Brief, BriefFields, BriefSource, RubricCriterion } from './types';
import {
  getBrief, setBrief, getRoom, setRoom,
  mockDelay, CURRENT_USER_ID, addNotification, genId,
} from './mockStore';
import { USE_MOCKS } from './roomService';

export const DEFAULT_BRIEF_FIELDS: BriefFields = {
  problemStatement: 'Students and early-career developers struggle to take hackathon projects from raw ideas to complete, pitchable products within strict time limits.',
  targetAudience: 'Hackathon participants, college student teams, and solo builders.',
  rubric: [
    { criterion: 'Innovation & Originality', weight: 30 },
    { criterion: 'Technical Execution & Architecture', weight: 30 },
    { criterion: 'User Experience & Polish', weight: 20 },
    { criterion: 'Pitch & Demo Quality', weight: 20 },
  ],
  deadlines: {
    start: new Date().toISOString(),
    freeze: null,
    submission: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
  },
  eligibility: 'Open to all registered university students and working professionals.',
  techRules: 'Any open-source library or modern tech stack permitted. GitHub commits must occur during the event window.',
  aiPolicy: 'AI coding assistants (Claude, ChatGPT, GitHub Copilot) are allowed and encouraged. Disclose AI generated code.',
  deliverables: ['Working live demo URL', 'Public GitHub repository with README', '2-minute demo video', 'Pitch deck PDF'],
  tracksAndPrizes: ['Open Innovation ($5,000)', 'Best AI Application ($3,000)', 'Best Student Project ($2,000)'],
  judgingFormat: 'Live 3-minute pitch followed by 2-minute judge Q&A.',
};

export const briefService = {
  async getBrief(roomId: string): Promise<Brief | null> {
    if (USE_MOCKS) {
      await mockDelay(100, 300);
      return getBrief(roomId);
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/brief`);
  },

  async saveBrief(brief: Brief): Promise<Brief> {
    if (USE_MOCKS) {
      await mockDelay(150, 350);
      setBrief(brief);
      return brief;
    }
    return apiFetch<any>(`/api/v1/rooms/${brief.roomId}/brief`, {
      method: 'PUT',
      body: JSON.stringify(brief),
    });
  },

  async confirmBrief(roomId: string): Promise<Brief> {
    if (USE_MOCKS) {
      await mockDelay(200, 400);
      const brief = getBrief(roomId);
      if (!brief) throw new Error('Brief not found');
      brief.confirmed = true;
      setBrief(brief);

      // Advance room stage if still at brief
      const room = getRoom(roomId);
      if (room) {
        room.stageDone.brief = true;
        if (room.stage === 'brief') {
          room.stage = 'ideate';
        }
        setRoom(room);
      }

      addNotification({
        id: genId('notif'),
        roomId,
        type: 'brief_confirmed',
        message: 'Hackathon brief confirmed! The team can start ideating.',
        createdAt: new Date().toISOString(),
        read: false,
        link: `/app/room/${roomId}/ideate`,
      });

      return brief;
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/brief/confirm`, { method: 'POST' });
  },

  async parseBriefFromUrl(url: string): Promise<BriefFields> {
    // Simulated 3-step parsing: Fetching page, Reading rules, Structuring
    await mockDelay(2000, 2500);
    return {
      ...DEFAULT_BRIEF_FIELDS,
      problemStatement: `Extracted from ${url}: Teams need an all-in-one execution platform to build, coordinate, and submit exceptional hackathon entries.`,
    };
  },

  async parseBriefFromPdf(fileName: string): Promise<BriefFields> {
    await mockDelay(2000, 2500);
    return {
      ...DEFAULT_BRIEF_FIELDS,
      problemStatement: `Extracted from PDF (${fileName}): Build a product addressing real-world workflow fragmentation under high-pressure sprint environments.`,
    };
  },

  validateBriefJson(jsonStr: string): { valid: boolean; fields?: BriefFields; errors: string[] } {
    try {
      const data = JSON.parse(jsonStr);
      const errors: string[] = [];
      const requiredKeys = ['problemStatement', 'targetAudience', 'rubric', 'deadlines'];
      for (const key of requiredKeys) {
        if (!data[key]) errors.push(`Missing required key: ${key}`);
      }

      if (Array.isArray(data.rubric)) {
        const total = data.rubric.reduce((acc: number, r: RubricCriterion) => acc + (Number(r.weight) || 0), 0);
        if (total !== 100) {
          errors.push(`Rubric weights sum to ${total}, must equal 100.`);
        }
      } else {
        errors.push('Rubric must be an array of {criterion, weight}.');
      }

      if (errors.length > 0) {
        return { valid: false, errors };
      }

      const fields: BriefFields = {
        problemStatement: String(data.problemStatement ?? ''),
        targetAudience: String(data.targetAudience ?? ''),
        rubric: data.rubric ?? [],
        deadlines: {
          start: data.deadlines?.start ?? null,
          freeze: data.deadlines?.freeze ?? null,
          submission: data.deadlines?.submission ?? null,
        },
        eligibility: String(data.eligibility ?? ''),
        techRules: String(data.techRules ?? ''),
        aiPolicy: String(data.aiPolicy ?? ''),
        deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
        tracksAndPrizes: Array.isArray(data.tracksAndPrizes) ? data.tracksAndPrizes : [],
        judgingFormat: String(data.judgingFormat ?? ''),
      };

      return { valid: true, fields, errors: [] };
    } catch (e: any) {
      return { valid: false, errors: [`Invalid JSON: ${e.message}`] };
    }
  },
};

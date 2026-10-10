/**
 * docsService.ts — Docs vault files service.
 */
import { apiFetch } from '@/api/client';
import type { DocFile } from './types';
import {
  getDocs, setDocs,
  mockDelay, genId,
} from './mockStore';
import { USE_MOCKS } from './roomService';

import { buildDocsFromPlan } from './planService';
import { SAMPLE_PLAN_ANSWERS } from '@/features/plan/utils/sample-plan-answers';
import { getIdeas, DEMO_MEMBERS } from './mockStore';

export const docsService = {
  async getDocs(roomId: string): Promise<DocFile[]> {
    if (USE_MOCKS) {
      await mockDelay(100, 250);
      let docs = getDocs(roomId);
      if (!docs || docs.length === 0 || docs[0]?.content?.includes('This is the Product Requirements Document.')) {
        const samplePlan = {
          roomId,
          steps: {
            prd: { answer: SAMPLE_PLAN_ANSWERS[0], validated: true, parsed: null, issues: [], warnings: [] },
            tech: { answer: SAMPLE_PLAN_ANSWERS[1], validated: true, parsed: null, issues: [], warnings: [] },
            phases: { answer: SAMPLE_PLAN_ANSWERS[2], validated: true, parsed: JSON.parse(SAMPLE_PLAN_ANSWERS[2]), issues: [], warnings: [] },
            tasks: { answer: SAMPLE_PLAN_ANSWERS[3], validated: true, parsed: JSON.parse(SAMPLE_PLAN_ANSWERS[3]), issues: [], warnings: [] },
            demo: { answer: SAMPLE_PLAN_ANSWERS[4], validated: true, parsed: null, issues: [], warnings: [] },
          }
        };
        docs = buildDocsFromPlan(samplePlan, getIdeas(roomId), Object.values(DEMO_MEMBERS));
        setDocs(roomId, docs);
      }
      return docs;
    }
    return apiFetch<any[]>(`/api/v1/rooms/${roomId}/docs`);
  },

  async addDoc(roomId: string, doc: Omit<DocFile, 'id' | 'createdAt'>): Promise<DocFile> {
    if (USE_MOCKS) {
      await mockDelay(100, 200);
      const docs = getDocs(roomId);
      const newDoc: DocFile = {
        id: genId('doc'),
        createdAt: new Date().toISOString(),
        ...doc,
      };
      docs.push(newDoc);
      setDocs(roomId, docs);
      return newDoc;
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/docs`, {
      method: 'POST',
      body: JSON.stringify(doc),
    });
  },

  async saveDocs(roomId: string, docs: DocFile[]): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(100, 200);
      setDocs(roomId, docs);
      return;
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/docs`, {
      method: 'PUT',
      body: JSON.stringify(docs),
    });
  },
};

/**
 * mvpService.ts — MVP Studio state storage and parser.
 */
import { apiFetch } from '@/api/client';
import type { MvpState, CoreFlowStep, RealityLedgerItem, CutListItem } from './types';
import { getMvpState, setMvpState, mockDelay, genId } from './mockStore';
import { USE_MOCKS } from './roomService';

export const mvpService = {
  async getMvpState(roomId: string): Promise<MvpState> {
    if (USE_MOCKS) {
      await mockDelay(60, 150);
      const state = getMvpState(roomId);
      if (state) return state;

      // Default initial state if none exists yet
      return {
        roomId,
        identity: 'Autonomous hackathon workspace generator',
        wow: 'From brief to fully synchronized build board in 60 seconds.',
        coreFlow: [
          { id: genId('cf'), title: 'Connect repository', status: 'notyet' },
          { id: genId('cf'), title: 'Match team members', status: 'notyet' },
          { id: genId('cf'), title: 'Launch workspace', status: 'notyet' },
        ],
        ledger: [
          { id: genId('rl'), part: 'Core workspace UI', status: 'built' },
          { id: genId('rl'), part: 'Auth API', status: 'existing' },
        ],
        health: {
          runs: true,
          stable: false,
          clear30: true,
          wow60: false,
        },
        differentiation: 'End-to-end alignment from brief to live Jira-style board.',
        breaksFirst: 'Real-time WebSocket connection under rapid multi-client reconnects.',
        cutList: [
          { id: genId('cl'), text: 'Native mobile client', cut: true },
        ],
      };
    }
    return apiFetch<MvpState>(`/api/v1/rooms/${roomId}/mvp`);
  },

  async saveMvpState(roomId: string, state: MvpState): Promise<MvpState> {
    if (USE_MOCKS) {
      await mockDelay(50, 150);
      const updated = { ...state, roomId, updatedAt: new Date().toISOString() };
      setMvpState(roomId, updated);
      return updated;
    }
    return apiFetch<MvpState>(`/api/v1/rooms/${roomId}/mvp`, {
      method: 'PUT',
      body: JSON.stringify(state),
    });
  },

  seedFromPlan(roomId: string, step1Answer: string): MvpState {
    let identity = 'Tinder for hackathon teammates, matching verified GitHub profiles with sprint ambitions.';
    let wow = 'Instant mutual match triggers an automated repo fork, Discord room, and shared planning board in 2 seconds.';
    const coreFlow: CoreFlowStep[] = [];
    const ledger: RealityLedgerItem[] = [];
    const cutList: CutListItem[] = [];

    // 1. One-sentence identity
    const idMatch = step1Answer.match(/## One-sentence identity([\s\S]*?)## Core flow/);
    if (idMatch && idMatch[1].trim()) {
      identity = idMatch[1].trim().replace(/\n/g, ' ');
    }

    // 2. Wow moment
    const wowMatch = step1Answer.match(/## Wow moment([\s\S]*?)## Must-have features/);
    if (wowMatch && wowMatch[1].trim()) {
      wow = wowMatch[1].trim().replace(/\n/g, ' ');
    }

    // 3. Core flow
    const cfMatch = step1Answer.match(/## Core flow([\s\S]*?)## Wow moment/);
    if (cfMatch) {
      const lines = cfMatch[1].split('\n').map(l => l.trim()).filter(l => /^\d+\.\s+/.test(l));
      lines.slice(0, 5).forEach((line, idx) => {
        const title = line.replace(/^\d+\.\s+/, '');
        coreFlow.push({
          id: genId('cf'),
          title,
          status: idx === 0 ? 'working' : 'notyet',
        });
      });
    }
    if (coreFlow.length === 0) {
      coreFlow.push(
        { id: genId('cf'), title: 'Connect profile and stack', status: 'working' },
        { id: genId('cf'), title: 'Swipe match complementary skills', status: 'notyet' },
        { id: genId('cf'), title: 'Auto-scaffold team workspace', status: 'notyet' },
      );
    }

    // 4. Reality ledger from "## Real vs mocked" table
    const tableMatch = step1Answer.match(/## Real vs mocked([\s\S]*?)## Cut list/);
    if (tableMatch) {
      const rows = tableMatch[1].split('\n').filter(l => l.trim().startsWith('|') && !l.includes('---'));
      rows.slice(1).forEach(row => {
        const cells = row.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length >= 2) {
          const part = cells[0];
          const impl = cells[1].toLowerCase();
          const notes = cells[2] || '';
          let status: RealityLedgerItem['status'] = 'planned';
          if (impl.includes('built') || impl.includes('real')) status = 'built';
          else if (impl.includes('exist') || impl.includes('api') || impl.includes('lib')) status = 'existing';
          else if (impl.includes('mock')) status = 'mocked';

          ledger.push({
            id: genId('rl'),
            part,
            status,
            notes,
          });
        }
      });
    }
    if (ledger.length === 0) {
      ledger.push(
        { id: genId('rl'), part: 'Core swipe interface', status: 'built', notes: 'Touch gestures' },
        { id: genId('rl'), part: 'OAuth provider', status: 'existing', notes: 'GitHub API' },
        { id: genId('rl'), part: 'Real-time WebSocket broker', status: 'mocked', notes: 'Local broadcast mock' },
      );
    }

    // 5. Cut list from "## Cut list" bullets
    const cutMatch = step1Answer.match(/## Cut list([\s\S]*?)## Risks and fallbacks/);
    if (cutMatch) {
      const bullets = cutMatch[1].split('\n').map(l => l.trim()).filter(l => /^[-*]\s+/.test(l));
      bullets.forEach(b => {
        cutList.push({
          id: genId('cl'),
          text: b.replace(/^[-*]\s+/, ''),
          cut: true,
        });
      });
    }

    const state: MvpState = {
      roomId,
      identity,
      wow,
      coreFlow,
      ledger,
      health: {
        runs: true,
        stable: true,
        clear30: true,
        wow60: false,
      },
      differentiation: 'Automated skill complementarity vector distance calculation and 60-second room provisioning.',
      breaksFirst: 'Concurrent swipe sessions queue up before vector search warm-up.',
      cutList,
      updatedAt: new Date().toISOString(),
    };

    setMvpState(roomId, state);
    return state;
  },
};

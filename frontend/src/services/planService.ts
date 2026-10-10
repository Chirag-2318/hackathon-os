/**
 * planService.ts — Plan step validation, storage, and completion generation.
 * Splits validation into blocking errors and non-blocking warnings.
 * Generates 9 real documents, phases, and board tasks on plan completion.
 */
import { apiFetch } from '@/api/client';
import type { PlanState, BoardPhase, Task, DocFile, Idea, RoomMember } from './types';
import {
  getPlanState, setPlanState, getRoom, setRoom, getIdeas,
  getDocs, setDocs, getPhases, setPhases, getTasks, setTasks,
  getAllMembers, mockDelay, genId, CURRENT_USER_ID, addNotification,
} from './mockStore';
import { USE_MOCKS } from './roomService';
import { boardService } from './boardService';
import { mvpService } from './mvpService';

export interface ValidationResult {
  valid: boolean;
  issues: string[];     // Blocking errors
  warnings: string[];   // Non-blocking warnings
  summary?: string;
  parsed?: any;
}

// ── Step Validators (Errors vs Warnings) ──────────────────────────────────────

export function validateStep1Prd(answer: string): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Blocking errors: Missing root headings
  if (!answer.includes('# PRD')) issues.push('Missing "# PRD" heading.');
  if (!answer.includes('# MVP')) issues.push('Missing "# MVP" heading.');
  if (!answer.includes('## Core flow')) issues.push('Missing "## Core flow" section.');
  if (!answer.includes('## Real vs mocked')) issues.push('Missing "## Real vs mocked" section.');

  // Warnings: non-blocking
  if (!answer.includes('## One-sentence identity')) warnings.push('Missing "## One-sentence identity" section.');
  if (!answer.includes('## Wow moment')) warnings.push('Missing "## Wow moment" section.');

  const coreFlowMatch = answer.match(/## Core flow([\s\S]*?)## Wow moment/) || answer.match(/## Core flow([\s\S]*?)#/);
  let coreFlowCount = 0;
  if (coreFlowMatch) {
    const lines = coreFlowMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    const numbered = lines.filter(l => /^\d+\.\s+/.test(l));
    coreFlowCount = numbered.length;
    if (coreFlowCount < 3 || coreFlowCount > 5) {
      warnings.push(`Recommended 3 to 5 core flow steps (found ${coreFlowCount}).`);
    }
  }

  const cutListMatch = answer.match(/## Cut list([\s\S]*?)## Risks and fallbacks/) || answer.match(/## Cut list([\s\S]*?)#/);
  if (cutListMatch) {
    const bullets = cutListMatch[1].split('\n').map(l => l.trim()).filter(l => /^[-*]\s+/.test(l));
    if (bullets.length < 3) {
      warnings.push(`Cut list recommended at least 3 bullets (found ${bullets.length}).`);
    }
  } else {
    warnings.push('Missing "## Cut list" section.');
  }

  const tableMatch = answer.match(/## Real vs mocked([\s\S]*?)## Cut list/) || answer.match(/## Real vs mocked([\s\S]*?)#/);
  if (tableMatch) {
    if (!tableMatch[1].includes('|') || !tableMatch[1].includes('---')) {
      warnings.push('Real vs mocked section should contain a Markdown table.');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    summary: issues.length === 0 ? 'PRD and MVP specifications validated.' : undefined,
  };
}

export function validateStep2Tech(answer: string): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Blocking errors
  if (!answer.includes('# Tech stack')) issues.push('Missing "# Tech stack" heading.');
  if (!answer.includes('# Architecture')) issues.push('Missing "# Architecture" heading.');

  // Warnings
  if (!answer.includes('# New-tech risks')) warnings.push('Missing "# New-tech risks" heading.');

  const tablePart = answer.match(/# Tech stack([\s\S]*?)# Architecture/);
  if (tablePart) {
    const lines = tablePart[1].split('\n').filter(l => l.trim().startsWith('|') && !l.includes('---'));
    const rows = lines.slice(1);
    if (rows.length < 3) {
      warnings.push(`Tech stack table recommended at least 4 rows (found ${rows.length}).`);
    }
  }

  const mermaidMatches = answer.match(/```mermaid[\s\S]*?```/g);
  if (!mermaidMatches || mermaidMatches.length === 0) {
    warnings.push('Architecture section should include a ```mermaid code block diagram.');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    summary: issues.length === 0 ? 'Tech stack and architecture validated.' : undefined,
  };
}

export function validateStep3Phases(answer: string): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  let phases: BoardPhase[] = [];

  // Blocking: JSON syntax
  try {
    const clean = answer.trim().replace(/^```json/, '').replace(/```$/, '').trim();
    const raw = JSON.parse(clean);
    if (!Array.isArray(raw)) {
      return { valid: false, issues: ['Output must be a JSON array of phases.'], warnings: [] };
    }
    phases = raw;
  } catch (e: any) {
    return { valid: false, issues: [`Invalid JSON: ${e.message}`], warnings: [] };
  }

  if (phases.length < 3) {
    issues.push(`Must define at least 3 phases (found ${phases.length}).`);
  }

  phases.forEach((p, idx) => {
    if (!p.id || !p.name) {
      issues.push(`Phase at index ${idx} is missing an id or name.`);
    }
  });

  // Non-blocking warnings: continuity, freeze, rehearsal
  let currentPct = 0;
  let hasFreeze = false;
  let hasRehearsal = false;

  phases.forEach((p) => {
    if (p.startPct !== currentPct) {
      warnings.push(`Phase "${p.name}" has timing gap: expected startPct ${currentPct}%, got ${p.startPct}%.`);
    }
    currentPct = p.endPct;
    if (/freeze/i.test(p.name)) hasFreeze = true;
    if (/rehearsal/i.test(p.name)) hasRehearsal = true;
  });

  if (currentPct !== 100) {
    warnings.push(`Phases end at ${currentPct}% instead of 100%.`);
  }
  if (!hasFreeze) {
    warnings.push('Recommended feature-freeze phase not found.');
  }
  if (!hasRehearsal) {
    warnings.push('Recommended pitch rehearsal phase not found.');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    parsed: phases,
    summary: issues.length === 0 ? `${phases.length} sprint phases configured.` : undefined,
  };
}

export function validateStep4Tasks(
  answer: string,
  contextPhases: BoardPhase[] = []
): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  let tasks: any[] = [];

  // Blocking: JSON syntax
  try {
    const clean = answer.trim().replace(/^```json/, '').replace(/```$/, '').trim();
    const raw = JSON.parse(clean);
    if (!Array.isArray(raw)) {
      return { valid: false, issues: ['Output must be a JSON array of tasks.'], warnings: [] };
    }
    tasks = raw;
  } catch (e: any) {
    return { valid: false, issues: [`Invalid JSON: ${e.message}`], warnings: [] };
  }

  if (tasks.length === 0) {
    return { valid: false, issues: ['Task array cannot be empty.'], warnings: [] };
  }

  const phaseIds = new Set(contextPhases.map(p => p.id));
  const taskIds = new Set(tasks.map(t => t.id));

  for (const t of tasks) {
    if (!t.id || !(t.title || t.summary)) {
      issues.push('Task missing id or title.');
    }
    if (phaseIds.size > 0 && !phaseIds.has(t.phaseId)) {
      issues.push(`Task "${t.title || t.id}" references missing phaseId "${t.phaseId}".`);
    }

    // Warnings for dependency references
    if (Array.isArray(t.dependsOn)) {
      for (const depId of t.dependsOn) {
        if (!taskIds.has(depId)) {
          warnings.push(`Task "${t.title || t.id}" references unlisted dependency "${depId}".`);
        }
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    parsed: tasks,
    summary: issues.length === 0 ? `${tasks.length} board tasks structured.` : undefined,
  };
}

export function validateStep5Demo(answer: string): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Step 5 ERRORS only: missing "# Demo script", missing "# Likely judge Q&A", fewer than 3 Q&A pairs
  if (!answer.includes('# Demo script')) {
    issues.push('Missing "# Demo script" section.');
  }
  if (!answer.includes('# Likely judge Q&A')) {
    issues.push('Missing "# Likely judge Q&A" section.');
  }

  const qaMatch = answer.match(/# Likely judge Q&A([\s\S]*)$/);
  let qCount = 0;
  if (qaMatch) {
    const text = qaMatch[1];
    const qMatches = text.match(/Q\d*:|\*\*Q:|\bQ:|\bQuestion\b|\*\*Q\d*:/gi) || [];
    qCount = qMatches.length;
    if (qCount < 3) {
      issues.push(`Likely judge Q&A must have at least 3 Q&A pairs (found ${qCount}).`);
    }
  } else if (!issues.includes('Missing "# Likely judge Q&A" section.')) {
    issues.push('Could not parse Q&A pairs in judge section.');
  }

  // Step 5 WARNINGS:
  // demo seconds total outside 60 to 120, fewer than 8 Q&As, missing "What did you build this weekend?" or "What breaks first?", missing "# Shot list"
  if (!answer.includes('# Shot list')) {
    warnings.push('Missing "# Shot list" section.');
  }

  const scriptMatch = answer.match(/# Demo script([\s\S]*?)(?:# Shot list|# Likely judge Q&A|$)/);
  if (scriptMatch) {
    let totalSecs = 0;
    const secMatches = scriptMatch[1].matchAll(/(\d+)\s*(?:s|sec|seconds)/gi);
    for (const m of secMatches) {
      totalSecs += parseInt(m[1], 10);
    }
    if (totalSecs === 0 && /90\s*s/i.test(scriptMatch[1])) {
      totalSecs = 90;
    }
    if (totalSecs > 0 && (totalSecs < 60 || totalSecs > 120)) {
      warnings.push(`Demo duration ideally 60 to 120 seconds (computed ~${totalSecs}s).`);
    }
  }

  if (qaMatch) {
    const text = qaMatch[1];
    if (qCount < 8 && qCount >= 3) {
      warnings.push(`Comprehensive judge prep recommended at least 8 Q&A pairs (found ${qCount}).`);
    }
    if (!/What did you build this weekend\?/i.test(text)) {
      warnings.push('Recommended question missing: "What did you build this weekend?"');
    }
    if (!/What breaks first\?/i.test(text)) {
      warnings.push('Recommended question missing: "What breaks first?"');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    summary: issues.length === 0 ? 'Demo script and judge defense answers validated.' : undefined,
  };
}

// ── PART 4E: Build 9 Real Docs from Plan Answers ──────────────────────────────

export function buildDocsFromPlan(
  plan: PlanState,
  ideas: Idea[],
  members: RoomMember[]
): DocFile[] {
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const step1 = plan.steps.prd?.answer || '';
  const step2 = plan.steps.tech?.answer || '';
  const step3 = plan.steps.phases?.answer || '';
  const step4 = plan.steps.tasks?.answer || '';
  const step5 = plan.steps.demo?.answer || '';

  const header = (title: string) => `# ${title}\n*Generated from the plan on ${dateStr}*\n\n`;

  // 1. PRD.md = step 1 answer from "# PRD" up to (not including) "# MVP".
  let prdContent = '';
  if (step1.includes('# PRD')) {
    const afterPrd = step1.slice(step1.indexOf('# PRD'));
    prdContent = step1.includes('# MVP') ? afterPrd.slice(0, afterPrd.indexOf('# MVP')).trim() : afterPrd.trim();
  } else {
    prdContent = step1;
  }
  const prdDoc = header('PRD') + prdContent;

  // 2. MVP.md = from "# MVP" to the end, excluding "## Cut list" and "## Risks and fallbacks".
  let mvpContent = '';
  if (step1.includes('# MVP')) {
    let rawMvp = step1.slice(step1.indexOf('# MVP'));
    if (rawMvp.includes('## Cut list')) {
      rawMvp = rawMvp.slice(0, rawMvp.indexOf('## Cut list'));
    }
    mvpContent = rawMvp.trim();
  } else {
    mvpContent = '# MVP\nNo separate MVP block found.';
  }
  const mvpDoc = header('MVP Specification') + mvpContent;

  // 3. PROBLEM.md = the "## Problem", "## Target user" and "## One-sentence identity" sections.
  let problemContent = '';
  const problemMatch = step1.match(/## Problem([\s\S]*?)## Core flow/);
  if (problemMatch) {
    problemContent = '## Problem' + problemMatch[1].trim();
  } else {
    problemContent = '## Problem\nIdentified during initial brief review.';
  }
  const problemDoc = header('Problem & Identity') + problemContent;

  // 4. CUT_LIST.md = the "## Cut list" section.
  let cutContent = '';
  const cutMatch = step1.match(/## Cut list([\s\S]*?)## Risks and fallbacks/) || step1.match(/## Cut list([\s\S]*)$/);
  if (cutMatch) {
    cutContent = '## Cut list' + cutMatch[1].trim();
  } else {
    cutContent = '## Cut list\n- Non-essential secondary screens\n- Third-party social integrations';
  }
  const cutDoc = header('MVP Cut List') + cutContent;

  // 5. RISKS.md = the "## Risks and fallbacks" section.
  let risksContent = '';
  const risksMatch = step1.match(/## Risks and fallbacks([\s\S]*)$/);
  if (risksMatch) {
    risksContent = '## Risks and fallbacks' + risksMatch[1].trim();
  } else {
    risksContent = '## Risks and fallbacks\n- Fallback to mock API responses if external services timeout.';
  }
  const risksDoc = header('Sprint Risks & Fallbacks') + risksContent;

  // 6. TECH_STACK.md = the full step 2 answer.
  const techDoc = header('Tech Stack & Architecture') + step2;

  // 7. PHASES.md = step 3 JSON rendered as a markdown table.
  let phasesTable = '| Phase | Time Share | Exit Checkpoint | Goals |\n| --- | --- | --- | --- |\n';
  const parsedPhases: BoardPhase[] = plan.steps.phases?.parsed || [];
  if (parsedPhases.length > 0) {
    parsedPhases.forEach(p => {
      const goals = (p.goals || []).join('; ') || 'N/A';
      phasesTable += `| ${p.name} | ${p.startPct}% – ${p.endPct}% | ${p.exitCheckpoint || 'Ready'} | ${goals} |\n`;
    });
  } else {
    phasesTable += '| Phase 0 | 0% – 100% | Sprint completion | Build MVP |\n';
  }
  const phasesDoc = header('Sprint Phases') + phasesTable;

  // 8. DEMO_SCRIPT.md = "# Demo script" and "# Shot list" from step 5.
  let demoContent = '';
  if (step5.includes('# Likely judge Q&A')) {
    demoContent = step5.slice(0, step5.indexOf('# Likely judge Q&A')).trim();
  } else {
    demoContent = step5;
  }
  const demoDoc = header('Demo Script & Shot List') + demoContent;

  // 9. QA.md = "# Likely judge Q&A".
  let qaContent = '';
  if (step5.includes('# Likely judge Q&A')) {
    qaContent = step5.slice(step5.indexOf('# Likely judge Q&A')).trim();
  } else {
    qaContent = '# Likely judge Q&A\n\nQ: What did you build this weekend?\nA: Our hackathon MVP.';
  }
  const qaDoc = header('Judge Defense Q&A') + qaContent;

  // 10. DECISIONS.md = generated: date, primary idea, approved ideas, tech table, phase list.
  const primaryIdea = ideas.find(i => i.isPrimary) || ideas[0];
  let decisionsContent = `## Date\n${dateStr}\n\n`;
  decisionsContent += `## Primary Idea\n${primaryIdea ? primaryIdea.text : 'Consensus build'}\n\n`;
  decisionsContent += `## Approved Ideas\n`;
  ideas.forEach((idea, i) => {
    decisionsContent += `${i + 1}. ${idea.text.slice(0, 80)}\n`;
  });
  decisionsContent += `\n## Phases Overview\n${phasesTable}`;
  const decisionsDoc = header('Architectural & Sprint Decisions') + decisionsContent;

  const now = new Date().toISOString();

  return [
    { id: genId('doc'), name: 'PRD.md', content: prdDoc, version: 1, createdAt: now, updatedAt: now },
    { id: genId('doc'), name: 'MVP.md', content: mvpDoc, version: 1, createdAt: now, updatedAt: now },
    { id: genId('doc'), name: 'PROBLEM.md', content: problemDoc, version: 1, createdAt: now, updatedAt: now },
    { id: genId('doc'), name: 'CUT_LIST.md', content: cutDoc, version: 1, createdAt: now, updatedAt: now },
    { id: genId('doc'), name: 'RISKS.md', content: risksDoc, version: 1, createdAt: now, updatedAt: now },
    { id: genId('doc'), name: 'TECH_STACK.md', content: techDoc, version: 1, createdAt: now, updatedAt: now },
    { id: genId('doc'), name: 'PHASES.md', content: phasesDoc, version: 1, createdAt: now, updatedAt: now },
    { id: genId('doc'), name: 'DEMO_SCRIPT.md', content: demoDoc, version: 1, createdAt: now, updatedAt: now },
    { id: genId('doc'), name: 'QA.md', content: qaDoc, version: 1, createdAt: now, updatedAt: now },
    { id: genId('doc'), name: 'DECISIONS.md', content: decisionsDoc, version: 1, createdAt: now, updatedAt: now },
  ];
}

// ── Plan Service Object ───────────────────────────────────────────────────────

export const planService = {
  async getPlanState(roomId: string): Promise<PlanState> {
    if (USE_MOCKS) {
      await mockDelay(60, 150);
      return getPlanState(roomId);
    }
    return apiFetch<PlanState>(`/api/v1/rooms/${roomId}/plan`);
  },

  async saveStepAnswer(
    roomId: string,
    step: keyof PlanState['steps'],
    answer: string
  ): Promise<PlanState> {
    if (USE_MOCKS) {
      await mockDelay(50, 120);
      const state = getPlanState(roomId);
      state.steps[step].answer = answer;
      setPlanState(state);
      return state;
    }
    return apiFetch<PlanState>(`/api/v1/rooms/${roomId}/plan/step/${step}`, {
      method: 'PUT',
      body: JSON.stringify({ answer }),
    });
  },

  async validateStep(
    roomId: string,
    step: keyof PlanState['steps'],
    answer: string
  ): Promise<ValidationResult> {
    if (USE_MOCKS) {
      await mockDelay(200, 350);
      let result: ValidationResult;
      const state = getPlanState(roomId);

      if (step === 'prd') {
        result = validateStep1Prd(answer);
      } else if (step === 'tech') {
        result = validateStep2Tech(answer);
      } else if (step === 'phases') {
        result = validateStep3Phases(answer);
      } else if (step === 'tasks') {
        const phases = state.steps.phases.parsed || [];
        result = validateStep4Tasks(answer, phases);
      } else if (step === 'demo') {
        result = validateStep5Demo(answer);
      } else {
        result = { valid: true, issues: [], warnings: [] };
      }

      state.steps[step].answer = answer;
      state.steps[step].validated = result.valid;
      state.steps[step].issues = result.issues;
      state.steps[step].warnings = result.warnings;
      if (result.parsed) state.steps[step].parsed = result.parsed;
      setPlanState(state);

      return result;
    }

    return apiFetch<ValidationResult>(`/api/v1/rooms/${roomId}/plan/validate`, {
      method: 'POST',
      body: JSON.stringify({ step, answer }),
    });
  },

  generateRepairPrompt(step: string, issues: string[], answer: string): string {
    return `Your previous answer had these issues: ${issues.join('; ')}. Fix ONLY those issues and reply again in the exact requested format. Previous answer:\n\n${answer}`;
  },

  async completePlan(roomId: string): Promise<{
    docsCount: number;
    phasesCount: number;
    tasksCount: number;
  }> {
    if (USE_MOCKS) {
      await mockDelay(300, 600);
      const plan = getPlanState(roomId);
      const room = getRoom(roomId);
      const ideas = getIdeas(roomId).filter(i => i.status === 'approved');
      const allMembers = getAllMembers();
      const members = room ? room.memberIds.map(id => allMembers[id]).filter(Boolean) : [];

      // 1. Build and save Real Docs (PRD, MVP, PROBLEM, CUT_LIST, RISKS, TECH_STACK, PHASES, DEMO_SCRIPT, QA, DECISIONS)
      const docs = buildDocsFromPlan(plan, ideas, members);
      setDocs(roomId, docs);

      // 2. Save Phases
      const parsedPhases: BoardPhase[] = plan.steps.phases.parsed || [];
      if (parsedPhases.length > 0) {
        setPhases(roomId, parsedPhases);
      }
      const phases = getPhases(roomId);

      // 3. Generate and save Real Board Tasks
      const parsedTasks: any[] = plan.steps.tasks.parsed || [];
      let generatedTasks: Task[] = [];
      if (parsedTasks.length > 0) {
        generatedTasks = boardService.createTasksFromPlan(
          roomId,
          parsedTasks,
          phases,
          room?.eventStart || null,
          36,
          members,
          CURRENT_USER_ID
        );
        setTasks(roomId, generatedTasks);
      } else {
        generatedTasks = getTasks(roomId);
      }

      // 4. Seed MVP Studio state from plan step 1
      mvpService.seedFromPlan(roomId, plan.steps.prd.answer);

      // 5. Update room stage
      if (room) {
        room.stageDone.plan = true;
        setRoom(room);
      }

      addNotification({
        id: genId('notif'),
        roomId,
        type: 'plan_complete',
        message: 'Plan complete! Workspace ready with tasks, docs, and MVP studio.',
        createdAt: new Date().toISOString(),
        read: false,
        link: `/app/room/${roomId}/board`,
      });

      return {
        docsCount: docs.length,
        phasesCount: phases.length,
        tasksCount: generatedTasks.length,
      };
    }

    return apiFetch(`/api/v1/rooms/${roomId}/plan/complete`, { method: 'POST' });
  },
};

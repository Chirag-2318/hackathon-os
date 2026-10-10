/**
 * Context Pack generator for Step 2-5 AI prompts.
 * Generates context.md to attach to ChatGPT/Claude.
 */
import type { Room, Brief, Idea, PlanState } from '@/services/types';

export function generateContextMarkdown(
  room?: Room | null,
  brief?: Brief | null,
  primaryIdea?: Idea | null,
  planState?: PlanState | null,
): string {
  const parts: string[] = [];

  parts.push(`# Hackathon Project Context: ${room?.name || 'Hackathon OS Room'}`);
  parts.push(`Generated: ${new Date().toISOString()}`);
  parts.push(`Description: ${room?.description || 'N/A'}\n`);

  if (brief) {
    parts.push(`## Event Brief & Constraints`);
    parts.push(`- Event: ${brief.eventName || 'Hackathon'}`);
    parts.push(`- Submission Deadline: ${brief.deadline || '36 hours'}`);
    parts.push(`- Rules: ${brief.rules || 'Standard sprint rules'}`);
    if (brief.rubric && brief.rubric.length > 0) {
      parts.push(`\n### Judging Rubric`);
      brief.rubric.forEach((r) => {
        parts.push(`- **${r.name}** (${r.weight}%): ${r.description || ''}`);
      });
    }
    parts.push('');
  }

  if (primaryIdea) {
    parts.push(`## Chosen Project Idea`);
    parts.push(primaryIdea.text);
    if (primaryIdea.links && primaryIdea.links.length > 0) {
      parts.push(`\nLinks:`);
      primaryIdea.links.forEach(l => parts.push(`- ${l.title ? `${l.title}: ` : ''}${l.url}`));
    }
    if (primaryIdea.notes && primaryIdea.notes.length > 0) {
      parts.push(`\nNotes:`);
      primaryIdea.notes.forEach(n => parts.push(`- ${n}`));
    }
    parts.push('');
  }

  if (planState) {
    if (planState.steps.prd?.validated && planState.steps.prd.answer) {
      parts.push(`## Validated PRD & MVP Specification\n`);
      parts.push(planState.steps.prd.answer);
      parts.push('');
    }
    if (planState.steps.tech?.validated && planState.steps.tech.answer) {
      parts.push(`## Validated Tech Stack & Architecture\n`);
      parts.push(planState.steps.tech.answer);
      parts.push('');
    }
    if (planState.steps.phases?.validated && planState.steps.phases.answer) {
      parts.push(`## Validated Sprint Phases\n`);
      parts.push('```json\n' + planState.steps.phases.answer + '\n```');
      parts.push('');
    }
  }

  return parts.join('\n');
}

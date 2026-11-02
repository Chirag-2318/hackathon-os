import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { StepKey } from './types.js';

export interface StepPromptConfig {
  key: StepKey;
  title: string;
  description: string;
  stepDisplayName: string;
}

export const STEP_PROMPTS: StepPromptConfig[] = [
  {
    key: 'prd',
    title: 'Generate PRD + MVP for a Brackit room',
    description:
      'Generate and submit Step 1 (PRD & MVP documents) for a Brackit hackathon room.',
    stepDisplayName: 'PRD and MVP (Step 1)',
  },
  {
    key: 'tech',
    title: 'Generate Tech Stack + Architecture for a Brackit room',
    description:
      'Generate and submit Step 2 (Tech Stack & Architecture documents) for a Brackit room.',
    stepDisplayName: 'Tech Stack and Architecture (Step 2)',
  },
  {
    key: 'phases',
    title: 'Generate Implementation Phases + Design for a Brackit room',
    description:
      'Generate and submit Step 3 (Implementation Phases & Design documents) for a Brackit room.',
    stepDisplayName: 'Implementation Phases and Design (Step 3)',
  },
  {
    key: 'tasks',
    title: 'Generate Tasks breakdown for a Brackit room',
    description:
      'Generate and submit Step 4 (Tasks breakdown document) for a Brackit room.',
    stepDisplayName: 'Tasks Breakdown (Step 4)',
  },
  {
    key: 'demo',
    title: 'Generate Demo & Q&A Script for a Brackit room',
    description:
      'Generate and submit Step 5 (Demo presentation script & judge Q&A) for a Brackit room.',
    stepDisplayName: 'Demo and Q&A Script (Step 5)',
  },
];

export function buildPromptInstructions(config: StepPromptConfig, roomArg?: string): string {
  const roomHint = roomArg ? `provided room input "${roomArg}"` : 'no room specified';

  return `You are generating the ${config.stepDisplayName} for a Brackit hackathon project.

Follow these 6 steps in sequence:

1. **Resolve the room**:
   - The user provided: ${roomHint}.
   - If the input is a valid UUID, use it directly as the roomId.
   - Otherwise, call the tool \`list_rooms\` to list all accessible rooms.
   - Match by name (case-insensitive).
   - If no room was provided and the user has exactly one room, use that room.
   - If the room is ambiguous, multiple rooms match, or no match is found, show the list of available rooms with their IDs and names, and ask the user which room they want to use.

2. **Retrieve the step brief**:
   - Call \`get_step_brief\` with the resolved \`roomId\` and \`step: "${config.key}"\`.
   - Carefully review the "## EXPECTED FILES", "## INSTRUCTIONS (follow exactly)", and "## PROJECT CONTEXT".

3. **Produce and submit documents**:
   - Draft the required documents strictly adhering to the INSTRUCTIONS and expected heading structures.
   - Use ONLY the PROJECT CONTEXT (ideas, problem statement, team roles, prior approved steps) as the factual source material.
   - Format the entire output using the exact file delimiter convention:
     =====FILE: filename.md=====
     (content)
     =====END FILE=====
   - Call \`submit_step_document\` with \`roomId\`, \`step: "${config.key}"\`, and the full generated \`text\`.

4. **Handle validation repairs (if needed)**:
   - If the submission returns an error with "## FIX AND RESUBMIT", inspect the validation errors and repair prompt.
   - Fix ONLY the specific issues listed and resubmit (allow up to 3 attempts).
   - If still failing after 3 attempts, explain clearly to the user what is blocking validation.

5. **Handle warnings confirmation**:
   - If the submission indicates warnings that require confirmation (\`needsConfirmation: true\`), show the warnings to the user and ask for their confirmation before resubmitting with \`confirm: true\`.

6. **Final output**:
   - Once successfully saved, do NOT repeat the entire document text in chat.
   - Provide a concise 3-5 line summary of what was generated, confirmed, and saved, along with the provided \`webUrl\` link so the team can view it in Brackit.`;
}

function registerStepPrompt(server: McpServer, config: StepPromptConfig): void {
  server.registerPrompt(
    config.key,
    {
      title: config.title,
      description: config.description,
      argsSchema: {
        room: z
          .string()
          .optional()
          .describe(
            'Room name or UUID. If omitted and you belong to a single room, it will be automatically selected.'
          ),
      },
    },
    async ({ room }) => {
      const text = buildPromptInstructions(config, room);
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text,
            },
          },
        ],
      };
    }
  );
}

export function registerPrompts(server: McpServer): void {
  for (const stepConfig of STEP_PROMPTS) {
    registerStepPrompt(server, stepConfig);
  }
}

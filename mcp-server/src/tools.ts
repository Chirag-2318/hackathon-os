import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BackendClient } from './backend-client.js';
import { BackendHttpError, StepKeySchema } from './types.js';

export function mapBackendErrorToToolResult(err: unknown) {
  if (err instanceof BackendHttpError) {
    if (err.code === 'UNAUTHORIZED' || err.status === 401) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: 'Authentication failed. Please reconnect your Brackit connector or check your Bearer token.',
          },
        ],
      };
    }
    if (err.code === 'MCP_REQUIRES_PRO' || (err.status === 403 && err.code.includes('PRO'))) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: 'Brackit MCP API access requires an active Pro or Max plan. Please upgrade your Brackit account to Pro to use MCP features.',
          },
        ],
      };
    }
    if (err.code === 'NOT_A_MEMBER') {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `You are not an active member of this room. ${err.message}`,
          },
        ],
      };
    }
    if (err.code === 'ROOM_NOT_FOUND' || err.status === 404) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Room not found. ${err.message}`,
          },
        ],
      };
    }
    if (err.code === 'TIMEOUT' || err.status === 504) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: 'Backend request timed out after 60 seconds (Render cold start or service unresponsive). Please retry shortly.',
          },
        ],
      };
    }
    if (err.code === 'NETWORK_ERROR' || err.status === 503 || err.status === 502) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Network error connecting to Brackit backend: ${err.message}`,
          },
        ],
      };
    }

    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Brackit backend error [${err.code}]: ${err.message}`,
        },
      ],
    };
  }

  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [{ type: 'text' as const, text: `Unexpected error: ${message}` }],
  };
}

export function registerTools(server: McpServer, client: BackendClient): void {
  // 1. list_rooms: no args. GET /api/v1/mcp/rooms. Read-only.
  server.registerTool(
    'list_rooms',
    {
      title: 'List Brackit Rooms',
      description:
        'List all Brackit hackathon rooms where the current user is an active member. Returns room IDs, names, current lifecycle stages (ideate, plan, build, pitch), and member roles (e.g. LEADER, BUILDER). Read-only.',
      inputSchema: undefined,
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => {
      try {
        const rooms = await client.listRooms('list_rooms');
        if (rooms.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'You are not currently an active member of any Brackit rooms.',
              },
            ],
          };
        }

        const lines = rooms.map(
          (r) => `- **${r.name}** (ID: \`${r.id}\`) — Stage: ${r.stage}, Role: ${r.role}`
        );
        return {
          content: [
            {
              type: 'text',
              text: `Found ${rooms.length} Brackit room(s):\n\n${lines.join('\n')}`,
            },
          ],
        };
      } catch (err) {
        return mapBackendErrorToToolResult(err);
      }
    }
  );

  // 2. get_plan_steps: {roomId}. Read-only.
  server.registerTool(
    'get_plan_steps',
    {
      title: 'Get Brackit Plan Steps',
      description:
        'Get the 5 sequential planning steps for a Brackit room (prd, tech, phases, tasks, demo) with step numbers, titles, expected markdown file artifacts, and current status in this room. Read-only.',
      inputSchema: {
        roomId: z.string().describe('UUID of the Brackit room'),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ roomId }) => {
      try {
        const steps = await client.getPlanSteps(roomId, 'get_plan_steps');
        const formatted = steps.map(
          (s) =>
            `${s.number}. **${s.title}** (key: \`${s.key}\`)\n   - Expected files: ${s.expectedFiles.join(', ')}\n   - Status: \`${s.status}\``
        );

        return {
          content: [
            {
              type: 'text',
              text: `Plan steps for room \`${roomId}\`:\n\n${formatted.join('\n\n')}`,
            },
          ],
        };
      } catch (err) {
        return mapBackendErrorToToolResult(err);
      }
    }
  );

  // 3. get_step_brief: {roomId, step: prd|tech|phases|tasks|demo}. Read-only.
  server.registerTool(
    'get_step_brief',
    {
      title: 'Get Step Brief',
      description:
        'Retrieve the complete prompt instructions, expected files, and project context for a specific planning step in a Brackit room. Step must be one of: prd, tech, phases, tasks, demo. Read-only.',
      inputSchema: {
        roomId: z.string().describe('UUID of the Brackit room'),
        step: StepKeySchema.describe('Step identifier: prd, tech, phases, tasks, or demo'),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ roomId, step }) => {
      try {
        const brief = await client.getStepBrief(roomId, step, 'get_step_brief');

        const filesList = brief.expectedFiles.map((f) => `- \`${f}\``).join('\n');

        const textOutput = [
          `## EXPECTED FILES\n${filesList}`,
          `## INSTRUCTIONS (follow exactly)\n${brief.prompt}`,
          `## PROJECT CONTEXT\n${brief.context}`,
          `Web Link: ${brief.webUrl}`,
        ].join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: textOutput,
            },
          ],
        };
      } catch (err) {
        return mapBackendErrorToToolResult(err);
      }
    }
  );

  // 4. submit_step_document: {roomId, step, text, confirm? (default false), override? (default false)}.
  server.registerTool(
    'submit_step_document',
    {
      title: 'Submit Step Document',
      description:
        'Submit the AI-generated planning document bundle for a planning step in a Brackit room. Validates section headings and document structure through Brackit plan validation, and saves versioned documents in the room. Not read-only.',
      inputSchema: {
        roomId: z.string().describe('UUID of the Brackit room'),
        step: StepKeySchema.describe('Step identifier: prd, tech, phases, tasks, or demo'),
        text: z
          .string()
          .describe(
            'The complete document bundle text using =====FILE: filename===== and =====END FILE===== delimiters'
          ),
        confirm: z
          .boolean()
          .optional()
          .default(false)
          .describe('Set to true to confirm submission when non-fatal warnings need user confirmation'),
        override: z
          .boolean()
          .optional()
          .default(false)
          .describe('Set to true to override non-fatal issues if permitted'),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ roomId, step, text, confirm, override }) => {
      // Reject text over 200,000 characters before calling the backend
      if (text.length > 200000) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Document text exceeds the 200,000 character limit (received ${text.length} characters). Please condense the document before submitting.`,
            },
          ],
        };
      }

      try {
        const result = await client.submitStep(
          roomId,
          step,
          { text, confirm, override },
          'submit_step_document'
        );

        if (result.ok) {
          // Check if warnings exist that need confirmation despite ok being true
          if (result.needsConfirmation && result.warnings.length > 0 && !confirm) {
            const warningLines = result.warnings.map((w) => `- ${w}`).join('\n');
            return {
              content: [
                {
                  type: 'text',
                  text: `Document saved with warnings that require confirmation:\n\n${warningLines}\n\nPlease ask the user for confirmation before resubmitting with confirm=true.\nWeb Link: ${result.webUrl}`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: `Successfully validated and saved plan documents for step "${step}".\nWeb Link: ${result.webUrl}`,
              },
            ],
          };
        }

        // Not ok: check if needsConfirmation with warnings or validation errors
        const parts: string[] = [];

        if (result.needsConfirmation && result.warnings.length > 0) {
          const warningLines = result.warnings.map((w) => `- ${w}`).join('\n');
          parts.push(
            `### WARNINGS REQUIRING CONFIRMATION\n${warningLines}\n\nPlease ask the user for confirmation before resubmitting with confirm=true.`
          );
        }

        if (result.errors.length > 0) {
          const errorLines = result.errors.map((e) => `- ${e}`).join('\n');
          parts.push(`### VALIDATION ERRORS\n${errorLines}`);
        }

        if (result.repairPrompt) {
          parts.push(`## FIX AND RESUBMIT\n${result.repairPrompt}`);
        } else {
          parts.push(
            '## FIX AND RESUBMIT\nPlease correct the validation errors listed above and resubmit the document.'
          );
        }

        parts.push(`Web Link: ${result.webUrl}`);

        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: parts.join('\n\n'),
            },
          ],
        };
      } catch (err) {
        return mapBackendErrorToToolResult(err);
      }
    }
  );
}

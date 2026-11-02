import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools, mapBackendErrorToToolResult } from '../src/tools.js';
import { BackendClient } from '../src/backend-client.js';
import { BackendHttpError } from '../src/types.js';

describe('Tools', () => {
  function setupTestServer(mockClient: Partial<BackendClient>) {
    const server = new McpServer({ name: 'test-mcp', version: '1.0.0' });
    registerTools(server, mockClient as BackendClient);
    return server;
  }

  // Access registered tool callback through server's internal collection
  function getToolHandler(server: McpServer, toolName: string) {
    const tools = (server as unknown as { _registeredTools: Record<string, { handler: Function }> })
      ._registeredTools;
    if (!tools[toolName]) {
      throw new Error(`Tool ${toolName} not registered`);
    }
    return tools[toolName].handler;
  }

  it('list_rooms happy path', async () => {
    const mockClient: Partial<BackendClient> = {
      listRooms: vi.fn().mockResolvedValue([
        { id: 'room-1', name: 'Project AI', stage: 'plan', role: 'LEADER' },
      ]),
    };

    const server = setupTestServer(mockClient);
    const handler = getToolHandler(server, 'list_rooms');
    const result = await handler({});

    expect(result.content[0].text).toContain('Project AI');
    expect(result.content[0].text).toContain('room-1');
    expect(result.content[0].text).toContain('LEADER');
  });

  it('get_plan_steps happy path', async () => {
    const mockClient: Partial<BackendClient> = {
      getPlanSteps: vi.fn().mockResolvedValue([
        { number: 1, key: 'prd', title: 'PRD and MVP', expectedFiles: ['PRD.md', 'MVP.md'], status: 'current' },
        { number: 2, key: 'tech', title: 'Tech stack', expectedFiles: ['TECH_STACK.md'], status: 'upcoming' },
      ]),
    };

    const server = setupTestServer(mockClient);
    const handler = getToolHandler(server, 'get_plan_steps');
    const result = await handler({ roomId: 'room-1' });

    expect(result.content[0].text).toContain('PRD and MVP');
    expect(result.content[0].text).toContain('PRD.md, MVP.md');
    expect(result.content[0].text).toContain('current');
  });

  it('get_step_brief formats EXPECTED FILES, INSTRUCTIONS, PROJECT CONTEXT, and webUrl', async () => {
    const mockClient: Partial<BackendClient> = {
      getStepBrief: vi.fn().mockResolvedValue({
        step: 'prd',
        expectedFiles: ['PRD.md', 'MVP.md'],
        prompt: 'Build step 1 PRD prompt instructions',
        context: 'Ideas and problem statement context',
        webUrl: 'http://localhost:5173/app/room/1/plan?step=prd',
      }),
    };

    const server = setupTestServer(mockClient);
    const handler = getToolHandler(server, 'get_step_brief');
    const result = await handler({ roomId: 'room-1', step: 'prd' });

    const text = result.content[0].text;
    expect(text).toContain('## EXPECTED FILES');
    expect(text).toContain('`PRD.md`');
    expect(text).toContain('`MVP.md`');
    expect(text).toContain('## INSTRUCTIONS (follow exactly)');
    expect(text).toContain('Build step 1 PRD prompt instructions');
    expect(text).toContain('## PROJECT CONTEXT');
    expect(text).toContain('Ideas and problem statement context');
    expect(text).toContain('Web Link: http://localhost:5173/app/room/1/plan?step=prd');
  });

  it('submit_step_document rejects text > 200,000 characters before calling backend', async () => {
    const mockSubmit = vi.fn();
    const mockClient: Partial<BackendClient> = {
      submitStep: mockSubmit,
    };

    const server = setupTestServer(mockClient);
    const handler = getToolHandler(server, 'submit_step_document');

    const hugeText = 'a'.repeat(200001);
    const result = await handler({
      roomId: 'room-1',
      step: 'prd',
      text: hugeText,
      confirm: false,
      override: false,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('exceeds the 200,000 character limit');
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submit_step_document happy path returns short success message and webUrl', async () => {
    const mockClient: Partial<BackendClient> = {
      submitStep: vi.fn().mockResolvedValue({
        ok: true,
        valid: true,
        issues: [],
        errors: [],
        warnings: [],
        repairPrompt: null,
        needsConfirmation: false,
        webUrl: 'http://localhost:5173/app/room/1/plan?step=prd',
      }),
    };

    const server = setupTestServer(mockClient);
    const handler = getToolHandler(server, 'submit_step_document');
    const result = await handler({
      roomId: 'room-1',
      step: 'prd',
      text: '=====FILE: PRD.md=====\n# Valid\n=====END FILE=====',
    });

    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('Successfully validated and saved plan documents');
    expect(result.content[0].text).toContain('http://localhost:5173/app/room/1/plan?step=prd');
  });

  it('submit_step_document not-ok puts errors and repairPrompt verbatim under ## FIX AND RESUBMIT', async () => {
    const mockClient: Partial<BackendClient> = {
      submitStep: vi.fn().mockResolvedValue({
        ok: false,
        valid: false,
        issues: [],
        errors: ['Missing required section ## Target Audience'],
        warnings: [],
        repairPrompt: 'Please add ## Target Audience and re-submit in full.',
        needsConfirmation: false,
        webUrl: 'http://localhost:5173/app/room/1/plan?step=prd',
      }),
    };

    const server = setupTestServer(mockClient);
    const handler = getToolHandler(server, 'submit_step_document');
    const result = await handler({
      roomId: 'room-1',
      step: 'prd',
      text: '=====FILE: PRD.md=====\n# Invalid\n=====END FILE=====',
    });

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain('### VALIDATION ERRORS');
    expect(text).toContain('Missing required section ## Target Audience');
    expect(text).toContain('## FIX AND RESUBMIT');
    expect(text).toContain('Please add ## Target Audience and re-submit in full.');
  });

  it('submit_step_document formats needsConfirmation with warnings and ask user before confirm=true', async () => {
    const mockClient: Partial<BackendClient> = {
      submitStep: vi.fn().mockResolvedValue({
        ok: false,
        valid: false,
        issues: [],
        errors: [],
        warnings: ['Tech stack contains unverified experimental library'],
        repairPrompt: null,
        needsConfirmation: true,
        webUrl: 'http://localhost:5173/app/room/1/plan?step=tech',
      }),
    };

    const server = setupTestServer(mockClient);
    const handler = getToolHandler(server, 'submit_step_document');
    const result = await handler({
      roomId: 'room-1',
      step: 'tech',
      text: '=====FILE: TECH_STACK.md=====\n# Tech\n=====END FILE=====',
      confirm: false,
    });

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain('Tech stack contains unverified experimental library');
    expect(text).toContain('Please ask the user for confirmation before resubmitting with confirm=true');
  });

  describe('Error Code Mappings', () => {
    it('maps UNAUTHORIZED to friendly reconnection message', () => {
      const err = new BackendHttpError(401, 'UNAUTHORIZED', 'Missing token');
      const res = mapBackendErrorToToolResult(err);
      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('reconnect your Brackit connector');
    });

    it('maps MCP_REQUIRES_PRO to upgrade message', () => {
      const err = new BackendHttpError(403, 'MCP_REQUIRES_PRO', 'Need Pro');
      const res = mapBackendErrorToToolResult(err);
      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('upgrade your Brackit account to Pro');
    });

    it('maps NOT_A_MEMBER to membership message', () => {
      const err = new BackendHttpError(403, 'NOT_A_MEMBER', 'User not member');
      const res = mapBackendErrorToToolResult(err);
      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('not an active member of this room');
    });

    it('maps ROOM_NOT_FOUND to not found message', () => {
      const err = new BackendHttpError(404, 'ROOM_NOT_FOUND', 'Room does not exist');
      const res = mapBackendErrorToToolResult(err);
      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('Room not found');
    });

    it('maps TIMEOUT to Render cold start retry message', () => {
      const err = new BackendHttpError(504, 'TIMEOUT', 'Timed out after 60s');
      const res = mapBackendErrorToToolResult(err);
      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('Render cold start');
    });

    it('maps NETWORK_ERROR to network failure message', () => {
      const err = new BackendHttpError(503, 'NETWORK_ERROR', 'Connection refused');
      const res = mapBackendErrorToToolResult(err);
      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain('Network error connecting to Brackit backend');
    });
  });
});

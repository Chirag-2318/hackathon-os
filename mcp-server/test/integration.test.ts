import { describe, it, expect, vi, afterAll, beforeAll } from 'vitest';
import { AddressInfo } from 'node:net';
import { Server as HttpServer } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createExpressApp } from '../src/server.js';
import { Config } from '../src/config.js';

describe('Integration: MCP Client over Streamable HTTP', () => {
  let httpServer: HttpServer;
  let serverPort: number;
  let mcpClient: Client;
  let clientTransport: StreamableHTTPClientTransport;

  const mockRooms = [
    { id: 'room-alpha-123', name: 'Alpha Hackathon', stage: 'plan', role: 'LEADER' },
    { id: 'room-beta-456', name: 'Beta Sprint', stage: 'build', role: 'MEMBER' },
  ];

  beforeAll(async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/v1/mcp/rooms')) {
        return {
          ok: true,
          status: 200,
          json: async () => mockRooms,
        };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ code: 'NOT_FOUND', message: 'Not found' }),
      };
    });

    const testConfig: Config = {
      PORT: 0,
      BRACKIT_API_BASE_URL: 'http://localhost:8080',
      NODE_ENV: 'test',
      isProduction: false,
    };

    const app = createExpressApp(testConfig, mockFetch as unknown as typeof fetch);

    // Start server on an ephemeral random port
    await new Promise<void>((resolve) => {
      httpServer = app.listen(0, '127.0.0.1', () => {
        serverPort = (httpServer.address() as AddressInfo).port;
        resolve();
      });
    });

    // Create official MCP client and Streamable HTTP client transport
    clientTransport = new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${serverPort}/mcp`),
      {
        requestInit: {
          headers: {
            Authorization: 'Bearer test-bearer-token',
          },
        },
      }
    );

    mcpClient = new Client(
      { name: 'integration-test-client', version: '1.0.0' },
      { capabilities: {} }
    );

    await mcpClient.connect(clientTransport);
  });

  afterAll(async () => {
    try {
      await mcpClient?.close();
    } catch {
      // Ignore client shutdown errors
    }
    await new Promise<void>((resolve) => {
      httpServer?.close(() => resolve());
    });
  });

  it('lists all available tools via MCP protocol', async () => {
    const response = await mcpClient.listTools();
    const toolNames = response.tools.map((t) => t.name);

    expect(toolNames).toContain('list_rooms');
    expect(toolNames).toContain('get_plan_steps');
    expect(toolNames).toContain('get_step_brief');
    expect(toolNames).toContain('submit_step_document');
  });

  it('lists all five slash command prompts via MCP protocol', async () => {
    const response = await mcpClient.listPrompts();
    const promptNames = response.prompts.map((p) => p.name);

    expect(promptNames).toContain('prd');
    expect(promptNames).toContain('tech');
    expect(promptNames).toContain('phases');
    expect(promptNames).toContain('tasks');
    expect(promptNames).toContain('demo');
  });

  it('calls tool list_rooms and returns formatted rooms against mocked backend', async () => {
    const response = await mcpClient.callTool({
      name: 'list_rooms',
      arguments: {},
    });

    expect(response.isError).toBeFalsy();
    const textContent = (response.content as Array<{ type: string; text: string }>)[0].text;
    expect(textContent).toContain('Alpha Hackathon');
    expect(textContent).toContain('room-alpha-123');
    expect(textContent).toContain('Beta Sprint');
    expect(textContent).toContain('room-beta-456');
  });

  it('fetches a prompt via MCP protocol and gets generated instructions', async () => {
    const response = await mcpClient.getPrompt({
      name: 'prd',
      arguments: { room: 'Alpha Hackathon' },
    });

    expect(response.messages).toHaveLength(1);
    const message = response.messages[0];
    expect(message.role).toBe('user');
    const text = (message.content as { type: string; text: string }).text;
    expect(text).toContain('Alpha Hackathon');
    expect(text).toContain('Resolve the room');
    expect(text).toContain('Retrieve the step brief');
    expect(text).toContain('=====FILE: filename.md=====');
  });
});


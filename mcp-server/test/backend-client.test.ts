import { describe, it, expect, vi } from 'vitest';
import { createBackendClient } from '../src/backend-client.js';
import { BackendHttpError } from '../src/types.js';

describe('BackendClient', () => {
  const baseUrl = 'http://localhost:8080';
  const token = 'test-token-123';
  const reqId = 'req-test-uuid';

  it('successfully fetches rooms on happy path', async () => {
    const mockRooms = [
      { id: 'room-1', name: 'Alpha Hackathon', stage: 'plan', role: 'LEADER' },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRooms,
    });

    const client = createBackendClient(token, baseUrl, reqId, mockFetch as unknown as typeof fetch);
    const rooms = await client.listRooms();

    expect(rooms).toEqual(mockRooms);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/v1/mcp/rooms');
    expect(init.headers['Authorization']).toBe(`Bearer ${token}`);
    expect(init.headers['X-Request-Id']).toBe(reqId);
  });

  it('retries once on GET 502/503 and succeeds on second attempt', async () => {
    const mockSteps = [
      { number: 1, key: 'prd', title: 'PRD', expectedFiles: ['PRD.md'], status: 'current' },
    ];

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: async () => ({ code: 'BAD_GATEWAY', message: 'Render cold start' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSteps,
      });

    const client = createBackendClient(token, baseUrl, reqId, mockFetch as unknown as typeof fetch);
    const steps = await client.getPlanSteps('room-1');

    expect(steps).toEqual(mockSteps);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries once on GET network error and succeeds on second attempt', async () => {
    const mockBrief = {
      step: 'prd',
      expectedFiles: ['PRD.md'],
      prompt: 'Prompt content',
      context: 'Context content',
      webUrl: 'http://localhost:5173/app/room/1/plan',
    };

    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBrief,
      });

    const client = createBackendClient(token, baseUrl, reqId, mockFetch as unknown as typeof fetch);
    const brief = await client.getStepBrief('room-1', 'prd');

    expect(brief).toEqual(mockBrief);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('never retries on POST requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({ code: 'UNAVAILABLE', message: 'Temporary unavailable' }),
    });

    const client = createBackendClient(token, baseUrl, reqId, mockFetch as unknown as typeof fetch);

    await expect(
      client.submitStep('room-1', 'prd', { text: 'test document' })
    ).rejects.toThrow(BackendHttpError);

    expect(mockFetch).toHaveBeenCalledTimes(1); // Crucial: POST must NOT be retried
  });

  it('correctly maps 401 UNAUTHORIZED from backend', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ code: 'UNAUTHORIZED', message: 'Token has expired' }),
    });

    const client = createBackendClient(token, baseUrl, reqId, mockFetch as unknown as typeof fetch);

    await expect(client.listRooms()).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Token has expired',
    });
  });

  it('correctly maps 403 MCP_REQUIRES_PRO from backend', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({
        code: 'MCP_REQUIRES_PRO',
        message: 'MCP access requires a Pro or Max plan.',
      }),
    });

    const client = createBackendClient(token, baseUrl, reqId, mockFetch as unknown as typeof fetch);

    await expect(client.listRooms()).rejects.toMatchObject({
      status: 403,
      code: 'MCP_REQUIRES_PRO',
      message: 'MCP access requires a Pro or Max plan.',
    });
  });
});

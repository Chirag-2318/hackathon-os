import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createExpressApp } from '../src/server.js';
import { Config } from '../src/config.js';

describe('Server & Auth handling', () => {
  const baseConfig: Config = {
    PORT: 3000,
    BRACKIT_API_BASE_URL: 'http://localhost:8080',
    NODE_ENV: 'development',
    isProduction: false,
  };

  it('GET /health returns 200 {"ok":true}', async () => {
    const app = createExpressApp(baseConfig);
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET and DELETE /mcp return 405 Method Not Allowed with Allow: POST', async () => {
    const app = createExpressApp(baseConfig);

    const resGet = await request(app).get('/mcp');
    expect(resGet.status).toBe(405);
    expect(resGet.headers['allow']).toBe('POST');
    expect(resGet.body.error).toBe('method_not_allowed');

    const resDelete = await request(app).delete('/mcp');
    expect(resDelete.status).toBe(405);
    expect(resDelete.headers['allow']).toBe('POST');
    expect(resDelete.body.error).toBe('method_not_allowed');
  });

  it('POST /mcp with no token and no dev token responds 401 {"error":"unauthorized"}', async () => {
    const app = createExpressApp(baseConfig);

    const res = await request(app)
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', id: 1, method: 'tools/list' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('POST /mcp honors BRACKIT_DEV_TOKEN fallback in non-production', async () => {
    const devConfig: Config = {
      ...baseConfig,
      BRACKIT_DEV_TOKEN: 'dev-token-fallback-xyz',
      isProduction: false,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const app = createExpressApp(devConfig, mockFetch as unknown as typeof fetch);

    // Call tools/call on list_rooms without Authorization header
    const res = await request(app)
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .send({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'list_rooms', arguments: {} },
      });

    // Should not be 401; should proceed to MCP handler and invoke backend with dev token
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalled();
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['Authorization']).toBe('Bearer dev-token-fallback-xyz');
  });

  it('POST /mcp ignores BRACKIT_DEV_TOKEN in production', async () => {
    const prodConfig: Config = {
      ...baseConfig,
      NODE_ENV: 'production',
      isProduction: true,
      BRACKIT_DEV_TOKEN: undefined, // Stripped in production by loadConfig
    };

    const app = createExpressApp(prodConfig);

    const res = await request(app)
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', id: 1, method: 'tools/list' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('per-request token forwarding: concurrent requests with different tokens never mix', async () => {
    const tokenCaptured: Record<string, string[]> = {
      alice: [],
      bob: [],
    };

    const mockFetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>)['Authorization'];
      if (auth?.includes('token-alice')) {
        tokenCaptured.alice.push(auth);
      } else if (auth?.includes('token-bob')) {
        tokenCaptured.bob.push(auth);
      }
      return {
        ok: true,
        status: 200,
        json: async () => [{ id: 'room-1', name: 'Room 1', stage: 'plan', role: 'LEADER' }],
      };
    });

    const app = createExpressApp(baseConfig, mockFetch as unknown as typeof fetch);

    // Dispatch two concurrent requests with distinct tokens and MCP Accept header
    const reqAlice = request(app)
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .set('Authorization', 'Bearer token-alice')
      .send({
        jsonrpc: '2.0',
        id: 'req-alice',
        method: 'tools/call',
        params: { name: 'list_rooms', arguments: {} },
      });

    const reqBob = request(app)
      .post('/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .set('Authorization', 'Bearer token-bob')
      .send({
        jsonrpc: '2.0',
        id: 'req-bob',
        method: 'tools/call',
        params: { name: 'list_rooms', arguments: {} },
      });

    const [resAlice, resBob] = await Promise.all([reqAlice, reqBob]);

    expect(resAlice.status).toBe(200);
    expect(resBob.status).toBe(200);

    // Verify token isolation
    expect(tokenCaptured.alice.length).toBe(1);
    expect(tokenCaptured.alice[0]).toBe('Bearer token-alice');

    expect(tokenCaptured.bob.length).toBe(1);
    expect(tokenCaptured.bob[0]).toBe('Bearer token-bob');
  });
});

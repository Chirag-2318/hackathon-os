import express, { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Config } from './config.js';
import { createBackendClient, FetchFunction } from './backend-client.js';
import { registerTools } from './tools.js';
import { registerPrompts } from './prompts.js';

export function unauthorized(res: Response): void {
  // Single unauthorized function where OAuth discovery headers can easily be attached later
  res.status(401).json({ error: 'unauthorized' });
}

export function createExpressApp(appConfig: Config, fetchFn?: FetchFunction) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  app.all('/mcp', async (req: Request, res: Response) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      res.setHeader('Allow', 'POST');
      res.status(405).json({
        error: 'method_not_allowed',
        message: 'Only POST is supported for stateless Streamable HTTP',
      });
      return;
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).json({
        error: 'method_not_allowed',
        message: 'Only POST is supported for stateless Streamable HTTP',
      });
      return;
    }

    // Extract Bearer token
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }

    // Fall back to dev token only in non-production environments
    if (!token && appConfig.BRACKIT_DEV_TOKEN && !appConfig.isProduction) {
      token = appConfig.BRACKIT_DEV_TOKEN;
    }

    if (!token) {
      unauthorized(res);
      return;
    }

    const reqId = (req.headers['x-request-id'] as string) || randomUUID();

    // Create per-request backend client in closure with isolated token
    const backendClient = createBackendClient(token, appConfig.BRACKIT_API_BASE_URL, reqId, fetchFn);

    // Create new server + transport per request in stateless mode
    const mcpServer = new McpServer({
      name: 'brackit-mcp-server',
      version: '1.0.0',
    });

    registerTools(mcpServer, backendClient);
    registerPrompts(mcpServer);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
    });

    try {
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error(
        JSON.stringify({
          requestId: reqId,
          error: err instanceof Error ? err.message : String(err),
        })
      );
      if (!res.headersSent) {
        res.status(500).json({ error: 'internal_server_error' });
      }
    }
  });

  return app;
}

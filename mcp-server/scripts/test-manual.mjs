#!/usr/bin/env node

/**
 * Manual test script for Brackit MCP server against a running local backend and MCP server.
 *
 * Usage:
 *   BRACKIT_TOKEN="bkt_..." node scripts/test-manual.mjs
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_URL = process.env.MCP_URL || 'http://localhost:3000/mcp';
const HEALTH_URL = process.env.HEALTH_URL || 'http://localhost:3000/health';
const TOKEN = process.env.BRACKIT_TOKEN || process.env.BRACKIT_DEV_TOKEN;

async function main() {
  console.log('--- Brackit MCP Server Manual Test ---');
  console.log(`Target MCP Server: ${MCP_URL}`);

  // 1. Check /health
  try {
    const healthRes = await fetch(HEALTH_URL);
    const healthData = await healthRes.json();
    console.log(`[PASS] Health check: status=${healthRes.status}, data=`, healthData);
  } catch (err) {
    console.error(`[FAIL] Health check failed: ${err.message}`);
    process.exit(1);
  }

  if (!TOKEN) {
    console.warn(
      '\n[WARN] No BRACKIT_TOKEN or BRACKIT_DEV_TOKEN provided.' +
        '\nIf the server has BRACKIT_DEV_TOKEN configured in development, it will fall back automatically.' +
        '\nOtherwise, pass BRACKIT_TOKEN="bkt_..." node scripts/test-manual.mjs\n'
    );
  }

  // 2. Connect via MCP Client over Streamable HTTP
  const headers = {};
  if (TOKEN) {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: { headers },
  });

  const client = new Client(
    { name: 'manual-test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  console.log('[...] Connecting to MCP server via Streamable HTTP...');
  await client.connect(transport);
  console.log('[PASS] Connected to MCP server successfully.\n');

  // 3. List tools
  console.log('[...] Querying available tools...');
  const toolsRes = await client.listTools();
  console.log(`[PASS] Found ${toolsRes.tools.length} tool(s):`);
  toolsRes.tools.forEach((t) => {
    console.log(`  - ${t.name}: ${t.description.slice(0, 70)}...`);
  });

  // 4. List prompts
  console.log('\n[...] Querying available prompts (slash commands)...');
  const promptsRes = await client.listPrompts();
  console.log(`[PASS] Found ${promptsRes.prompts.length} prompt(s):`);
  promptsRes.prompts.forEach((p) => {
    console.log(`  - /${p.name}: ${p.description}`);
  });

  // 5. Call tool: list_rooms
  console.log('\n[...] Calling tool "list_rooms"...');
  const roomsResult = await client.callTool({
    name: 'list_rooms',
    arguments: {},
  });

  if (roomsResult.isError) {
    console.error('[FAIL] list_rooms returned an error:');
    console.error(roomsResult.content[0].text);
  } else {
    console.log('[PASS] list_rooms output:');
    console.log(roomsResult.content[0].text);
  }

  // 6. Inspect prompt: prd
  console.log('\n[...] Testing prompt "prd"...');
  const prdPrompt = await client.getPrompt({
    name: 'prd',
    arguments: { room: 'Demo Project' },
  });
  console.log('[PASS] prd prompt retrieved. Prompt instruction preview:');
  console.log(prdPrompt.messages[0].content.text.slice(0, 200) + '...\n');

  await client.close();
  console.log('--- All Manual Tests Completed Successfully ---');
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]', err);
  process.exit(1);
});

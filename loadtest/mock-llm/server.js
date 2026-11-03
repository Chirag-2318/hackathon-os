#!/usr/bin/env node
/**
 * Standalone Fake LLM / STT Mock Server for Load Testing.
 * Zero external dependencies (uses native node:http).
 * Mimics Groq / OpenAI completions and Whisper speech-to-text with configurable latency.
 */

import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = parseInt(process.env.PORT || '8088', 10);
const DEFAULT_MIN_DELAY_MS = parseInt(process.env.MOCK_AI_DELAY_MIN_MS || '15000', 10);
const DEFAULT_MAX_DELAY_MS = parseInt(process.env.MOCK_AI_DELAY_MAX_MS || '40000', 10);

function getDelay(req, url) {
  const headerDelay = req.headers['x-mock-delay-ms'];
  if (headerDelay) {
    const parsed = parseInt(headerDelay, 10);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }
  if (url.searchParams.get('fast') === 'true') {
    return 300;
  }
  const min = DEFAULT_MIN_DELAY_MS;
  const max = Math.max(min, DEFAULT_MAX_DELAY_MS);
  return Math.floor(min + Math.random() * (max - min));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  // Liveness / Health check
  if (req.method === 'GET' && (path === '/health' || path === '/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mock: 'llm-stt', port: PORT }));
    return;
  }

  // OpenAI Chat Completions
  if (req.method === 'POST' && (path.endsWith('/chat/completions') || path === '/chat/completions')) {
    const delayMs = getDelay(req, url);
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      setTimeout(() => {
        const body = JSON.stringify({
          id: `chatcmpl-mock-${randomUUID()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'llama-3.3-70b-versatile',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  title: 'Synthetic AI Plan for Load Testing',
                  summary: 'Generated after realistic simulated inference delay',
                  tasks: [
                    { title: 'Frontend Integration', description: 'Wire client components' },
                    { title: 'API Hardening', description: 'Validate endpoints' }
                  ]
                })
              },
              finish_reason: 'stop'
            }
          ],
          usage: { prompt_tokens: 120, completion_tokens: 65, total_tokens: 185 }
        });

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'X-Simulated-Delay-Ms': String(delayMs)
        });
        res.end(body);
      }, delayMs);
    });
    return;
  }

  // Whisper Audio Transcriptions
  if (req.method === 'POST' && (path.endsWith('/audio/transcriptions') || path === '/audio/transcriptions')) {
    const delayMs = getDelay(req, url);
    setTimeout(() => {
      const body = JSON.stringify({
        text: 'This is simulated speech transcription text for load testing without external API calls.'
      });
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-Simulated-Delay-Ms': String(delayMs)
      });
      res.end(body);
    }, delayMs);
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', path }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock-llm] Fake LLM/STT server listening on http://0.0.0.0:${PORT}`);
  console.log(`[mock-llm] Configured delay: ${DEFAULT_MIN_DELAY_MS}ms - ${DEFAULT_MAX_DELAY_MS}ms`);
});


import { config } from './config.js';
import { createExpressApp } from './server.js';

const app = createExpressApp(config);

app.listen(config.PORT, () => {
  console.log(
    `[brackit-mcp-server] Server listening on port ${config.PORT} (Stateless Streamable HTTP at /mcp)`
  );
  console.log(`[brackit-mcp-server] Backend API Base: ${config.BRACKIT_API_BASE_URL}`);
  if (config.BRACKIT_DEV_TOKEN) {
    console.log('[brackit-mcp-server] BRACKIT_DEV_TOKEN is configured for fallback in development.');
  }
});

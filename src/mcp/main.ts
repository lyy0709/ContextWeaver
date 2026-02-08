#!/usr/bin/env node

// ESM import declarations are evaluated before this module body runs.
// Use dynamic imports so we can mark MCP mode before loading config/logger.
if (!process.argv.includes('mcp')) {
  process.argv.push('mcp');
}

const { logger } = await import('../utils/logger.js');
const { startMcpServer } = await import('./server.js');

try {
  await startMcpServer();
} catch (err) {
  const error = err as { message?: string; stack?: string };
  logger.error(
    { error: error.message, stack: error.stack },
    `MCP 服务器启动失败: ${error.message}`,
  );
  process.exit(1);
}

export {};

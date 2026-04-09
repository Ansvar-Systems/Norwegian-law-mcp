#!/usr/bin/env node
/**
 * HTTP entry point for Law MCP Server (Docker proxy transport).
 *
 * Universal template — works with ANY law MCP that follows the standard
 * pattern: registerTools() in ./tools/registry.js, capabilities.js,
 * and @ansvar/mcp-sqlite database.
 *
 * Endpoints:
 *   GET  /health  → { status, server, version, uptime_seconds }
 *   POST /mcp     → MCP Streamable HTTP transport (new + existing sessions)
 *   GET  /mcp     → SSE stream (existing session) or metadata (no session)
 *   DELETE /mcp   → session termination
 *   OPTIONS *     → CORS preflight
 */
export {};
//# sourceMappingURL=http-server.d.ts.map
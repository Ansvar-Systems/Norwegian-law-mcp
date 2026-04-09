#!/usr/bin/env node
/**
 * Norwegian Legal Citation MCP Server
 *
 * Provides 8 tools for querying Norwegian statutes, case law,
 * preparatory works, and legal citations.
 *
 * Zero-hallucination: never generates citations, only returns verified database entries.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import Database from '@ansvar/mcp-sqlite';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { readFileSync, statSync, existsSync, mkdirSync, createWriteStream, renameSync, unlinkSync } from 'fs';
import { createGunzip } from 'zlib';
import { execFileSync } from 'child_process';
import https from 'https';
import { registerTools } from './tools/registry.js';
import { detectCapabilities, readDbMetadata, } from './capabilities.js';
const SERVER_NAME = 'norwegian-legal-citations';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_PATH = path.join(__dirname, '..', 'package.json');
const pkgVersion = JSON.parse(readFileSync(PKG_PATH, 'utf-8')).version;
const DB_ENV_VAR = 'NORWEGIAN_LAW_DB_PATH';
const DEFAULT_DB_PATH = '../data/database.db';
let dbInstance = null;
let serverCapabilities = null;
let serverMetadata = null;
function getDb() {
    if (!dbInstance) {
        const dbPath = process.env[DB_ENV_VAR] || getDefaultDbPath();
        console.error(`[${SERVER_NAME}] Opening database: ${dbPath}`);
        dbInstance = new Database(dbPath, { readonly: true });
        dbInstance.pragma('foreign_keys = ON');
        console.error(`[${SERVER_NAME}] Database opened successfully`);
        // Detect capabilities on first open
        serverCapabilities = detectCapabilities(dbInstance);
        serverMetadata = readDbMetadata(dbInstance);
        console.error(`[${SERVER_NAME}] Tier: ${serverMetadata.tier}`);
        console.error(`[${SERVER_NAME}] Capabilities: ${[...serverCapabilities].join(', ')}`);
    }
    return dbInstance;
}
export function getCapabilities() {
    if (!serverCapabilities) {
        getDb(); // triggers detection
    }
    return serverCapabilities;
}
export function getMetadata() {
    if (!serverMetadata) {
        getDb(); // triggers detection
    }
    return serverMetadata;
}
function getDefaultDbPath() {
    return path.resolve(__dirname, DEFAULT_DB_PATH);
}
function httpsFollow(url, redirects = 0) {
    return new Promise((resolve, reject) => {
        if (redirects > 5)
            return reject(new Error('Too many redirects'));
        https.get(url, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                return resolve(httpsFollow(res.headers.location, redirects + 1));
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            resolve(res);
        }).on('error', reject);
    });
}
async function ensureDatabase(dbPath) {
    if (existsSync(dbPath) && statSync(dbPath).size > 0)
        return;
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf-8'));
    const repoUrl = typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository?.url || '');
    const repo = repoUrl.replace(/^.*github\.com\//, '').replace(/\.git$/, '');
    if (!repo)
        throw new Error('Cannot determine repo from package.json');
    const url = `https://github.com/${repo}/releases/download/v${pkgVersion}/database.db.gz`;
    console.error(`[${SERVER_NAME}] Database missing — downloading from ${url}`);
    mkdirSync(path.dirname(dbPath), { recursive: true });
    const res = await httpsFollow(url);
    await new Promise((resolve, reject) => {
        const tmp = dbPath + '.tmp';
        const out = createWriteStream(tmp);
        res.pipe(createGunzip()).pipe(out);
        out.on('finish', () => { out.close(); renameSync(tmp, dbPath); resolve(); });
        out.on('error', (e) => { try {
            unlinkSync(tmp);
        }
        catch { } reject(e); });
        res.on('error', (e) => { try {
            unlinkSync(tmp);
        }
        catch { } reject(e); });
    });
    const mb = (statSync(dbPath).size / 1024 / 1024).toFixed(1);
    console.error(`[${SERVER_NAME}] Database downloaded (${mb} MB)`);
    // Convert WAL → delete journal mode so readonly open works with node-sqlite3-wasm.
    // The WASM SQLite can't handle WAL at all, so use the system sqlite3 CLI.
    try {
        execFileSync('sqlite3', [dbPath, 'PRAGMA journal_mode = delete;']);
        console.error(`[${SERVER_NAME}] Converted journal mode to delete`);
    }
    catch {
        console.error(`[${SERVER_NAME}] Warning: could not convert WAL mode (sqlite3 CLI not found)`);
    }
}
function closeDb() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
        console.error(`[${SERVER_NAME}] Database closed`);
    }
}
function computeAboutContext() {
    let fingerprint = 'unknown';
    let dbBuilt = new Date().toISOString();
    try {
        const dbPath = process.env[DB_ENV_VAR] || getDefaultDbPath();
        const dbBuffer = readFileSync(dbPath);
        fingerprint = createHash('sha256').update(dbBuffer).digest('hex').slice(0, 12);
        const dbStat = statSync(dbPath);
        dbBuilt = dbStat.mtime.toISOString();
    }
    catch {
        // Non-fatal
    }
    return { version: pkgVersion, fingerprint, dbBuilt };
}
const server = new Server({ name: SERVER_NAME, version: pkgVersion }, { capabilities: { tools: {}, resources: {} } });
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    console.error(`[${SERVER_NAME}] ListResources request received`);
    return {
        resources: [
            {
                uri: 'case-law-stats://norwegian-law-mcp/metadata',
                name: 'Case Law Statistics',
                description: 'Metadata about case law data freshness and coverage',
                mimeType: 'application/json',
            },
        ],
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    console.error(`[${SERVER_NAME}] ReadResource: ${uri}`);
    if (uri === 'case-law-stats://norwegian-law-mcp/metadata') {
        try {
            const db = getDb();
            // Check if sync metadata table exists
            const tableExists = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='case_law_sync_metadata'
      `).get();
            if (!tableExists) {
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify({
                                status: 'no_data',
                                message: 'No case law data has been synced yet. Use official Norwegian case-law channels per LEGAL_DATA_LICENSE.md.',
                                last_sync_date: null,
                                last_decision_date: null,
                                total_cases: 0,
                                cases_by_court: {},
                                source: {
                                    name: 'Lovdata',
                                    url: 'https://lovdata.no',
                                    license: 'See LEGAL_DATA_LICENSE.md',
                                    attribution: 'Case-law ingestion is policy-gated; metadata-only mode is default unless redistribution rights are explicit.',
                                },
                                update_frequency: 'weekly',
                                coverage: '1993-present (varies by court)',
                            }, null, 2),
                        },
                    ],
                };
            }
            // Get sync metadata
            const syncMeta = db.prepare(`
        SELECT last_sync_date, last_decision_date, cases_count, source
        FROM case_law_sync_metadata
        WHERE id = 1
      `).get();
            // Get total case count
            const totalRow = db.prepare('SELECT COUNT(*) as count FROM case_law').get();
            const totalCases = totalRow.count;
            // Get cases by court
            const courtCounts = db.prepare(`
        SELECT court, COUNT(*) as count
        FROM case_law
        GROUP BY court
        ORDER BY count DESC
      `).all();
            const casesByCourt = {};
            for (const row of courtCounts) {
                casesByCourt[row.court] = row.count;
            }
            const stats = {
                last_sync_date: syncMeta?.last_sync_date || new Date().toISOString(),
                last_decision_date: syncMeta?.last_decision_date || null,
                total_cases: totalCases,
                cases_by_court: casesByCourt,
                source: {
                    name: syncMeta?.source || 'Lovdata',
                    url: 'https://lovdata.no',
                    license: 'See LEGAL_DATA_LICENSE.md',
                    attribution: 'Case-law ingestion is policy-gated; metadata-only mode is default unless redistribution rights are explicit.',
                },
                update_frequency: 'weekly',
                coverage: '1993-present (varies by court)',
            };
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(stats, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[${SERVER_NAME}] ReadResource failed: ${message}`);
            return {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify({ error: `Failed to read case law stats: ${message}` }, null, 2),
                    },
                ],
            };
        }
    }
    return {
        contents: [
            {
                uri,
                mimeType: 'text/plain',
                text: `Error: Unknown resource URI "${uri}"`,
            },
        ],
    };
});
async function main() {
    console.error(`[${SERVER_NAME}] Starting server v${pkgVersion}...`);
    const dbPath = process.env[DB_ENV_VAR] || getDefaultDbPath();
    await ensureDatabase(dbPath);
    const aboutContext = computeAboutContext();
    registerTools(server, getDb(), aboutContext);
    const transport = new StdioServerTransport();
    process.on('SIGINT', () => {
        console.error(`[${SERVER_NAME}] Shutting down...`);
        closeDb();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        console.error(`[${SERVER_NAME}] Shutting down...`);
        closeDb();
        process.exit(0);
    });
    await server.connect(transport);
    console.error(`[${SERVER_NAME}] Server started successfully`);
}
main().catch((error) => {
    console.error(`[${SERVER_NAME}] Fatal error:`, error);
    closeDb();
    process.exit(1);
});
//# sourceMappingURL=index.js.map
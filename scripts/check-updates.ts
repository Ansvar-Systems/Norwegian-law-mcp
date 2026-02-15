#!/usr/bin/env tsx
/**
 * Check for updates to ingested Norwegian statutes.
 *
 * Source strategy:
 * - Lovdata statute deep links (official source)
 * - Page metadata checks for published update cues
 *
 * Usage: npm run check-updates
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../data/database.db');

const USER_AGENT = 'Norwegian-Law-MCP/1.0.0 (+https://github.com/Ansvar-Systems/norwegian-law-mcp)';
const REQUEST_DELAY_MS = 500;
const LOV_ID_PATTERN = /^LOV-(\d{4})-(\d{2})-(\d{2})(?:-([A-Za-z0-9]+))?$/i;

interface LocalDocument {
  id: string;
  title: string;
  type: string;
  status: string;
  last_updated: string | null;
  url: string | null;
}

interface UpdateCheckResult {
  id: string;
  title: string;
  local_date: string | null;
  remote_date: string | null;
  source_url: string | null;
  has_update: boolean;
  error?: string;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildLovdataCandidates(doc: LocalDocument): string[] {
  const candidates = new Set<string>();

  if (doc.url) {
    candidates.add(doc.url);
  }

  const match = doc.id.match(LOV_ID_PATTERN);
  if (match) {
    const [, year, month, day, suffix] = match;
    const normalizedSuffix = suffix ? suffix.toLowerCase() : undefined;
    const slug = normalizedSuffix ? `${year}-${month}-${day}-${normalizedSuffix}` : `${year}-${month}-${day}`;
    candidates.add(`https://lovdata.no/dokument/NL/lov/${slug}`);
    candidates.add(`https://lovdata.no/dokument/NLO/lov/${slug}`);
  }

  return Array.from(candidates);
}

function extractRemoteDate(html: string): string | null {
  const patterns: RegExp[] = [
    /modified_time["']?\s*content=["'](\d{4}-\d{2}-\d{2})/i,
    /sist\s+endret[^\d]*(\d{4}-\d{2}-\d{2})/i,
    /sist\s+oppdatert[^\d]*(\d{4}-\d{2}-\d{2})/i,
    /last\s+updated[^\d]*(\d{4}-\d{2}-\d{2})/i,
    /\b(\d{4}-\d{2}-\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

async function fetchRemoteDate(url: string): Promise<{ remoteDate: string | null; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      return { remoteDate: null, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    return { remoteDate: extractRemoteDate(html) };
  } catch (err) {
    return {
      remoteDate: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkOfficialSourceForUpdates(doc: LocalDocument): Promise<UpdateCheckResult> {
  const candidates = buildLovdataCandidates(doc);

  if (candidates.length === 0) {
    return {
      id: doc.id,
      title: doc.title,
      local_date: doc.last_updated,
      remote_date: null,
      source_url: null,
      has_update: false,
      error: 'No official source URL available',
    };
  }

  let lastError: string | undefined;

  for (const candidate of candidates) {
    const result = await fetchRemoteDate(candidate);

    if (result.error) {
      lastError = `${candidate}: ${result.error}`;
      continue;
    }

    const remoteDate = result.remoteDate;
    const hasUpdate = remoteDate != null && doc.last_updated != null && remoteDate > doc.last_updated;

    return {
      id: doc.id,
      title: doc.title,
      local_date: doc.last_updated,
      remote_date: remoteDate,
      source_url: candidate,
      has_update: hasUpdate,
    };
  }

  return {
    id: doc.id,
    title: doc.title,
    local_date: doc.last_updated,
    remote_date: null,
    source_url: candidates[0] ?? null,
    has_update: false,
    error: lastError ?? 'Unable to fetch official source metadata',
  };
}

async function checkUpdates(): Promise<void> {
  console.log('Norwegian Law MCP - Update Checker');
  console.log('');

  if (!fs.existsSync(DB_PATH)) {
    console.log('Database not found:', DB_PATH);
    console.log('Run "npm run build:db" first.');
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });

  const documents = db.prepare(`
    SELECT id, title, type, status, last_updated, url
    FROM legal_documents
    WHERE type = 'statute'
    ORDER BY id
  `).all() as LocalDocument[];

  db.close();

  if (documents.length === 0) {
    console.log('No statutes in database.');
    process.exit(0);
  }

  console.log(`Checking ${documents.length} statute(s) against official channels...\n`);

  const results: UpdateCheckResult[] = [];

  for (const doc of documents) {
    process.stdout.write(`  ${doc.id} (${doc.title.substring(0, 40)})... `);

    const result = await checkOfficialSourceForUpdates(doc);
    results.push(result);

    if (result.error) {
      console.log(`error: ${result.error}`);
    } else if (result.has_update) {
      console.log('UPDATE AVAILABLE');
    } else {
      console.log('up to date');
    }

    await delay(REQUEST_DELAY_MS);
  }

  console.log('');
  const updates = results.filter(r => r.has_update);
  const errors = results.filter(r => r.error);
  const current = results.filter(r => !r.has_update && !r.error);

  console.log(`Up to date: ${current.length}`);
  console.log(`Updates:    ${updates.length}`);
  console.log(`Errors:     ${errors.length}`);

  if (updates.length > 0) {
    console.log('');
    console.log('To refresh metadata for updated statutes:');
    for (const u of updates) {
      const safeId = u.id.replace(/[^A-Za-z0-9_-]/g, '_');
      console.log(`  npm run ingest -- ${u.id} data/seed/${safeId}.json`);
    }
    console.log('  npm run build:db');
    process.exit(1);
  }
}

checkUpdates().catch(error => {
  console.error('Check failed:', error.message);
  process.exit(1);
});

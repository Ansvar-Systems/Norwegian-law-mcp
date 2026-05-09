/**
 * Smoke test for norwegian-law-mcp.
 *
 * Verifies the database is built, contains Norwegian content, and that
 * core retrieval tools emit Gate 13-compliant `_citation` triples.
 *
 * This is a v0.1 smoke test that replaces the inherited Swedish test
 * suite. Full Norwegian test migration is tracked as a follow-up
 * (per the Norwegian rebuild Phase 1 build handover).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from '@ansvar/mcp-sqlite';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

import { searchLegislation } from '../src/tools/search-legislation.js';
import { getProvision } from '../src/tools/get-provision.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../data/database.db');

// Skip the suite when the on-disk DB is missing or a 0-byte stub. The
// release-pattern (manifest db_release_path) provisions the real DB at GHCR
// build time; locally the file is intentionally empty until `npm run build:db`
// or `gh release download` populates it. Per memory
// feedback_contract_test_skip_on_empty_db_2026_05_07.md.
const dbReady =
  fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).size > 1024;
const describeFn = dbReady ? describe : describe.skip;

describeFn('norwegian-law-mcp smoke', () => {
  let db: InstanceType<typeof Database>;

  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });

  afterAll(() => {
    db?.close();
  });

  it('database has Norwegian statutes', () => {
    const row = db
      .prepare("SELECT count(*) as n FROM legal_documents WHERE type IN ('statute','regulation')")
      .get() as { n: number };
    expect(row.n).toBeGreaterThan(0);
  });

  it('search_legislation returns Norwegian results with valid _citation triple', async () => {
    const response = await searchLegislation(db, { query: 'personopplysninger', limit: 1 });
    expect(Array.isArray(response.results)).toBe(true);
    expect(response.results.length).toBeGreaterThan(0);

    const item = response.results[0];
    expect(item._citation).toBeDefined();
    expect(item._citation.publisher).toBe('lovdata.no');
    expect(item._citation.license).toBe('NLOD-2.0');
    expect(item._citation.source_url).toMatch(/^https:\/\/lovdata\.no\/dokument\//);
  });

  it('get_provision returns top-level _citation with correct publisher + license', async () => {
    // Pick a real document from the corpus.
    const doc = db
      .prepare("SELECT id FROM legal_documents WHERE type='statute' LIMIT 1")
      .get() as { id: string } | undefined;
    expect(doc).toBeDefined();
    if (!doc) return;

    const prov = db
      .prepare('SELECT provision_ref FROM legal_provisions WHERE document_id = ? LIMIT 1')
      .get(doc.id) as { provision_ref: string } | undefined;

    if (!prov) {
      console.warn('No provisions for sample doc; skipping get_provision citation check');
      return;
    }

    const response = await getProvision(db, {
      document_id: doc.id,
      provision_ref: prov.provision_ref,
    });
    // _citation is at the top level of the ToolResponse, not inside results.
    expect(response._citation).toBeDefined();
    expect(response._citation?.publisher).toBe('lovdata.no');
    expect(response._citation?.license).toBe('NLOD-2.0');
    expect(response._citation?.source_url).toMatch(/^https:\/\/lovdata\.no\/dokument\//);
  });
});
